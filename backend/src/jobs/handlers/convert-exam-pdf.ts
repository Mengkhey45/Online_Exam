import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { convertedBlocks, importPages, imports } from "@/db/schema";
import type { JobRow } from "@/db/schema/jobs";
import { newId } from "@/lib/ids";
import { logger } from "@/lib/logger";
import { downloadPdf } from "@/lib/storage";
import { loadPdf, renderPageToImage } from "@/lib/pdf/pdf";
import { convertPageImage } from "@/lib/ai/convert";
import { checkNumericIntegrity } from "@/lib/ai/numeric-integrity";

const MAX_PAGE_ATTEMPTS = 3;

/**
 * Convert an uploaded exam PDF into reviewable blocks (AGENTS §8).
 * - Chunk by page; each page is one unit of work with bounded retries.
 * - Rendered page IMAGES go to the vision model (not extracted text).
 * - numeric-integrity runs on every block; warned blocks stay unreviewed.
 * - Idempotent: re-running replaces a page's blocks rather than duplicating.
 * - The worker carries organization_id and scopes every write itself.
 */
export async function convertExamPdf(job: JobRow): Promise<void> {
  const orgId = job.organizationId;
  const importId = job.payload["importId"];
  if (typeof importId !== "string") {
    throw new Error("convert-exam-pdf: payload.importId is required");
  }

  const [imp] = await db
    .select()
    .from(imports)
    .where(and(eq(imports.id, importId), eq(imports.organizationId, orgId)))
    .limit(1);
  if (!imp) throw new Error(`convert-exam-pdf: import ${importId} not found`);

  await db
    .update(imports)
    .set({ status: "processing", updatedAt: new Date() })
    .where(eq(imports.id, importId));

  const bytes = await downloadPdf(imp.sourceUrl);
  const pdf = await loadPdf(bytes);

  // Seed page rows once (idempotent — skip if they already exist).
  const existingPages = await db
    .select()
    .from(importPages)
    .where(
      and(
        eq(importPages.importId, importId),
        eq(importPages.organizationId, orgId),
      ),
    );

  if (existingPages.length === 0) {
    for (let i = 0; i < pdf.numPages; i++) {
      const lines = await pdf.getPageLines(i);
      await db.insert(importPages).values({
        id: newId("job"),
        organizationId: orgId,
        importId,
        pageIndex: i,
        label: `Page ${i + 1}`,
        sourceText: lines,
        status: "pending",
      });
    }
    await db
      .update(imports)
      .set({ pageCount: pdf.numPages, updatedAt: new Date() })
      .where(eq(imports.id, importId));
  }

  const pages = await db
    .select()
    .from(importPages)
    .where(
      and(
        eq(importPages.importId, importId),
        eq(importPages.organizationId, orgId),
      ),
    );

  let done = 0;
  for (const page of pages) {
    if (page.status === "done" || page.status === "manual") {
      done += 1;
      continue;
    }
    try {
      await convertOnePage(orgId, importId, page.id);
      await db
        .update(importPages)
        .set({ status: "done" })
        .where(eq(importPages.id, page.id));
      done += 1;
    } catch (err) {
      const attempts = page.attempts + 1;
      const status = attempts >= MAX_PAGE_ATTEMPTS ? "manual" : "pending";
      await db
        .update(importPages)
        .set({
          attempts,
          status,
          lastError: err instanceof Error ? err.message : "conversion failed",
        })
        .where(eq(importPages.id, page.id));
      if (status === "manual") done += 1;
      logger.warn(
        { importId, pageId: page.id, attempts },
        "page conversion failed",
      );
    }
    await db
      .update(imports)
      .set({ pagesDone: done, updatedAt: new Date() })
      .where(eq(imports.id, importId));
  }

  await db
    .update(imports)
    .set({ status: "done", updatedAt: new Date() })
    .where(eq(imports.id, importId));
}

/** Convert a single page and replace its converted blocks (idempotent). */
async function convertOnePage(
  orgId: string,
  importId: string,
  pageId: string,
): Promise<void> {
  const [page] = await db
    .select()
    .from(importPages)
    .where(eq(importPages.id, pageId))
    .limit(1);
  if (!page) throw new Error("page not found");

  const pdf = await reloadForPage(orgId, importId);
  const image = await renderPageToImage(pdf, page.pageIndex);
  const blocks = await convertPageImage({
    imageBase64: image.base64,
    mediaType: image.mediaType,
  });
  const sourceText = page.sourceText.join("\n");

  // Replace any prior blocks for this page so re-runs don't duplicate.
  await db
    .delete(convertedBlocks)
    .where(
      and(
        eq(convertedBlocks.pageId, pageId),
        eq(convertedBlocks.organizationId, orgId),
      ),
    );

  for (const [i, block] of blocks.entries()) {
    const mismatch = checkNumericIntegrity(block, sourceText);
    await db.insert(convertedBlocks).values({
      id: newId("job"),
      organizationId: orgId,
      importId,
      pageId,
      number: page.pageIndex * 1000 + i,
      block,
      confidence: block.confidence ?? "medium",
      // Never auto-mark reviewed; a numeric mismatch especially must be
      // reviewed by a human (AGENTS §3.5 / §3.6).
      reviewed: false,
      numericMismatch: mismatch,
    });
  }
}

async function reloadForPage(orgId: string, importId: string) {
  const [imp] = await db
    .select()
    .from(imports)
    .where(and(eq(imports.id, importId), eq(imports.organizationId, orgId)))
    .limit(1);
  if (!imp) throw new Error("import not found");
  const bytes = await downloadPdf(imp.sourceUrl);
  return loadPdf(bytes);
}

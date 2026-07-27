import { asc, desc, eq } from "drizzle-orm";
import { scopedDb } from "@/db/scoped";
import {
  convertedBlocks,
  examQuestions,
  examSections,
  exams,
  importPages,
  imports,
  jobs,
} from "@/db/schema";
import type { ConvertedBlockRow } from "@/db/schema/imports";
import { newId } from "@/lib/ids";
import { badRequest, conflict, notFound } from "@/lib/errors";
import { userStorage } from "@/lib/storage";
import type { RequestContext } from "@/middleware/context";
import type {
  ApplyConversionInput,
  CreateImportInput,
  PatchBlockInput,
} from "./ai-import.schema";

/** Signed upload URL for the exam PDF (AGENTS §8). Uses the caller's JWT (§10). */
export async function createUploadUrl(
  ctx: RequestContext,
  userJwt: string,
  filename: string,
) {
  const path = `${ctx.organizationId}/${newId("imp")}/${filename}`;
  const { data, error } = await userStorage(userJwt).createSignedUploadUrl(path);
  if (error || !data) {
    throw badRequest("UPLOAD_URL_FAILED", "Couldn’t create an upload URL.");
  }
  return { path, token: data.token, signedUrl: data.signedUrl };
}

/** Enqueue a conversion job (AGENTS §8). Rows land unreviewed (rule 3.6). */
export async function createImport(
  ctx: RequestContext,
  input: CreateImportInput,
) {
  const sdb = scopedDb(ctx.organizationId);
  const importId = newId("imp");

  await sdb.db.insert(imports).values(
    sdb.withOrg({
      id: importId,
      examId: input.examId,
      kind: "exam_pdf",
      status: "pending",
      filename: input.filename,
      sourceUrl: input.sourceUrl,
    }),
  );

  // The jobs table is the queue; the worker picks this up.
  await sdb.db.insert(jobs).values(
    sdb.withOrg({
      id: newId("job"),
      type: "convert-exam-pdf",
      status: "pending",
      payload: { importId },
    }),
  );

  return { importId };
}

/** Status + converted blocks, shaped for the AI review screen (frontend §7). */
export async function getImport(ctx: RequestContext, importId: string) {
  const sdb = scopedDb(ctx.organizationId);
  const [imp] = await sdb.db
    .select()
    .from(imports)
    .where(sdb.where(imports, eq(imports.id, importId)))
    .limit(1);
  if (!imp) throw notFound("Import not found");

  const [pageRows, blockRows] = await Promise.all([
    sdb.db
      .select()
      .from(importPages)
      .where(sdb.where(importPages, eq(importPages.importId, importId)))
      .orderBy(asc(importPages.pageIndex)),
    sdb.db
      .select()
      .from(convertedBlocks)
      .where(sdb.where(convertedBlocks, eq(convertedBlocks.importId, importId)))
      .orderBy(asc(convertedBlocks.number)),
  ]);

  return {
    importId: imp.id,
    examId: imp.examId,
    status: imp.status,
    pageCount: imp.pageCount,
    pagesDone: imp.pagesDone,
    pages: pageRows.map((p) => ({
      id: p.id,
      label: p.label,
      lines: p.sourceText,
    })),
    blocks: blockRows.map((r) => ({
      id: r.id,
      pageId: r.pageId,
      number: r.number,
      type: r.block.type,
      stem: r.block.stem,
      options: r.block.options,
      confidence: r.confidence,
      reviewed: r.reviewed,
      numericMismatch: r.numericMismatch ?? undefined,
    })),
  };
}

/** Mark a block reviewed and/or edit its content (AGENTS §8). */
export async function patchBlock(
  ctx: RequestContext,
  importId: string,
  blockId: string,
  input: PatchBlockInput,
) {
  const sdb = scopedDb(ctx.organizationId);
  const patch: Record<string, unknown> = {};
  if (input.reviewed !== undefined) patch.reviewed = input.reviewed;
  if (input.block !== undefined) patch.block = input.block;
  if (Object.keys(patch).length === 0) return { ok: true };

  const updated = await sdb.db
    .update(convertedBlocks)
    .set(patch)
    .where(sdb.where(convertedBlocks, eq(convertedBlocks.id, blockId)))
    .returning({ id: convertedBlocks.id });
  if (updated.length === 0) throw notFound("Block not found");
  void importId;
  return { ok: true };
}

/**
 * Approve the conversion and hand off to the exam module (AGENTS §8, §11 —
 * this is the sanctioned review gate; the worker never writes exam content
 * directly). Every block must be reviewed first (rule 3.6).
 */
export async function approveImport(ctx: RequestContext, importId: string) {
  const sdb = scopedDb(ctx.organizationId);
  const [imp] = await sdb.db
    .select()
    .from(imports)
    .where(sdb.where(imports, eq(imports.id, importId)))
    .limit(1);
  if (!imp) throw notFound("Import not found");
  if (!imp.examId) {
    throw badRequest("NO_TARGET_EXAM", "This import has no target exam.");
  }

  const blocks = await sdb.db
    .select()
    .from(convertedBlocks)
    .where(sdb.where(convertedBlocks, eq(convertedBlocks.importId, importId)))
    .orderBy(asc(convertedBlocks.number));

  const unreviewed = blocks.filter((b) => !b.reviewed).length;
  if (unreviewed > 0) {
    throw conflict(
      "UNREVIEWED_BLOCKS",
      `${unreviewed} block(s) still need review before applying.`,
      { unreviewed },
    );
  }

  await snapshotBlocksIntoExam(ctx, imp.examId, blocks);

  await sdb.db
    .update(imports)
    .set({ status: "done", updatedAt: new Date() })
    .where(sdb.where(imports, eq(imports.id, importId)));

  return { applied: blocks.length, examId: imp.examId };
}

/**
 * Snapshot reviewed converted blocks into a draft exam (§3.3 — snapshot
 * content, §11 — the sanctioned handoff from ai-import into the exam module).
 * Appends to the exam's first section, creating one if none exists.
 */
async function snapshotBlocksIntoExam(
  ctx: RequestContext,
  examId: string,
  blockRows: ConvertedBlockRow[],
): Promise<void> {
  const sdb = scopedDb(ctx.organizationId);

  const [section] = await sdb.db
    .select()
    .from(examSections)
    .where(sdb.where(examSections, eq(examSections.examId, examId)))
    .orderBy(asc(examSections.position))
    .limit(1);
  let sectionId = section?.id;
  if (!sectionId) {
    sectionId = newId("sec");
    await sdb.db.insert(examSections).values(
      sdb.withOrg({
        id: sectionId,
        examId,
        title: "Imported",
        position: 0,
      }),
    );
  }

  const [existing] = await sdb.db
    .select({ n: examQuestions.position })
    .from(examQuestions)
    .where(sdb.where(examQuestions, eq(examQuestions.sectionId, sectionId)))
    .orderBy(desc(examQuestions.position))
    .limit(1);
  let position = (existing?.n ?? -1) + 1;

  for (const row of blockRows) {
    const b = row.block;
    await sdb.db.insert(examQuestions).values(
      sdb.withOrg({
        id: newId("q"),
        examId,
        sectionId,
        type: b.type,
        stem: b.stem,
        marks: b.marks,
        required: b.required,
        options: b.options ?? null,
        blanks: b.blanks ?? null,
        reviewed: true,
        confidence: row.confidence,
        position: position++,
      }),
    );
  }
}

/** The exam's most recent conversion, or 404 if it has none. */
async function latestImportForExam(
  ctx: RequestContext,
  examId: string,
): Promise<string> {
  const sdb = scopedDb(ctx.organizationId);
  const [imp] = await sdb.db
    .select({ id: imports.id })
    .from(imports)
    .where(sdb.where(imports, eq(imports.examId, examId)))
    .orderBy(desc(imports.createdAt))
    .limit(1);
  if (!imp) throw notFound("No conversion for this exam");
  return imp.id;
}

/**
 * Conversion keyed by exam (frontend §7 review screen calls
 * GET /exams/:examId/conversion). Resolves the exam's latest import and shapes
 * it for the review UI, adding the exam title the screen shows.
 */
export async function getConversionByExam(ctx: RequestContext, examId: string) {
  const importId = await latestImportForExam(ctx, examId);
  const conversion = await getImport(ctx, importId);

  const sdb = scopedDb(ctx.organizationId);
  const [exam] = await sdb.db
    .select({ title: exams.title })
    .from(exams)
    .where(sdb.where(exams, eq(exams.id, examId)))
    .limit(1);

  return { ...conversion, title: exam?.title ?? "" };
}

/**
 * Apply a reviewed conversion to the exam (frontend §7 calls
 * POST /exams/:examId/conversion/apply). Marks the reviewed blocks, then
 * snapshots every non-discarded block into the exam draft. Pages the teacher
 * chose to discard keep their original PDF and are not converted (§7). The
 * review gate still holds: any non-discarded block left unreviewed is a 409.
 */
export async function applyConversionByExam(
  ctx: RequestContext,
  examId: string,
  input: ApplyConversionInput,
): Promise<{ ok: true }> {
  const sdb = scopedDb(ctx.organizationId);
  const importId = await latestImportForExam(ctx, examId);

  // Persist the teacher's review decisions (rule 3.6 — explicit human review).
  for (const blockId of input.reviewedBlockIds) {
    await sdb.db
      .update(convertedBlocks)
      .set({ reviewed: true })
      .where(
        sdb.where(
          convertedBlocks,
          eq(convertedBlocks.id, blockId),
        ),
      );
  }

  const blocks = await sdb.db
    .select()
    .from(convertedBlocks)
    .where(sdb.where(convertedBlocks, eq(convertedBlocks.importId, importId)))
    .orderBy(asc(convertedBlocks.number));

  const discarded = new Set(input.discardedPageIds);
  const active = blocks.filter((b) => !discarded.has(b.pageId));

  const unreviewed = active.filter((b) => !b.reviewed).length;
  if (unreviewed > 0) {
    throw conflict(
      "UNREVIEWED_BLOCKS",
      `${unreviewed} block(s) still need review before applying.`,
      { unreviewed },
    );
  }

  await snapshotBlocksIntoExam(ctx, examId, active);

  await sdb.db
    .update(imports)
    .set({ status: "done", updatedAt: new Date() })
    .where(sdb.where(imports, eq(imports.id, importId)));

  return { ok: true };
}

import { eq } from "drizzle-orm";
import { scopedDb } from "@/db/scoped";
import { rosterImports, rosterStaging, students } from "@/db/schema";
import type { StagedRowData } from "@/db/schema/roster";
import type { JobRow } from "@/db/schema/jobs";
import { newId } from "@/lib/ids";
import { logger } from "@/lib/logger";
import { downloadPdf } from "@/lib/storage";
import { loadPdf } from "@/lib/pdf/pdf";
import { extractRoster, type RosterImage } from "@/lib/ai/extract-roster";
import { validateRows } from "@/modules/roster";

/**
 * Import a roster from a photo/scan/PDF using AI (AGENTS §8). Extracted rows
 * land in roster_staging — the SAME place the CSV import uses — so the teacher
 * reviews and confirms them through the existing flow (rule 3.6: nothing becomes
 * a student without an explicit confirm). Never log names or document content.
 */
export async function importRosterPdf(job: JobRow): Promise<void> {
  const orgId = job.organizationId;
  const rosterImportId = str(job.payload["rosterImportId"]);
  const sourceUrl = str(job.payload["sourceUrl"]);
  const filename = str(job.payload["filename"]) ?? "";
  const prompt = str(job.payload["prompt"]);
  if (!rosterImportId || !sourceUrl) {
    throw new Error("import-roster-pdf: rosterImportId and sourceUrl required");
  }

  const sdb = scopedDb(orgId);
  const bytes = await downloadPdf(sourceUrl);

  // Turn the file into page images the vision model can read.
  const images = await toImages(bytes, filename);

  const extracted = await extractRoster({ images, prompt });

  // Existing student IDs, so the validator can flag "already in the roster".
  const refRows = await sdb.db
    .select({ ref: students.studentRef })
    .from(students)
    .where(sdb.where(students));
  const existingRefs = new Set(refRows.map((r) => r.ref));

  const staged = extracted.map((r, i) => ({
    id: newId("std"),
    importId: rosterImportId,
    rowIndex: i,
    data: {
      studentRef: r.studentRef.trim(),
      name: r.name.trim(),
      email: r.email.trim(),
      program: "",
    } as StagedRowData,
  }));
  const problems = validateRows(staged, existingRefs);

  if (staged.length > 0) {
    await sdb.db.insert(rosterStaging).values(
      staged.map((r) =>
        sdb.withOrg({
          id: r.id,
          importId: rosterImportId,
          rowIndex: r.rowIndex,
          data: r.data,
          problems: problems.get(r.id) ?? {},
        }),
      ),
    );
  }

  // Ready for the teacher to review (same state as a CSV import).
  await sdb.db
    .update(rosterImports)
    .set({ status: "staged" })
    .where(sdb.where(rosterImports, eq(rosterImports.id, rosterImportId)));

  logger.info(
    { jobId: job.id, rosterImportId, rows: staged.length },
    "roster scan extracted",
  );
}

function str(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

/** PDF → one PNG per page; a plain image → itself. */
async function toImages(
  bytes: Uint8Array,
  filename: string,
): Promise<RosterImage[]> {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".pdf")) {
    const pdf = await loadPdf(bytes);
    const images: RosterImage[] = [];
    for (let i = 0; i < pdf.numPages; i++) {
      const png = await pdf.renderPage(i);
      images.push({ base64: png.base64, mediaType: "image/png" });
    }
    return images;
  }
  const mediaType: RosterImage["mediaType"] = lower.endsWith(".png")
    ? "image/png"
    : "image/jpeg";
  return [{ base64: Buffer.from(bytes).toString("base64"), mediaType }];
}

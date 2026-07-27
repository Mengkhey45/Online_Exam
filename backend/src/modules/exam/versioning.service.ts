import { desc, eq } from "drizzle-orm";
import { scopedDb } from "@/db/scoped";
import { examVersions } from "@/db/schema";
import { newId } from "@/lib/ids";
import { notFound } from "@/lib/errors";
import type { RequestContext } from "@/middleware/context";
import type { Exam } from "@/schema";
import { computeTotalMarks } from "./exam.mapping";

/**
 * Versioning (Mengkhey §7). A published snapshot is written once into
 * exam_versions and NEVER mutated (AGENTS §3.4). Every attempt references a
 * version_id; editing a published exam creates a new version.
 */
export async function nextVersionNumber(
  ctx: RequestContext,
  examId: string,
): Promise<number> {
  const sdb = scopedDb(ctx.organizationId);
  const [latest] = await sdb.db
    .select({ n: examVersions.versionNumber })
    .from(examVersions)
    .where(sdb.where(examVersions, eq(examVersions.examId, examId)))
    .orderBy(desc(examVersions.versionNumber))
    .limit(1);
  return (latest?.n ?? 0) + 1;
}

/** Freeze a draft exam into an immutable version snapshot. */
export async function createVersion(
  ctx: RequestContext,
  examId: string,
  draft: Exam,
): Promise<{ id: string; versionNumber: number; totalMarks: number }> {
  const sdb = scopedDb(ctx.organizationId);
  const versionNumber = await nextVersionNumber(ctx, examId);
  const versionId = newId("ver");
  const totalMarks = computeTotalMarks(draft.sections);

  // The snapshot carries its own version id so it is self-describing.
  const snapshot: Exam = { ...draft, versionId, status: "published" };

  await sdb.db.insert(examVersions).values(
    sdb.withOrg({
      id: versionId,
      examId,
      versionNumber,
      snapshot,
      totalMarks,
    }),
  );
  return { id: versionId, versionNumber, totalMarks };
}

export async function getVersion(ctx: RequestContext, versionId: string) {
  const sdb = scopedDb(ctx.organizationId);
  const [row] = await sdb.db
    .select()
    .from(examVersions)
    .where(sdb.where(examVersions, eq(examVersions.id, versionId)))
    .limit(1);
  if (!row) throw notFound("Exam version not found");
  return row;
}

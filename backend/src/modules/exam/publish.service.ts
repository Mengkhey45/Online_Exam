import { eq } from "drizzle-orm";
import { scopedDb } from "@/db/scoped";
import { exams } from "@/db/schema";
import { badRequest, conflict, notFound } from "@/lib/errors";
import type { RequestContext } from "@/middleware/context";
import { getExam } from "./exam.service";
import { createVersion } from "./versioning.service";

/**
 * Publishing (Mengkhey §7). Assembles the current draft, refuses to publish
 * while any AI-imported block is unreviewed (rule 3.6), writes an immutable
 * version snapshot (§3.4), and flips the exam to published.
 *
 * In-progress attempts are unaffected — they keep the version they started on
 * (version-isolation.test).
 */
export async function publishExam(ctx: RequestContext, examId: string) {
  const sdb = scopedDb(ctx.organizationId);
  const draft = await getExam(ctx, examId);

  const blocks = draft.sections.flatMap((s) => s.blocks);
  if (blocks.length === 0) {
    throw badRequest(
      "EXAM_EMPTY",
      "Add at least one question before publishing.",
    );
  }

  // Nothing publishes with an unreviewed AI-imported block (§3.6).
  const unreviewed = blocks.filter((b) => b.reviewed === false).length;
  if (unreviewed > 0) {
    throw conflict(
      "UNREVIEWED_BLOCKS",
      `${unreviewed} AI-imported block(s) are not reviewed yet.`,
      { unreviewed },
    );
  }

  const version = await createVersion(ctx, examId, draft);

  const updated = await sdb.db
    .update(exams)
    .set({
      status: "published",
      currentVersionId: version.id,
      totalMarks: version.totalMarks,
      updatedAt: new Date(),
    })
    .where(sdb.where(exams, eq(exams.id, examId)))
    .returning({ id: exams.id });

  if (updated.length === 0) throw notFound("Exam not found");
  return { versionId: version.id, versionNumber: version.versionNumber };
}

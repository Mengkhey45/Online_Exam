import { and, eq, inArray, isNull } from "drizzle-orm";
import { scopedDb } from "@/db/scoped";
import {
  answers as answersTable,
  attempts,
  examVersions,
  exams,
} from "@/db/schema";
import type { AnswerRow } from "@/db/schema/answers";
import { conflict, notFound } from "@/lib/errors";
import type { RequestContext } from "@/middleware/context";
import type { Block, Exam } from "@/schema";
import { isAutoScored } from "./scoring";

/** Render a student's answer to displayable text for the grader. */
function renderAnswer(block: Block, row: AnswerRow | undefined): string {
  if (!row) return "";
  switch (block.type) {
    case "mcq":
    case "multi_select": {
      const byId = new Map((block.options ?? []).map((o) => [o.id, o.text]));
      return (row.optionIds ?? []).map((id) => byId.get(id) ?? id).join(", ");
    }
    case "fill_blank":
      return Object.values(row.blankAnswers ?? {}).join(" / ");
    default:
      return row.text ?? "";
  }
}

/**
 * Grading feed (AGENTS §7). Reads the version's CANONICAL order and ignores
 * presented order. Responses are keyed by anonymised student ID until results
 * are released (rule 3.5). The frontend chooses by-question vs by-student.
 */
export async function getGrading(ctx: RequestContext, examId: string) {
  const sdb = scopedDb(ctx.organizationId);
  const [exam] = await sdb.db
    .select()
    .from(exams)
    .where(sdb.where(exams, eq(exams.id, examId)))
    .limit(1);
  if (!exam || !exam.currentVersionId) throw notFound("Exam not found");

  const [version] = await sdb.db
    .select()
    .from(examVersions)
    .where(sdb.where(examVersions, eq(examVersions.id, exam.currentVersionId)))
    .limit(1);
  if (!version) throw notFound("Exam version not found");
  const snapshot: Exam = version.snapshot;

  const attemptRows = await sdb.db
    .select()
    .from(attempts)
    .where(sdb.where(attempts, eq(attempts.examId, examId)));
  const attemptIds = attemptRows.map((a) => a.id);

  const answerRows = attemptIds.length
    ? await sdb.db
        .select()
        .from(answersTable)
        .where(
          sdb.where(answersTable, inArray(answersTable.attemptId, attemptIds)),
        )
    : [];

  // answers[attemptId][questionId]
  const byAttempt = new Map<string, Map<string, AnswerRow>>();
  for (const r of answerRows) {
    const m = byAttempt.get(r.attemptId) ?? new Map();
    m.set(r.questionId, r);
    byAttempt.set(r.attemptId, m);
  }

  const questions = [];
  let number = 0;
  for (const section of snapshot.sections) {
    for (const block of section.blocks) {
      if (block.type === "content" || block.type === "section") continue;
      number += 1;
      const responses = attemptRows.map((a) => {
        const row = byAttempt.get(a.id)?.get(block.id);
        return {
          // The answer row id — the frontend scores via PUT /answers/:id/score.
          // null when the student has no answer for this question yet.
          answerId: row?.id ?? null,
          attemptId: a.id,
          studentId: a.studentId,
          answerText: renderAnswer(block, row),
          autoScore: row?.autoScore ?? null,
          awarded: row?.awardedMarks ?? null,
          comment: row?.comment ?? "",
        };
      });
      questions.push({
        id: block.id,
        number,
        type: block.type,
        stem: block.stem,
        maxMarks: block.marks,
        autoScored: isAutoScored(block.type),
        rubric: [] as string[],
        responses,
      });
    }
  }

  return {
    examId,
    title: exam.title,
    released: exam.resultsReleasedAt !== null,
    questions,
  };
}

/** Teacher scores / overrides one answer (AGENTS §7). Server is authoritative. */
export async function scoreAnswer(
  ctx: RequestContext,
  answerId: string,
  awarded: number | null,
  comment: string,
) {
  const sdb = scopedDb(ctx.organizationId);
  const updated = await sdb.db
    .update(answersTable)
    .set({ awardedMarks: awarded, comment })
    .where(sdb.where(answersTable, eq(answersTable.id, answerId)))
    .returning({ id: answersTable.id });
  if (updated.length === 0) throw notFound("Answer not found");
  return { ok: true };
}

/**
 * Release results (AGENTS §7). Returns 409 unless every recorded answer has a
 * score. After release, teacher screens may de-anonymise and students can see
 * their results.
 */
export async function releaseResults(ctx: RequestContext, examId: string) {
  const sdb = scopedDb(ctx.organizationId);

  const attemptRows = await sdb.db
    .select({ id: attempts.id })
    .from(attempts)
    .where(sdb.where(attempts, eq(attempts.examId, examId)));
  const attemptIds = attemptRows.map((a) => a.id);

  if (attemptIds.length > 0) {
    const [nullScore] = await sdb.db
      .select({ id: answersTable.id })
      .from(answersTable)
      .where(
        sdb.where(
          answersTable,
          and(
            inArray(answersTable.attemptId, attemptIds),
            isNull(answersTable.awardedMarks),
          ),
        ),
      )
      .limit(1);
    if (nullScore) {
      throw conflict(
        "GRADING_INCOMPLETE",
        "Every answer must be scored before releasing results.",
      );
    }
  }

  await sdb.db
    .update(exams)
    .set({ resultsReleasedAt: new Date() })
    .where(sdb.where(exams, eq(exams.id, examId)));
  return { ok: true };
}

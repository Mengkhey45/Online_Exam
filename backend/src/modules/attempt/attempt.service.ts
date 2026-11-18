import { count, eq } from "drizzle-orm";
import { scopedDb } from "@/db/scoped";
import {
  answers as answersTable,
  attempts,
  exams,
  examVersions,
  proctoringEvents,
} from "@/db/schema";
import { newId } from "@/lib/ids";
import { badRequest, conflict, notFound } from "@/lib/errors";
import type { RequestContext } from "@/middleware/context";
import type { Answer, Attempt, Block, Exam } from "@/schema";
import { autoScore } from "@/modules/grading/scoring";
import { buildPresentedLayout } from "./present";
import { mergeAnswers } from "./sync";
import type { CreateAttemptInput } from "./attempt.schema";
import { assertCanMonitorAttempt, assertCanMonitorExam } from "@/lib/access";
import {
  ANSWER_CLOCK_SKEW_MS,
  finalizeExpiredAttempts,
  finalizeIfExpired,
  isPastDeadline,
} from "./expiry";

function blockIndex(exam: Exam): Map<string, Block> {
  const map = new Map<string, Block>();
  for (const s of exam.sections) for (const b of s.blocks) map.set(b.id, b);
  return map;
}

async function loadAttempt(ctx: RequestContext, attemptId: string) {
  const sdb = scopedDb(ctx.organizationId);
  const [attempt] = await sdb.db
    .select()
    .from(attempts)
    .where(sdb.where(attempts, eq(attempts.id, attemptId)))
    .limit(1);
  if (!attempt) throw notFound("Attempt not found");
  return finalizeIfExpired(ctx, attempt);
}

function toAnswer(r: typeof answersTable.$inferSelect): Answer {
  return {
    questionId: r.questionId,
    optionIds: r.optionIds ?? undefined,
    blankAnswers: r.blankAnswers ?? undefined,
    text: r.text ?? undefined,
    fileUrl: r.fileUrl ?? undefined,
    flaggedForReview: r.flaggedForReview,
    updatedAt: r.updatedAt.toISOString(),
  } as Answer;
}

async function loadVersionSnapshot(
  ctx: RequestContext,
  versionId: string,
): Promise<Exam> {
  const sdb = scopedDb(ctx.organizationId);
  const [version] = await sdb.db
    .select()
    .from(examVersions)
    .where(sdb.where(examVersions, eq(examVersions.id, versionId)))
    .limit(1);
  if (!version) throw notFound("Exam version not found");
  return version.snapshot;
}

/** Create an attempt: generate presented order from the published version (§7). */
export async function createAttempt(
  ctx: RequestContext,
  input: CreateAttemptInput,
) {
  const sdb = scopedDb(ctx.organizationId);
  const [exam] = await sdb.db
    .select()
    .from(exams)
    .where(sdb.where(exams, eq(exams.id, input.examId)))
    .limit(1);
  if (!exam) throw notFound("Exam not found");
  if (exam.status !== "published" || !exam.currentVersionId) {
    throw badRequest("EXAM_NOT_PUBLISHED", "This exam is not open for sitting.");
  }

  const snapshot = await loadVersionSnapshot(ctx, exam.currentVersionId);
  const layout = buildPresentedLayout(snapshot);

  const attemptId = newId("att");
  const startedAt = new Date();
  const expiresAt = new Date(
    startedAt.getTime() + exam.durationMinutes * 60_000,
  );

  await sdb.db.insert(attempts).values(
    sdb.withOrg({
      id: attemptId,
      examId: exam.id,
      examVersionId: exam.currentVersionId,
      studentId: input.studentId,
      presentedOrder: layout.presentedOrder,
      presentedOptions: layout.presentedOptions,
      startedAt,
      expiresAt,
    }),
  );
  return { attemptId, expiresAt };
}

/**
 * The ENTIRE sitting in one response (AGENTS §3.3). Never paginated, never a
 * per-question endpoint — students may be on unreliable connections.
 */
export async function getSitting(ctx: RequestContext, attemptId: string) {
  const attempt = await loadAttempt(ctx, attemptId);
  const exam = await loadVersionSnapshot(ctx, attempt.examVersionId);

  const attemptPayload: Attempt = {
    id: attempt.id,
    examVersionId: attempt.examVersionId,
    presentedOrder: attempt.presentedOrder,
    presentedOptions: attempt.presentedOptions,
    status: attempt.status,
    startedAt: attempt.startedAt.toISOString(),
    expiresAt: attempt.expiresAt.toISOString(),
  };
  // Saved answers come back too, so a student on another device (or with
  // cleared storage) sees their work. The client keeps whichever copy is newer.
  const sdb = scopedDb(ctx.organizationId);
  const answerRows = await sdb.db
    .select()
    .from(answersTable)
    .where(sdb.where(answersTable, eq(answersTable.attemptId, attemptId)));
  return { exam, attempt: attemptPayload, answers: answerRows.map(toAnswer) };
}

/**
 * Lightweight status check the runtime polls (lock / unlock / time-up) instead
 * of re-downloading the whole exam (AGENTS §3.3).
 */
export async function getAttemptStatus(ctx: RequestContext, attemptId: string) {
  const attempt = await loadAttempt(ctx, attemptId);
  return {
    status: attempt.status,
    expiresAt: attempt.expiresAt.toISOString(),
    lockReason: attempt.lockReason ? splitLockReason(attempt.lockReason).reason : null,
  };
}

/**
 * Batch sync from the client queue (AGENTS §7). Idempotent, out-of-order,
 * last-write-wins by updatedAt. Objective answers are auto-scored on the way in.
 */
export async function syncAnswers(
  ctx: RequestContext,
  attemptId: string,
  incoming: Answer[],
): Promise<{ accepted: string[] }> {
  const sdb = scopedDb(ctx.organizationId);
  const attempt = await loadAttempt(ctx, attemptId);
  if (attempt.status === "submitted") {
    throw conflict("ATTEMPT_SUBMITTED", "This attempt is already submitted.");
  }
  if (attempt.status === "locked") {
    throw conflict("ATTEMPT_LOCKED", "This attempt is paused until a teacher unlocks it.");
  }
  const exam = await loadVersionSnapshot(ctx, attempt.examVersionId);
  const blocks = blockIndex(exam);

  const existingRows = await sdb.db
    .select()
    .from(answersTable)
    .where(sdb.where(answersTable, eq(answersTable.attemptId, attemptId)));

  const existing = new Map<string, Answer>();
  for (const r of existingRows) existing.set(r.questionId, toAnswer(r));

  // Only accept answers for questions that exist in this version, and only
  // edits made before time ran out (allowing for the student's clock drift).
  const lastEditAt = attempt.expiresAt.getTime() + ANSWER_CLOCK_SKEW_MS;
  const valid = incoming.filter(
    (a) => blocks.has(a.questionId) && Date.parse(a.updatedAt) <= lastEditAt,
  );
  const { toWrite } = mergeAnswers(existing, valid);

  for (const answer of toWrite) {
    const block = blocks.get(answer.questionId)!;
    const score = autoScore(block, answer);
    await sdb.db
      .insert(answersTable)
      .values(
        sdb.withOrg({
          id: newId("ans"),
          attemptId,
          questionId: answer.questionId,
          optionIds: answer.optionIds ?? null,
          blankAnswers: answer.blankAnswers ?? null,
          text: answer.text ?? null,
          fileUrl: answer.fileUrl ?? null,
          flaggedForReview: answer.flaggedForReview,
          autoScore: score,
          // Auto-scored types are provisionally awarded; a teacher can override.
          awardedMarks: score,
          updatedAt: new Date(answer.updatedAt),
        }),
      )
      .onConflictDoUpdate({
        target: [answersTable.attemptId, answersTable.questionId],
        set: {
          optionIds: answer.optionIds ?? null,
          blankAnswers: answer.blankAnswers ?? null,
          text: answer.text ?? null,
          fileUrl: answer.fileUrl ?? null,
          flaggedForReview: answer.flaggedForReview,
          autoScore: score,
          awardedMarks: score,
          updatedAt: new Date(answer.updatedAt),
        },
      });
  }

  // Acknowledge EVERY answer in the batch, not just the ones that changed: an
  // unchanged (already stored) or stale answer is still settled, and leaving it
  // unacknowledged makes the client resend it forever ("Saving…" never clears).
  // Rejected ones (unknown question, typed after time) will never be accepted,
  // so they are settled too.
  return { accepted: [...new Set(incoming.map((a) => a.questionId))] };
}

export async function submitAttempt(ctx: RequestContext, attemptId: string) {
  const sdb = scopedDb(ctx.organizationId);
  const attempt = await loadAttempt(ctx, attemptId);
  // Idempotent: a retried submit (lost response, auto-submit retry) succeeds.
  if (attempt.status === "submitted") return { ok: true };
  // A paused student can't submit early — but once time is up the attempt
  // closes regardless, so the browser's auto-submit always lands.
  if (attempt.status === "locked" && !isPastDeadline(attempt)) {
    throw conflict("ATTEMPT_LOCKED", "This attempt is paused until a teacher unlocks it.");
  }
  await sdb.db
    .update(attempts)
    .set({ status: "submitted", submittedAt: new Date(), lockReason: null })
    .where(sdb.where(attempts, eq(attempts.id, attemptId)));
  return { ok: true };
}

export async function lockAttempt(
  ctx: RequestContext,
  attemptId: string,
  reason: string,
) {
  const sdb = scopedDb(ctx.organizationId);
  const attempt = await loadAttempt(ctx, attemptId);
  // Never reopen a finished attempt by locking it.
  if (attempt.status === "submitted") return { ok: true };
  await sdb.db
    .update(attempts)
    .set({ status: "locked", lockReason: reason })
    .where(sdb.where(attempts, eq(attempts.id, attemptId)));
  return { ok: true };
}

// The note shares the lock_reason column (no schema change); split for display.
const NOTE_SEPARATOR = "\nStudent note: ";

function splitLockReason(value: string | null): { reason: string; note?: string } {
  const [reason = "", ...rest] = (value ?? "").split(NOTE_SEPARATOR);
  const note = rest.join(NOTE_SEPARATOR).trim();
  return note ? { reason, note } : { reason };
}

/**
 * The student's optional explanation from the pause screen. Attached to the
 * pause only while it is still waiting for the teacher, so a late note can
 * never re-lock an attempt the teacher already unlocked. Shown in the teacher's
 * unlock queue (AGENTS §7 "unlock queue with explanations").
 */
export async function addLockNote(
  ctx: RequestContext,
  attemptId: string,
  note: string,
) {
  const sdb = scopedDb(ctx.organizationId);
  const attempt = await loadAttempt(ctx, attemptId);
  const trimmed = note.trim();
  if (attempt.status !== "locked" || !trimmed) return { ok: true };
  const { reason } = splitLockReason(attempt.lockReason);
  await sdb.db
    .update(attempts)
    .set({ lockReason: `${reason}${NOTE_SEPARATOR}${trimmed}` })
    .where(sdb.where(attempts, eq(attempts.id, attemptId)));
  return { ok: true };
}

export async function unlockAttempt(ctx: RequestContext, attemptId: string) {
  await assertCanMonitorAttempt(ctx, attemptId);
  const sdb = scopedDb(ctx.organizationId);
  await sdb.db
    .update(attempts)
    .set({ status: "in_progress", lockReason: null })
    .where(sdb.where(attempts, eq(attempts.id, attemptId)));
  return { ok: true };
}

/**
 * Monitoring feed (AGENTS §7). Anonymised student IDs only — never names (rule
 * 3.5). Progress, time left, and flag counts per attempt.
 */
export async function getMonitoring(ctx: RequestContext, examId: string) {
  await assertCanMonitorExam(ctx, examId);
  await finalizeExpiredAttempts(ctx, examId);
  const sdb = scopedDb(ctx.organizationId);
  const [exam] = await sdb.db
    .select({ title: exams.title })
    .from(exams)
    .where(sdb.where(exams, eq(exams.id, examId)))
    .limit(1);

  const attemptRows = await sdb.db
    .select()
    .from(attempts)
    .where(sdb.where(attempts, eq(attempts.examId, examId)));

  const now = Date.now();

  // Paused (locked) students awaiting an unlock. Language stays neutral (3.4).
  const unlockQueue = attemptRows
    .filter((a) => a.status === "locked")
    .map((a) => {
      const { reason, note } = splitLockReason(a.lockReason);
      return {
        attemptId: a.id,
        studentId: a.studentId,
        reason: reason || "Left the exam window",
        ...(note ? { note } : {}),
        at: new Date().toISOString(),
      };
    });
  const students = await Promise.all(
    attemptRows.map(async (a) => {
      const [answered] = await sdb.db
        .select({ n: count() })
        .from(answersTable)
        .where(sdb.where(answersTable, eq(answersTable.attemptId, a.id)));
      const [flags] = await sdb.db
        .select({ n: count() })
        .from(proctoringEvents)
        .where(
          sdb.where(proctoringEvents, eq(proctoringEvents.attemptId, a.id)),
        );
      const total = Object.values(a.presentedOrder).reduce(
        (n, ids) => n + ids.length,
        0,
      );
      return {
        attemptId: a.id,
        studentId: a.studentId, // anonymised identifier (rule 3.5)
        status: a.status,
        answered: answered?.n ?? 0,
        total,
        timeLeftMs: Math.max(0, a.expiresAt.getTime() - now),
        flagCount: flags?.n ?? 0,
      };
    }),
  );

  return { examId, examTitle: exam?.title ?? "", students, unlockQueue };
}

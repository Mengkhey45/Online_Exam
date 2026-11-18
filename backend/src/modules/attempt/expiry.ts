import { and, eq, inArray, lt } from "drizzle-orm";
import { scopedDb } from "@/db/scoped";
import { attempts, type AttemptRow } from "@/db/schema";
import type { RequestContext } from "@/middleware/context";

/**
 * Time-limit enforcement (AGENTS §7). The student's browser auto-submits at
 * 00:00, but the server is authoritative: after `expiresAt` plus a short grace
 * (for the final sync + submit to land over a slow connection) the attempt is
 * closed whether or not the browser ever came back.
 */
export const SUBMIT_GRACE_MS = 2 * 60_000;

/**
 * Answers are stamped by the student's clock. Accept edits made up to this long
 * after expiry to absorb clock drift; anything later was typed after time ran out.
 */
export const ANSWER_CLOCK_SKEW_MS = 60_000;

const OPEN_STATUSES = ["in_progress", "locked", "disconnected"] as const;

export function isPastDeadline(attempt: Pick<AttemptRow, "expiresAt">, now = Date.now()): boolean {
  return now > attempt.expiresAt.getTime();
}

export function isPastGrace(attempt: Pick<AttemptRow, "expiresAt">, now = Date.now()): boolean {
  return now > attempt.expiresAt.getTime() + SUBMIT_GRACE_MS;
}

/** Close one attempt if its time (plus grace) is up. Returns the current row. */
export async function finalizeIfExpired(
  ctx: RequestContext,
  attempt: AttemptRow,
): Promise<AttemptRow> {
  if (attempt.status === "submitted" || !isPastGrace(attempt)) return attempt;
  const sdb = scopedDb(ctx.organizationId);
  await sdb.db
    .update(attempts)
    .set({ status: "submitted", submittedAt: attempt.expiresAt, lockReason: null })
    .where(sdb.where(attempts, eq(attempts.id, attempt.id)));
  return { ...attempt, status: "submitted", submittedAt: attempt.expiresAt, lockReason: null };
}

/**
 * Close every expired attempt of an exam. Called before teacher views
 * (monitoring, grading, results) so abandoned sittings count as submitted.
 */
export async function finalizeExpiredAttempts(
  ctx: RequestContext,
  examId: string,
): Promise<void> {
  const sdb = scopedDb(ctx.organizationId);
  const cutoff = new Date(Date.now() - SUBMIT_GRACE_MS);
  const expired = await sdb.db
    .select({ id: attempts.id, expiresAt: attempts.expiresAt })
    .from(attempts)
    .where(
      sdb.where(
        attempts,
        and(
          eq(attempts.examId, examId),
          inArray(attempts.status, [...OPEN_STATUSES]),
          lt(attempts.expiresAt, cutoff),
        ),
      ),
    );
  // submittedAt = the deadline itself, not "now", so reports show when time ran out.
  for (const row of expired) {
    await sdb.db
      .update(attempts)
      .set({ status: "submitted", submittedAt: row.expiresAt, lockReason: null })
      .where(sdb.where(attempts, eq(attempts.id, row.id)));
  }
}

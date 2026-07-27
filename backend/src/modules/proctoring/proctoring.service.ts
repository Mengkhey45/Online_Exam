import { eq } from "drizzle-orm";
import { scopedDb } from "@/db/scoped";
import { attempts, incidents, proctoringEvents } from "@/db/schema";
import { newId } from "@/lib/ids";
import { notFound } from "@/lib/errors";
import type { RequestContext } from "@/middleware/context";
import type { ProctoringEvent } from "@/schema";

const BLUR_NOISE_MS = 2000;

async function assertAttempt(ctx: RequestContext, attemptId: string) {
  const sdb = scopedDb(ctx.organizationId);
  const [row] = await sdb.db
    .select({ id: attempts.id })
    .from(attempts)
    .where(sdb.where(attempts, eq(attempts.id, attemptId)))
    .limit(1);
  if (!row) throw notFound("Attempt not found");
}

/**
 * Ingest proctoring telemetry (AGENTS §7). Events are stored as evidence; none
 * of this adjusts a score. Blur events under 2000ms are discarded at ingest —
 * they are IME switches and notifications, not behaviour.
 */
export async function ingestEvents(
  ctx: RequestContext,
  attemptId: string,
  events: ProctoringEvent[],
): Promise<{ stored: number }> {
  await assertAttempt(ctx, attemptId);
  const sdb = scopedDb(ctx.organizationId);

  const kept = events.filter(
    (e) =>
      !(e.type === "blur" && e.durationMs !== undefined && e.durationMs < BLUR_NOISE_MS),
  );
  if (kept.length === 0) return { stored: 0 };

  await sdb.db.insert(proctoringEvents).values(
    kept.map((e) =>
      sdb.withOrg({
        id: newId("evt"),
        attemptId,
        type: e.type,
        at: new Date(e.at),
        durationMs: e.durationMs ?? null,
        charCount: e.charCount ?? null,
      }),
    ),
  );
  return { stored: kept.length };
}

/** The activity timeline for one attempt (monitoring drawer). */
export async function getActivity(ctx: RequestContext, attemptId: string) {
  const sdb = scopedDb(ctx.organizationId);
  const [attempt] = await sdb.db
    .select({ id: attempts.id, studentId: attempts.studentId })
    .from(attempts)
    .where(sdb.where(attempts, eq(attempts.id, attemptId)))
    .limit(1);
  if (!attempt) throw notFound("Attempt not found");

  const rows = await sdb.db
    .select()
    .from(proctoringEvents)
    .where(sdb.where(proctoringEvents, eq(proctoringEvents.attemptId, attemptId)));

  const events: ProctoringEvent[] = rows
    .map((r) => {
      const event: ProctoringEvent = {
        id: r.id,
        type: r.type,
        at: r.at.toISOString(),
      };
      if (r.durationMs !== null) event.durationMs = r.durationMs;
      if (r.charCount !== null) event.charCount = r.charCount;
      return event;
    })
    .sort((a, b) => a.at.localeCompare(b.at));

  return { attemptId, studentId: attempt.studentId, events };
}

/**
 * Record an incident (AGENTS §7). This is the ONLY place a teacher's judgement
 * is recorded against a student — an explicit action, never automatic, and it
 * changes no score.
 */
export async function recordIncident(
  ctx: RequestContext,
  attemptId: string,
  note: string,
) {
  await assertAttempt(ctx, attemptId);
  const sdb = scopedDb(ctx.organizationId);
  const id = newId("inc");
  await sdb.db.insert(incidents).values(
    sdb.withOrg({ id, attemptId, note, recordedBy: ctx.userId }),
  );
  return { id };
}

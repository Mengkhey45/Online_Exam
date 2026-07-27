import { eq, asc } from "drizzle-orm";
import { db } from "@/db/client";
import { jobs } from "@/db/schema";
import type { JobRow } from "@/db/schema/jobs";
import { logger } from "@/lib/logger";
import { jobHandlers } from "./handlers";

/**
 * The jobs table IS the queue (AGENTS §8). Claim rows with FOR UPDATE SKIP
 * LOCKED so multiple workers never grab the same job; no Redis. Status flows
 * pending → running → done | failed, recording attempts and the last error.
 * Never log document content — only job IDs and page numbers.
 */
const MAX_ATTEMPTS = 3;
const POLL_INTERVAL_MS = 3000;

/** Atomically claim the next pending job, or null if none are available. */
async function claimNext(): Promise<JobRow | null> {
  return db.transaction(async (tx) => {
    const [job] = await tx
      .select()
      .from(jobs)
      .where(eq(jobs.status, "pending"))
      .orderBy(asc(jobs.createdAt))
      .limit(1)
      .for("update", { skipLocked: true });
    if (!job) return null;

    await tx
      .update(jobs)
      .set({ status: "running", attempts: job.attempts + 1, updatedAt: new Date() })
      .where(eq(jobs.id, job.id));
    return { ...job, status: "running", attempts: job.attempts + 1 };
  });
}

/** Process one job if available. Returns true if a job was handled. */
export async function runOnce(): Promise<boolean> {
  const job = await claimNext();
  if (!job) return false;

  const handler = jobHandlers[job.type];
  try {
    await handler(job);
    await db
      .update(jobs)
      .set({ status: "done", lastError: null, updatedAt: new Date() })
      .where(eq(jobs.id, job.id));
    logger.info({ jobId: job.id, type: job.type }, "job done");
  } catch (err) {
    const message = err instanceof Error ? err.message : "job failed";
    // Retry until MAX_ATTEMPTS, then park as failed.
    const nextStatus = job.attempts >= MAX_ATTEMPTS ? "failed" : "pending";
    await db
      .update(jobs)
      .set({ status: nextStatus, lastError: message, updatedAt: new Date() })
      .where(eq(jobs.id, job.id));
    logger.error(
      { jobId: job.id, type: job.type, attempts: job.attempts, nextStatus },
      "job errored",
    );
  }
  return true;
}

let running = false;

/** Start the polling loop. Non-reentrant — one job at a time per worker. */
export function startPoller(): void {
  setInterval(() => {
    if (running) return;
    running = true;
    void runOnce()
      .catch((err: unknown) => {
        logger.error({ err }, "poller iteration failed");
      })
      .finally(() => {
        running = false;
      });
  }, POLL_INTERVAL_MS);
  logger.info("worker poller started");
}

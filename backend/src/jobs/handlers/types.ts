import type { JobRow } from "@/db/schema/jobs";

/**
 * A job handler processes one claimed job. It throws on failure — the poller
 * records the error and retries per policy (AGENTS §8). Handlers must be
 * idempotent: running twice must not create duplicate blocks.
 */
export type JobHandler = (job: JobRow) => Promise<void>;

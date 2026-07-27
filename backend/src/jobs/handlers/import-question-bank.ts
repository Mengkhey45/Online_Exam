import type { JobRow } from "@/db/schema/jobs";
import { logger } from "@/lib/logger";

/**
 * Import a question bank (AGENTS §8). Structured placeholder — the ingest +
 * numeric-integrity flow mirrors convert-exam-pdf and will land here.
 */
export async function importQuestionBank(job: JobRow): Promise<void> {
  logger.info({ jobId: job.id }, "import-question-bank not yet implemented");
  throw new Error("import-question-bank: not implemented");
}

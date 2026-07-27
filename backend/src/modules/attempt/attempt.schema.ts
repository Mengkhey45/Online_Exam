import { z } from "zod";
import { answerSchema, proctoringEventSchema } from "@/schema";

export const createAttemptSchema = z.object({
  examId: z.string(),
  studentId: z.string(),
});

// Batch answer sync from the offline queue (AGENTS §7). Idempotent, out-of-order.
export const syncAnswersSchema = z.object({
  answers: z.array(answerSchema),
});

export const eventsSchema = z.object({
  events: z.array(proctoringEventSchema),
});

export const lockSchema = z.object({
  reason: z.string().max(500).default(""),
});

export const attemptIdParams = z.object({ id: z.string() });
export const examIdParams = z.object({ id: z.string() });

export type CreateAttemptInput = z.infer<typeof createAttemptSchema>;
export type SyncAnswersInput = z.infer<typeof syncAnswersSchema>;
export type EventsInput = z.infer<typeof eventsSchema>;

import { z } from "zod";
import { securityLevelSchema } from "@/modules/exam";

/**
 * PROVISIONAL — student entry shapes (AGENTS §7). The key lookup and the fields
 * a student confirms aren't in the §6 contract; confirm with the backend (§10).
 * Isolated here behind the mock layer.
 */
export const entryFieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(["text", "email"]),
  required: z.boolean(),
  prefilled: z.string().optional(),
});
export type EntryField = z.infer<typeof entryFieldSchema>;

export const entryExamSchema = z.object({
  examId: z.string(),
  title: z.string(),
  institution: z.string(),
  durationMinutes: z.number(),
  questionCount: z.number(),
  totalMarks: z.number(),
  security: securityLevelSchema,
  fields: z.array(entryFieldSchema),
});
export type EntryExam = z.infer<typeof entryExamSchema>;

export const startedAttemptSchema = z.object({
  attemptId: z.string(),
  // The attempt-session token that authorises the sitting routes (§7).
  attemptToken: z.string().min(1),
});
export type StartedAttempt = z.infer<typeof startedAttemptSchema>;

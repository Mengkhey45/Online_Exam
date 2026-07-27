import { z } from "zod";
import { blockTypeSchema } from "@/modules/exam";

/**
 * PROVISIONAL — grading shapes (AGENTS §7). Beyond the §6 contract; confirm with
 * the backend (§10).
 *
 * Rule 3.5: responses are keyed by anonymised student ID until results are
 * released. §9: the frontend never computes grades — `autoScore` comes from the
 * server, and awarded marks are inputs sent back, never totals we calculate as
 * authoritative.
 */
export const responseSchema = z.object({
  /** Answer row id — null when the student has no answer for this question. */
  answerId: z.string().nullable(),
  attemptId: z.string(),
  studentId: z.string(), // anonymised until released
  /** The student's answer rendered for the grader (text or chosen option text). */
  answerText: z.string(),
  /** Present for auto-scored questions; server-computed, read-only. */
  autoScore: z.number().nullable(),
  /** Teacher-awarded marks; null until graded. */
  awarded: z.number().nullable(),
  comment: z.string(),
});
export type Response = z.infer<typeof responseSchema>;

export const gradableQuestionSchema = z.object({
  id: z.string(),
  number: z.number(),
  type: blockTypeSchema,
  stem: z.string(),
  maxMarks: z.number(),
  autoScored: z.boolean(),
  rubric: z.array(z.string()),
  responses: z.array(responseSchema),
});
export type GradableQuestion = z.infer<typeof gradableQuestionSchema>;

export const gradingSchema = z.object({
  examId: z.string(),
  title: z.string(),
  released: z.boolean(),
  questions: z.array(gradableQuestionSchema),
});
export type Grading = z.infer<typeof gradingSchema>;

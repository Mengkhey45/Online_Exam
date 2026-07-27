import { z } from "zod";
import { blockTypeSchema } from "@/modules/exam";

/**
 * PROVISIONAL — question bank shapes. A bank question is a reusable template;
 * moving it into an exam SNAPSHOTS its content (AGENTS backend §3.3), so editing
 * a bank question never alters an exam that already used it. No backend endpoint
 * yet — this module is mock-backed until `bank` routes exist.
 */
export const difficultySchema = z.enum(["easy", "medium", "hard"]);
export type Difficulty = z.infer<typeof difficultySchema>;

export const bankQuestionSchema = z.object({
  id: z.string(),
  text: z.string(),
  type: blockTypeSchema,
  subject: z.string(),
  difficulty: difficultySchema,
  marks: z.number().int().nonnegative(),
  usedCount: z.number().int().nonnegative(), // exams that snapshotted it
});
export type BankQuestion = z.infer<typeof bankQuestionSchema>;

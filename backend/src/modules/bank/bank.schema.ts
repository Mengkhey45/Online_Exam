import { z } from "zod";
import { blockSchema } from "@/schema";

export const bankQuestionIdParams = z.object({ id: z.string() });
export const copyBankParams = z.object({ examId: z.string() });
export const createBankQuestionSchema = z.object({
  bankName: z.string().trim().min(1).max(200),
  difficulty: z.enum(["easy", "medium", "hard"]),
  block: blockSchema,
});
export const updateBankQuestionSchema = z.object({
  bankName: z.string().trim().min(1).max(200).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  block: blockSchema.partial().optional(),
});
export const bankNameParams = z.object({ name: z.string().min(1).max(200) });
export const updateBankNameSchema = z.object({ name: z.string().trim().min(1).max(200) });
export const copyBankQuestionSchema = z.object({
  questionId: z.string(),
  sectionId: z.string(),
});
export type CreateBankQuestionInput = z.infer<typeof createBankQuestionSchema>;
export type UpdateBankQuestionInput = z.infer<typeof updateBankQuestionSchema>;
export type CopyBankQuestionInput = z.infer<typeof copyBankQuestionSchema>;
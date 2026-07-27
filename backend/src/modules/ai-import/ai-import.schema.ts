import { z } from "zod";
import { blockSchema } from "@/schema";

export const uploadUrlSchema = z.object({
  filename: z.string().min(1).max(300),
});

export const createImportSchema = z.object({
  filename: z.string().min(1),
  // Storage path returned by the signed-upload step.
  sourceUrl: z.string().min(1),
  // The draft exam this conversion will be applied to on approve.
  examId: z.string(),
});

export const patchBlockSchema = z.object({
  reviewed: z.boolean().optional(),
  // A teacher may edit the converted block before approving.
  block: blockSchema.optional(),
});

export const importIdParams = z.object({ id: z.string() });
export const blockParams = z.object({ id: z.string(), blockId: z.string() });

// Exam-keyed conversion review (frontend §7 uses examId, not importId).
export const examConversionParams = z.object({ examId: z.string() });
export const applyConversionSchema = z.object({
  reviewedBlockIds: z.array(z.string()),
  discardedPageIds: z.array(z.string()),
});

export type UploadUrlInput = z.infer<typeof uploadUrlSchema>;
export type CreateImportInput = z.infer<typeof createImportSchema>;
export type PatchBlockInput = z.infer<typeof patchBlockSchema>;
export type ApplyConversionInput = z.infer<typeof applyConversionSchema>;

import { z } from "zod";
import { blockTypeSchema, confidenceSchema, optionSchema } from "@/modules/exam";

/**
 * PROVISIONAL — AI conversion review shapes (AGENTS §7). Not in the §6 contract;
 * confirm with the backend (§10).
 *
 * Rule 3.5/3.6: AI conversion is literal and never auto-published. Each block
 * carries `reviewed`; publish stays blocked until all are reviewed. Numeric
 * mismatches (from the backend's numeric-integrity check) are surfaced
 * prominently and can't be silently accepted.
 */
export const sourcePageSchema = z.object({
  id: z.string(),
  label: z.string(), // e.g. "Page 3"
  /** Facsimile lines of the original page (until react-pdf renders the PDF). */
  lines: z.array(z.string()),
});
export type SourcePage = z.infer<typeof sourcePageSchema>;

export const numericMismatchSchema = z.object({
  source: z.array(z.string()),
  converted: z.array(z.string()),
});
export type NumericMismatch = z.infer<typeof numericMismatchSchema>;

export const conversionBlockSchema = z.object({
  id: z.string(),
  pageId: z.string(),
  number: z.number(),
  type: blockTypeSchema,
  stem: z.string(),
  options: z.array(optionSchema).optional(),
  confidence: confidenceSchema,
  reviewed: z.boolean(),
  numericMismatch: numericMismatchSchema.optional(),
});
export type ConversionBlock = z.infer<typeof conversionBlockSchema>;

export const conversionStatusSchema = z.enum([
  "pending",
  "processing",
  "done",
  "failed",
]);
export type ConversionStatus = z.infer<typeof conversionStatusSchema>;

export const conversionSchema = z.object({
  examId: z.string(),
  title: z.string(),
  // Progress fields (backend §8). Present while the worker converts the PDF.
  status: conversionStatusSchema.optional(),
  pageCount: z.number().optional(),
  pagesDone: z.number().optional(),
  pages: z.array(sourcePageSchema),
  blocks: z.array(conversionBlockSchema),
});
export type Conversion = z.infer<typeof conversionSchema>;

/** Signed-upload response from the backend (§8, §10 — caller's JWT is used). */
export const uploadUrlSchema = z.object({
  path: z.string(),
  token: z.string(),
  signedUrl: z.string(),
});

export const createdImportSchema = z.object({ importId: z.string() });

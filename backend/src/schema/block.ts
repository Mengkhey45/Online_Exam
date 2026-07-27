import { z } from "zod";

/**
 * The Zod block contract — the keystone (AGENTS §7). Every module and the
 * Next.js frontend validate against this. High blast radius: changes here are
 * agreed with Mengkhey before editing (§11).
 *
 * Rule 3.2: identity is by ID, never by position. There is no `index` or
 * `letter` field anywhere in this contract, and there must not be.
 */
export const blockTypeSchema = z.enum([
  "section",
  "content",
  "mcq",
  "multi_select",
  "fill_blank",
  "short_answer",
  "long_answer",
  "code",
  "file_upload",
]);
export type BlockType = z.infer<typeof blockTypeSchema>;

export const optionSchema = z.object({
  id: z.string(),
  text: z.string(), // may contain LaTeX in $…$
  isCorrect: z.boolean(),
  keepLast: z.boolean().optional(), // "All of the above" — exempt from shuffle
});
export type Option = z.infer<typeof optionSchema>;

export const blankSchema = z.object({
  id: z.string(),
  acceptedAnswers: z.array(z.string()),
  caseSensitive: z.boolean(),
  numericTolerance: z.number().optional(),
  marks: z.number(),
});
export type Blank = z.infer<typeof blankSchema>;

export const confidenceSchema = z.enum(["high", "medium", "low"]);
export type Confidence = z.infer<typeof confidenceSchema>;

export const blockSchema = z.object({
  id: z.string(),
  type: blockTypeSchema,
  stem: z.string(), // LaTeX in $…$; blanks as {{blankId}}
  marks: z.number(),
  required: z.boolean(),
  pinned: z.boolean().optional(),
  options: z.array(optionSchema).optional(),
  blanks: z.array(blankSchema).optional(),
  language: z.string().optional(),
  charLimit: z.number().optional(),
  shuffleOptions: z.boolean().optional(),
  reviewed: z.boolean().optional(),
  confidence: confidenceSchema.optional(),
});
export type Block = z.infer<typeof blockSchema>;

export const sectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  instructions: z.string(),
  mode: z.enum(["blocks", "pdf_pages"]),
  shuffleQuestions: z.boolean(),
  blocks: z.array(blockSchema),
  pdfPageUrls: z.array(z.string()).optional(),
});
export type Section = z.infer<typeof sectionSchema>;

export const examStatusSchema = z.enum(["draft", "published", "archived"]);
export type ExamStatus = z.infer<typeof examStatusSchema>;

export const examAccessSchema = z.enum([
  "open",
  "closed",
  "discoverable",
  "scheduled",
]);
export type ExamAccess = z.infer<typeof examAccessSchema>;

export const securityLevelSchema = z.enum(["low", "medium", "high"]);
export type SecurityLevel = z.infer<typeof securityLevelSchema>;

export const examSchema = z.object({
  id: z.string(),
  versionId: z.string(),
  title: z.string(),
  status: examStatusSchema,
  access: examAccessSchema,
  security: securityLevelSchema,
  durationMinutes: z.number(),
  totalMarks: z.number(),
  scheduledStart: z.string().optional(),
  sections: z.array(sectionSchema),
});
export type Exam = z.infer<typeof examSchema>;

export const attemptSchema = z.object({
  id: z.string(),
  examVersionId: z.string(),
  presentedOrder: z.record(z.string(), z.array(z.string())),
  presentedOptions: z.record(z.string(), z.array(z.string())),
  startedAt: z.string(),
  expiresAt: z.string(),
});
export type Attempt = z.infer<typeof attemptSchema>;

export const answerSchema = z.object({
  questionId: z.string(),
  optionIds: z.array(z.string()).optional(),
  blankAnswers: z.record(z.string(), z.string()).optional(),
  text: z.string().optional(),
  fileUrl: z.string().optional(),
  flaggedForReview: z.boolean(),
  updatedAt: z.string(), // ISO — resolves last-write-wins on offline sync (§7)
});
export type Answer = z.infer<typeof answerSchema>;

export const proctoringEventSchema = z.object({
  id: z.string(),
  type: z.enum([
    "blur",
    "fullscreen_exit",
    "paste",
    "burst",
    "share_stop",
    "disconnect",
  ]),
  at: z.string(),
  durationMs: z.number().optional(),
  charCount: z.number().optional(),
});
export type ProctoringEvent = z.infer<typeof proctoringEventSchema>;

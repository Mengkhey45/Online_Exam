import { z } from "zod";

export const examIdParams = z.object({ id: z.string() });
export const answerIdParams = z.object({ id: z.string() });
export const resultsQuery = z.object({
  classId: z.string().optional(),
  subject: z.string().optional(),
});

export const scoreSchema = z.object({
  awarded: z.number().nonnegative().nullable(),
  comment: z.string().max(2000).default(""),
});

export type ScoreInput = z.infer<typeof scoreSchema>;
export type ResultsQuery = z.infer<typeof resultsQuery>;

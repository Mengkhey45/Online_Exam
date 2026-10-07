import { z } from "zod";

/**
 * PROVISIONAL — released-results shapes. Results are shown only after a teacher
 * releases them, so real names appear here (the anonymised-ID rule 3.5 applies
 * only while an exam is in progress / before release). No backend endpoint yet;
 * mock-backed until a results route exists.
 */
export const resultRowSchema = z.object({
  studentRef: z.string(),
  name: z.string(),
  classId: z.string().nullable(),
  className: z.string(),
  marks: z.number(),
  outOf: z.number(),
  percentage: z.number(),
  rank: z.number().int().positive(),
  status: z.enum(["pass", "fail"]),
});
export type ResultRow = z.infer<typeof resultRowSchema>;

export const examResultsSchema = z.object({
  examId: z.string(),
  title: z.string(),
  subject: z.string(),
  totalStudents: z.number().int().nonnegative(),
  notSubmitted: z.number().int().nonnegative(),
  passMarkPct: z.number().int(),
  released: z.boolean(),
  classes: z.array(z.object({ id: z.string(), name: z.string() })),
  subjects: z.array(z.string()),
  rows: z.array(resultRowSchema),
});
export type ExamResults = z.infer<typeof examResultsSchema>;

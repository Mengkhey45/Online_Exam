import { z } from "zod";
import {
  examAccessSchema,
  examStatusSchema,
  securityLevelSchema,
} from "./types";

/**
 * PROVISIONAL — dashboard listing shapes.
 *
 * The teacher dashboard (AGENTS §7) needs summary fields that are NOT in the
 * §6 data contract: created date, exam key, question count, entered/total
 * students, and the grouping. Per AGENTS §10 these field names must be
 * confirmed with the backend before they are treated as final. They are
 * isolated here, and the whole listing is behind the mock layer, so swapping
 * to real endpoints touches only this file and queries.ts.
 */

export const examSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.string(), // ISO — provisional field name
  examKey: z.string(), // provisional field name
  status: examStatusSchema,
  access: examAccessSchema,
  security: securityLevelSchema,
  questionCount: z.number().int().nonnegative(), // provisional
  enteredStudents: z.number().int().nonnegative(), // provisional
  totalStudents: z.number().int().nonnegative(), // provisional
});
export type ExamSummary = z.infer<typeof examSummarySchema>;

export const examGroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  exams: z.array(examSummarySchema),
});
export type ExamGroup = z.infer<typeof examGroupSchema>;

export const dashboardSchema = z.object({
  groups: z.array(examGroupSchema),
});
export type Dashboard = z.infer<typeof dashboardSchema>;

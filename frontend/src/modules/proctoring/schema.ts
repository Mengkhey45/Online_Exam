import { z } from "zod";
import { proctoringEventSchema } from "@/modules/exam";

/**
 * PROVISIONAL — live monitoring shapes (AGENTS §7). Not in the §6 contract;
 * confirm with the backend (§10). Rule 3.5: during an in-progress exam,
 * teacher screens carry the anonymised student ID only — never a name. There is
 * no name field here by design.
 */
export const attemptStatusSchema = z.enum([
  "not_started",
  "in_progress",
  "submitted",
  "locked", // awaiting a teacher unlock — not an accusation (rule 3.4)
  "disconnected",
]);
export type AttemptStatus = z.infer<typeof attemptStatusSchema>;

export const monitoredStudentSchema = z.object({
  attemptId: z.string(),
  studentId: z.string(), // anonymised, e.g. "S-2048"
  status: attemptStatusSchema,
  answered: z.number().int().nonnegative(),
  total: z.number().int().positive(),
  timeLeftMs: z.number().int().nonnegative(),
  flagCount: z.number().int().nonnegative(), // events worth a review
});
export type MonitoredStudent = z.infer<typeof monitoredStudentSchema>;

export const unlockRequestSchema = z.object({
  attemptId: z.string(),
  studentId: z.string(),
  reason: z.string(), // neutral, descriptive
  at: z.string(),
  note: z.string().optional(), // the student's own explanation
});
export type UnlockRequest = z.infer<typeof unlockRequestSchema>;

export const monitoringSchema = z.object({
  examId: z.string(),
  examTitle: z.string(),
  students: z.array(monitoredStudentSchema),
  unlockQueue: z.array(unlockRequestSchema),
});
export type Monitoring = z.infer<typeof monitoringSchema>;

export const activitySchema = z.object({
  attemptId: z.string(),
  studentId: z.string(),
  events: z.array(proctoringEventSchema),
});
export type Activity = z.infer<typeof activitySchema>;

import { z } from "zod";
import { examAccessSchema, securityLevelSchema } from "@/modules/exam";

/**
 * PROVISIONAL — exam configuration shapes.
 *
 * The configuration screen (AGENTS §7) needs fields beyond the §6 contract:
 * pass mark, collectable student-info fields, workspace answer methods, and the
 * per-level cheat-prevention sub-settings. Per §10 these must be confirmed with
 * the backend before they are final. They live here, behind the mock layer, so
 * moving to real endpoints touches only this file + queries.
 *
 * Grading is backend-authoritative (AGENTS §9) — pass mark here is a setting the
 * server enforces, never something the frontend computes.
 */

export const studentFieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  collect: z.boolean(),
  /** Some fields (e.g. student ID) are always required and cannot be turned off. */
  locked: z.boolean().optional(),
});
export type StudentField = z.infer<typeof studentFieldSchema>;

export const answerMethodSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  enabled: z.boolean(),
});
export type AnswerMethod = z.infer<typeof answerMethodSchema>;

export const cheatPreventionSchema = z.object({
  level: securityLevelSchema,
  // Sub-settings; the UI only shows those for the selected level (§7).
  low: z.object({
    shuffleQuestions: z.boolean(),
    shuffleOptions: z.boolean(),
  }),
  medium: z.object({
    requireFullscreen: z.boolean(),
    warnOnTabSwitch: z.boolean(),
    lockAfterSwitches: z.number().int().min(1).max(10),
  }),
  high: z.object({
    requireFullscreen: z.boolean(),
    blockCopyPaste: z.boolean(),
    singleDevice: z.boolean(),
    requireCamera: z.boolean(),
  }),
});
export type CheatPrevention = z.infer<typeof cheatPreventionSchema>;

export const examConfigSchema = z
  .object({
    examId: z.string(),
    title: z.string(),
    general: z.object({
      durationMinutes: z.number().int().min(1).max(600),
      passMarkPct: z.number().int().min(0).max(100),
      access: examAccessSchema,
      scheduledStart: z.string().optional(), // ISO — required when scheduled
      scheduledEnd: z.string().optional(),
    }),
    studentInfo: z.object({ fields: z.array(studentFieldSchema) }),
    workspace: z.object({ methods: z.array(answerMethodSchema) }),
    cheatPrevention: cheatPreventionSchema,
  })
  // At least one answer method must stay enabled (§7 inline validation).
  .refine((c) => c.workspace.methods.some((m) => m.enabled), {
    path: ["workspace", "methods"],
    message: "Enable at least one way for students to answer.",
  })
  // Scheduled access needs a start time.
  .refine(
    (c) => c.general.access !== "scheduled" || Boolean(c.general.scheduledStart),
    {
      path: ["general", "scheduledStart"],
      message: "Set when the exam opens.",
    },
  );

export type ExamConfig = z.infer<typeof examConfigSchema>;

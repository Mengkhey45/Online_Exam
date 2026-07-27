import { z } from "zod";
import {
  examAccessSchema,
  securityLevelSchema,
  sectionSchema,
} from "@/schema";

/** Create an exam group (dashboard card). */
export const createExamGroupSchema = z.object({
  name: z.string().min(1).max(200),
});

/** Create an exam within a group. */
export const createExamSchema = z.object({
  groupId: z.string(),
  title: z.string().min(1).max(300),
});

/**
 * Patch draft content and config only (AGENTS §6). Returns 409 if the exam is
 * published — publishing/versioning belongs to Mengkhey's module. Passing
 * `sections` replaces the full draft content.
 */
export const patchExamSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  access: examAccessSchema.optional(),
  security: securityLevelSchema.optional(),
  durationMinutes: z.number().int().min(1).max(600).optional(),
  passMarkPct: z.number().int().min(0).max(100).optional(),
  scheduledStart: z.string().datetime().nullable().optional(),
  scheduledEnd: z.string().datetime().nullable().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  sections: z.array(sectionSchema).optional(),
});

export const examIdParams = z.object({ id: z.string() });

/**
 * Configuration screen payload (frontend §7 `examConfigSchema`). The
 * authoritative fields (duration, pass mark, access, security level, schedule)
 * are written back to real exam columns; the UI-only extras (student-info
 * fields, workspace answer methods, per-level cheat-prevention sub-settings)
 * live in the `config` jsonb. Grading/security stay backend-authoritative
 * (AGENTS §9) — these are settings the server stores and enforces.
 */
export const studentFieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  collect: z.boolean(),
  locked: z.boolean().optional(),
});

export const answerMethodSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  enabled: z.boolean(),
});

export const cheatPreventionSchema = z.object({
  level: securityLevelSchema,
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

export const examConfigSchema = z.object({
  examId: z.string(),
  title: z.string().min(1).max(300),
  general: z.object({
    durationMinutes: z.number().int().min(1).max(600),
    passMarkPct: z.number().int().min(0).max(100),
    access: examAccessSchema,
    scheduledStart: z.string().datetime().optional(),
    scheduledEnd: z.string().datetime().optional(),
  }),
  studentInfo: z.object({ fields: z.array(studentFieldSchema) }),
  workspace: z.object({ methods: z.array(answerMethodSchema) }),
  cheatPrevention: cheatPreventionSchema,
});

export type CreateExamGroupInput = z.infer<typeof createExamGroupSchema>;
export type CreateExamInput = z.infer<typeof createExamSchema>;
export type PatchExamInput = z.infer<typeof patchExamSchema>;
export type ExamConfigInput = z.infer<typeof examConfigSchema>;

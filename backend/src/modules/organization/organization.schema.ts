import { z } from "zod";

export const orgIdParams = z.object({ id: z.string() });
export const classIdParams = z.object({ id: z.string() });

export const patchOrgSchema = z.object({
  name: z.string().min(1).max(200),
});

export const createClassSchema = z.object({
  name: z.string().min(1).max(200),
});

// Add a single student to the roster (manual entry, no file / AI).
export const addStudentSchema = z.object({
  classId: z.string().optional(),
  studentRef: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  email: z.string().email(),
  program: z.string().max(200).optional(),
});

export const studentIdParams = z.object({ id: z.string() });

export type PatchOrgInput = z.infer<typeof patchOrgSchema>;
export type CreateClassInput = z.infer<typeof createClassSchema>;
export type AddStudentInput = z.infer<typeof addStudentSchema>;

import { z } from "zod";

const stagedRowSchema = z.object({
  studentRef: z.string(),
  name: z.string(),
  email: z.string(),
  program: z.string().default(""),
});

// CSV/XLSX parsing is direct — no AI (AGENTS §6). The client sends already-mapped
// rows; only PDF rosters go to the worker.
export const startImportSchema = z.object({
  filename: z.string(),
  classId: z.string().optional(),
  rows: z.array(stagedRowSchema),
});

export const patchRowSchema = z.object({
  studentRef: z.string().optional(),
  name: z.string().optional(),
  email: z.string().optional(),
  program: z.string().optional(),
});

export const importIdParams = z.object({ id: z.string() });
export const rowParams = z.object({ id: z.string(), rowId: z.string() });

// AI roster scan (Phase 2): upload a photo/scan/PDF, the worker extracts rows.
export const scanUploadSchema = z.object({
  filename: z.string().min(1).max(300),
});
export const scanImportSchema = z.object({
  filename: z.string().min(1),
  sourceUrl: z.string().min(1),
  prompt: z.string().max(2000).optional(),
  classId: z.string().optional(),
});

export type StartImportInput = z.infer<typeof startImportSchema>;
export type PatchRowInput = z.infer<typeof patchRowSchema>;
export type ScanUploadInput = z.infer<typeof scanUploadSchema>;
export type ScanImportInput = z.infer<typeof scanImportSchema>;

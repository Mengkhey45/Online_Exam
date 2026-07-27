import { z } from "zod";

/**
 * PROVISIONAL — roster import shapes (AGENTS §7). Not in the §6 contract;
 * confirm with the backend (§10). Rule 3.6: imported rows stay in a staging
 * state until an explicit confirm — nothing becomes live automatically.
 */
export const rawRosterSchema = z.object({
  filename: z.string(),
  columns: z.array(z.string()),
  rows: z.array(z.array(z.string())),
});
export type RawRoster = z.infer<typeof rawRosterSchema>;

/** The fields we import into. */
export type TargetField = {
  id: "student_id" | "name" | "email" | "program";
  label: string;
  required: boolean;
};

export const TARGET_FIELDS: TargetField[] = [
  { id: "student_id", label: "Student ID", required: true },
  { id: "name", label: "Full name", required: true },
  { id: "email", label: "Email", required: true },
  { id: "program", label: "Programme", required: false },
];

export type MappedRow = {
  _id: string;
  student_id: string;
  name: string;
  email: string;
  program: string;
};

/** column index per target field, or null when unmapped */
export type Mapping = Record<TargetField["id"], number | null>;

/**
 * Staging shapes — these mirror the backend (§6). After mapping, rows are
 * STAGED on the server (POST /roster/imports), which validates them, including
 * the one check the client can't do: flagging IDs already in the roster.
 * Nothing becomes a real student until an explicit confirm (rule 3.6).
 */
export const stageRowDataSchema = z.object({
  studentRef: z.string(),
  name: z.string(),
  email: z.string(),
  program: z.string().default(""),
});
export type StageRowData = z.infer<typeof stageRowDataSchema>;

export const stagedRowSchema = z.object({
  id: z.string(),
  rowIndex: z.number(),
  data: stageRowDataSchema,
  // Per-field problems keyed by data field (studentRef | name | email | program).
  problems: z.record(z.string(), z.string()),
});
export type StagedRow = z.infer<typeof stagedRowSchema>;

export const stagedImportSchema = z.object({
  id: z.string(),
  filename: z.string(),
  status: z.string(),
  problemCount: z.number(),
  rows: z.array(stagedRowSchema),
});
export type StagedImport = z.infer<typeof stagedImportSchema>;

/** The columns shown in the editable preview, mapped to backend data keys. */
export const STAGE_FIELDS = [
  { key: "studentRef", label: "Student ID", required: true, mono: true },
  { key: "name", label: "Full name", required: true, mono: false },
  { key: "email", label: "Email", required: true, mono: false },
  { key: "program", label: "Programme", required: false, mono: false },
] as const;
export type StageFieldKey = (typeof STAGE_FIELDS)[number]["key"];

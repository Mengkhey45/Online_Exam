import { jsonb, pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";

// "processing" applies only to AI scans while the worker extracts rows; the
// column is plain text so this needs no migration.
export type RosterImportStatus =
  | "processing"
  | "staged"
  | "confirmed"
  | "discarded";

// A roster import batch. Rows land in roster_staging and stay there until an
// explicit /confirm promotes them into students (AGENTS §3.6).
export const rosterImports = pgTable("roster_imports", {
  id: text().primaryKey(),
  organizationId: text().notNull(),
  classId: text(),
  filename: text().notNull(),
  status: text().$type<RosterImportStatus>().notNull().default("staged"),
  createdBy: text().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export type StagedRowData = {
  studentRef: string;
  name: string;
  email: string;
  program: string;
};

export type RowProblems = Partial<Record<keyof StagedRowData, string>>;

// A single staged row with its mapped data and any validation problems.
export const rosterStaging = pgTable("roster_staging", {
  id: text().primaryKey(),
  organizationId: text().notNull(),
  importId: text().notNull(),
  rowIndex: integer().notNull(),
  data: jsonb().$type<StagedRowData>().notNull(),
  problems: jsonb().$type<RowProblems>().notNull().default({}),
});

export type RosterImportRow = typeof rosterImports.$inferSelect;
export type RosterStagingRow = typeof rosterStaging.$inferSelect;

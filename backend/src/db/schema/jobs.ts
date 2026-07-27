import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export type JobStatus = "pending" | "running" | "done" | "failed";
export type JobType =
  | "convert-exam-pdf"
  | "import-question-bank"
  | "import-roster-pdf";

// The jobs table IS the queue (AGENTS §8). The worker (Choonvia's area) polls,
// claims rows with FOR UPDATE SKIP LOCKED, and updates status. Defined here in
// the data foundation; every job carries organization_id.
export const jobs = pgTable("jobs", {
  id: text().primaryKey(),
  organizationId: text().notNull(),
  type: text().$type<JobType>().notNull(),
  status: text().$type<JobStatus>().notNull().default("pending"),
  payload: jsonb().$type<Record<string, unknown>>().notNull().default({}),
  attempts: integer().notNull().default(0),
  lastError: text(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export type JobRow = typeof jobs.$inferSelect;

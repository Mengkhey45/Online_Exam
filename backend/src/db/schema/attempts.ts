import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export type AttemptStatus =
  | "in_progress"
  | "submitted"
  | "locked"
  | "disconnected";

// A student's sitting. presented_order / presented_options are stored EXPLICITLY
// as arrays, never as a seed (AGENTS §7) — a seed can't be reproduced after the
// shuffle code changes, and disputes surface months later. Identity by ID (§3.2).
export const attempts = pgTable("attempts", {
  id: text().primaryKey(),
  organizationId: text().notNull(),
  examId: text().notNull(),
  examVersionId: text().notNull(),
  studentId: text().notNull(),
  presentedOrder: jsonb().$type<Record<string, string[]>>().notNull(),
  presentedOptions: jsonb().$type<Record<string, string[]>>().notNull(),
  status: text().$type<AttemptStatus>().notNull().default("in_progress"),
  lockReason: text(),
  startedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp({ withTimezone: true }).notNull(),
  submittedAt: timestamp({ withTimezone: true }),
});

export type AttemptRow = typeof attempts.$inferSelect;

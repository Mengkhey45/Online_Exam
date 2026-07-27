import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

// The ONLY place a teacher's decision is recorded against a student (AGENTS §7).
// Created solely by an explicit teacher action — never by the system.
export const incidents = pgTable("incidents", {
  id: text().primaryKey(),
  organizationId: text().notNull(),
  attemptId: text().notNull(),
  note: text().notNull().default(""),
  recordedBy: text().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export type IncidentRow = typeof incidents.$inferSelect;

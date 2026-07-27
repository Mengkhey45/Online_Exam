import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import type { ProctoringEvent } from "@/schema";

// Telemetry stored as evidence (AGENTS §7). Events are flags for a teacher to
// review — no row here ever adjusts a score or marks a student as cheating.
export const proctoringEvents = pgTable("proctoring_events", {
  id: text().primaryKey(),
  organizationId: text().notNull(),
  attemptId: text().notNull(),
  type: text().$type<ProctoringEvent["type"]>().notNull(),
  at: timestamp({ withTimezone: true }).notNull(),
  durationMs: integer(),
  charCount: integer(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export type ProctoringEventRow = typeof proctoringEvents.$inferSelect;

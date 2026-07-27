import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import type { Exam } from "@/schema";

// An immutable published snapshot (AGENTS §3.4). Every attempt references a
// version_id. NEVER mutate a row after creation — editing a published exam
// creates a NEW version instead.
export const examVersions = pgTable("exam_versions", {
  id: text().primaryKey(),
  organizationId: text().notNull(),
  examId: text().notNull(),
  versionNumber: integer().notNull(),
  // The full exam payload as published, including all sections/questions.
  snapshot: jsonb().$type<Exam>().notNull(),
  totalMarks: integer().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export type ExamVersionRow = typeof examVersions.$inferSelect;

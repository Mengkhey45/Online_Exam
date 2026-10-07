import {
  jsonb,
  pgTable,
  text,
  timestamp,
  integer,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type {
  ExamAccess,
  ExamStatus,
  SecurityLevel,
} from "@/schema";

// Free-form configuration (pass mark, student fields, answer methods, cheat
// prevention). Provisional shape lives with the config module / frontend.
export type ExamConfig = Record<string, unknown>;

// The exam header + draft config. Draft content lives in exam_sections /
// exam_questions; a published snapshot lives in exam_versions (AGENTS §3.4).
export const exams = pgTable(
  "exams",
  {
    id: text().primaryKey(),
    organizationId: text().notNull(),
    groupId: text().notNull(),
    title: text().notNull(),
    status: text().$type<ExamStatus>().notNull().default("draft"),
    access: text().$type<ExamAccess>().notNull().default("closed"),
    security: text().$type<SecurityLevel>().notNull().default("medium"),
    durationMinutes: integer().notNull().default(60),
    passMarkPct: integer().notNull().default(50),
    totalMarks: integer().notNull().default(0),
    examKey: text().notNull(),
    scheduledStart: timestamp({ withTimezone: true }),
    scheduledEnd: timestamp({ withTimezone: true }),
    config: jsonb().$type<ExamConfig>().notNull().default({}),
    currentVersionId: text(),
    // Set when a teacher releases results; until then teacher screens stay
    // anonymised (rule 3.5) and results are hidden from students.
    resultsReleasedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull(),
  },
  (t) => [uniqueIndex("exams_org_key_idx").on(t.organizationId, t.examKey)],
);

export type ExamRow = typeof exams.$inferSelect;

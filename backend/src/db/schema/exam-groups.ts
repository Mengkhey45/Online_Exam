import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

// A grouping of exams (e.g. a course/cohort) shown as a card on the dashboard.
export const examGroups = pgTable("exam_groups", {
  id: text().primaryKey(),
  organizationId: text().notNull(),
  name: text().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export type ExamGroupRow = typeof examGroups.$inferSelect;

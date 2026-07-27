import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
} from "drizzle-orm/pg-core";

// Draft section content (Kanha's exam CRUD area). Ordered by `position`.
export const examSections = pgTable("exam_sections", {
  id: text().primaryKey(),
  organizationId: text().notNull(),
  examId: text().notNull(),
  title: text().notNull().default(""),
  instructions: text().notNull().default(""),
  mode: text().$type<"blocks" | "pdf_pages">().notNull().default("blocks"),
  shuffleQuestions: boolean().notNull().default(false),
  pdfPageUrls: jsonb().$type<string[]>(),
  position: integer().notNull().default(0),
});

export type ExamSectionRow = typeof examSections.$inferSelect;

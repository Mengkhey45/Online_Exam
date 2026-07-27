import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
} from "drizzle-orm/pg-core";
import type { Blank, BlockType, Confidence, Option } from "@/schema";

// A draft question. When a bank question moves in, its content is SNAPSHOT here
// and `sourceQuestionId` keeps lineage — the exam reads only this row, never the
// bank (AGENTS §3.3). Options/blanks are stored by ID (§3.2).
export const examQuestions = pgTable("exam_questions", {
  id: text().primaryKey(),
  organizationId: text().notNull(),
  examId: text().notNull(),
  sectionId: text().notNull(),
  sourceQuestionId: text(),
  type: text().$type<BlockType>().notNull(),
  stem: text().notNull().default(""),
  marks: integer().notNull().default(0),
  required: boolean().notNull().default(true),
  pinned: boolean(),
  options: jsonb().$type<Option[]>(),
  blanks: jsonb().$type<Blank[]>(),
  language: text(),
  charLimit: integer(),
  shuffleOptions: boolean(),
  reviewed: boolean(),
  confidence: text().$type<Confidence>(),
  position: integer().notNull().default(0),
});

export type ExamQuestionRow = typeof examQuestions.$inferSelect;

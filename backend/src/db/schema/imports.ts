import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type { Block, Confidence } from "@/schema";

// AI-import tables (Choonvia §8). Added to the data foundation — flagged for
// Kanha's review (§11). Every row carries organization_id; the worker uses the
// service-role key and is responsible for its own scoping (§8).

export type ImportKind = "exam_pdf" | "question_bank" | "roster_pdf";
export type ImportStatus = "pending" | "processing" | "done" | "failed";

export const imports = pgTable("imports", {
  id: text().primaryKey(),
  organizationId: text().notNull(),
  examId: text(), // target exam, once approved
  kind: text().$type<ImportKind>().notNull(),
  status: text().$type<ImportStatus>().notNull().default("pending"),
  filename: text().notNull(),
  sourceUrl: text().notNull(), // storage path to the uploaded PDF
  pageCount: integer().notNull().default(0),
  pagesDone: integer().notNull().default(0),
  error: text(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export type PageStatus = "pending" | "done" | "manual";

// One page = one unit of work (AGENTS §8: chunk by page). sourceText holds the
// extracted text layer, used for numeric-integrity and the review facsimile.
export const importPages = pgTable("import_pages", {
  id: text().primaryKey(),
  organizationId: text().notNull(),
  importId: text().notNull(),
  pageIndex: integer().notNull(),
  label: text().notNull(),
  sourceText: jsonb().$type<string[]>().notNull().default([]),
  status: text().$type<PageStatus>().notNull().default("pending"),
  attempts: integer().notNull().default(0),
  lastError: text(),
});

export type NumericMismatch = { source: string[]; converted: string[] };

// A converted block awaiting review. reviewed stays false until an explicit
// teacher action (rule 3.6); a numeric mismatch cannot be auto-marked reviewed.
export const convertedBlocks = pgTable("converted_blocks", {
  id: text().primaryKey(),
  organizationId: text().notNull(),
  importId: text().notNull(),
  pageId: text().notNull(),
  number: integer().notNull(),
  block: jsonb().$type<Block>().notNull(),
  confidence: text().$type<Confidence>().notNull().default("medium"),
  reviewed: boolean().notNull().default(false),
  numericMismatch: jsonb().$type<NumericMismatch>(),
});

export type ImportRow = typeof imports.$inferSelect;
export type ImportPageRow = typeof importPages.$inferSelect;
export type ConvertedBlockRow = typeof convertedBlocks.$inferSelect;

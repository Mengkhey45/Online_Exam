import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import type { Block } from "@/schema";

export const questionBank = pgTable("question_bank", {
  id: text().primaryKey(),
  organizationId: text().notNull(),
  createdBy: text("created_by").notNull(),
  bankName: text("bank_name").notNull().default("General"),
  subject: text().notNull(),
  difficulty: text().$type<"easy" | "medium" | "hard">().notNull(),
  block: jsonb().$type<Block>().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export type QuestionBankRow = typeof questionBank.$inferSelect;
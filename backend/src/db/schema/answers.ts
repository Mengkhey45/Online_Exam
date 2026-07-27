import {
  boolean,
  doublePrecision,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// One answer per (attempt, question). Stored by ID (AGENTS §3.2). `updatedAt`
// resolves last-write-wins on out-of-order offline sync (§7). Scoring fields are
// filled by auto-scoring or a teacher — never computed on the client.
export const answers = pgTable(
  "answers",
  {
    id: text().primaryKey(),
    organizationId: text().notNull(),
    attemptId: text().notNull(),
    questionId: text().notNull(),
    optionIds: jsonb().$type<string[]>(),
    blankAnswers: jsonb().$type<Record<string, string>>(),
    text: text(),
    fileUrl: text(),
    flaggedForReview: boolean().notNull().default(false),
    // Nullable until graded. autoScore is server-computed for objective types.
    autoScore: doublePrecision(),
    awardedMarks: doublePrecision(),
    comment: text().notNull().default(""),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("answers_attempt_question_idx").on(t.attemptId, t.questionId),
  ],
);

export type AnswerRow = typeof answers.$inferSelect;

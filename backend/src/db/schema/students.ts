import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

// A student record. `studentRef` is the institution's own student ID string.
// Duplicate studentRef within an organisation is flagged at import, never
// silently merged (AGENTS §6). Live data — written only via roster /confirm.
export const students = pgTable(
  "students",
  {
    id: text().primaryKey(),
    organizationId: text().notNull(),
    classId: text(),
    studentRef: text().notNull(),
    name: text().notNull(),
    email: text().notNull(),
    program: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Uniqueness is scoped to the organisation (§3.1).
    uniqueIndex("students_org_ref_idx").on(t.organizationId, t.studentRef),
  ],
);

export type StudentRow = typeof students.$inferSelect;

import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

// A cohort of students within an organisation.
export const classes = pgTable("classes", {
  id: text().primaryKey(),
  organizationId: text().notNull(),
  name: text().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export type ClassRow = typeof classes.$inferSelect;

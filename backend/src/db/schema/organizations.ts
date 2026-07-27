import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

// An institution (tenant). organization_id on every other table references this.
export const organizations = pgTable("organizations", {
  id: text().primaryKey(),
  name: text().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export type OrganizationRow = typeof organizations.$inferSelect;

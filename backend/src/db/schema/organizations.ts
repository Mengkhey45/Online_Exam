import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export type OrganizationStatus = "pending_verification" | "active" | "suspended";

// An institution (tenant). organization_id on every other table references this.
export const organizations = pgTable(
  "organizations",
  {
    id: text().primaryKey(),
    name: text().notNull(),
    // Public-safe identifier for future path/subdomain routing. It is unique;
    // display names deliberately are not.
    slug: text().notNull(),
    status: text().$type<OrganizationStatus>().notNull().default("pending_verification"),
    // Billing is intentionally out of scope. This preserves the entitlement
    // boundary without coupling registration to a payment provider.
    plan: text().notNull().default("trial"),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("organizations_slug_idx").on(t.slug)],
);

export type OrganizationRow = typeof organizations.$inferSelect;

import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export type UserRole = "admin" | "teacher" | "student";

// A person in an organisation. `supabaseUserId` links to Supabase Auth; the
// auth middleware resolves it to { userId, organizationId, role } (AGENTS §6).
// It is NULL for an invited-but-not-yet-signed-in teacher — the first login
// with a matching verified email links the identity (see middleware/auth.ts).
export const users = pgTable(
  "users",
  {
    id: text().primaryKey(),
    organizationId: text().notNull(),
    supabaseUserId: text(),
    email: text().notNull(),
    name: text().notNull(),
    role: text().$type<UserRole>().notNull().default("teacher"),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Real UIDs are unique; multiple pending rows (NULL uid) are allowed since
    // Postgres treats NULLs as distinct in a unique index.
    uniqueIndex("users_supabase_uid_idx").on(t.supabaseUserId),
    // One row per email within an organisation (prevents duplicate invites).
    uniqueIndex("users_org_email_idx").on(t.organizationId, t.email),
  ],
);

export type UserRow = typeof users.$inferSelect;

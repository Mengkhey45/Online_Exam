import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/config/env";
import * as schema from "./schema";

/**
 * The raw database client. Prefer `scopedDb(organizationId)` from ./scoped for
 * anything tenant-owned (AGENTS §3.1) — this bare client does not inject the org
 * filter. RLS in the database is the second line of defence.
 */
const queryClient = postgres(env.DATABASE_URL, {
  max: 10,
  // Supabase pooled connections don't support prepared statements.
  prepare: false,
});

export const db = drizzle(queryClient, { schema, casing: "snake_case" });

export type Database = typeof db;
export { schema };

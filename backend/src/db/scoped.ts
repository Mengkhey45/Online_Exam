import { and, eq, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { db, type Database } from "./client";

/**
 * Org-scoped query surface (AGENTS §3.1). Every tenant-owned query goes through
 * here so the organisation filter is never forgotten; RLS enforces it again at
 * the database level. Services build queries like:
 *
 *   const sdb = scopedDb(ctx.organizationId);
 *   const rows = await sdb.db.select().from(exams).where(sdb.where(exams));
 *
 * The service-role key (which bypasses RLS) is used ONLY by the worker (§10).
 */
type OrgScoped = { organizationId: PgColumn };

export type ScopedDb = {
  organizationId: string;
  db: Database;
  /** WHERE clause that always includes the org scope, plus any extra condition. */
  where: (table: OrgScoped, extra?: SQL) => SQL;
  /** Attach organization_id to values before an insert. */
  withOrg: <V extends object>(values: V) => V & { organizationId: string };
};

export function scopedDb(organizationId: string): ScopedDb {
  return {
    organizationId,
    db,
    where(table, extra) {
      const orgCond = eq(table.organizationId, organizationId);
      return extra ? (and(orgCond, extra) as SQL) : orgCond;
    },
    withOrg(values) {
      return { ...values, organizationId };
    },
  };
}

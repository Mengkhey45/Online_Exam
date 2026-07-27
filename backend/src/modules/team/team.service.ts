import { and, asc, count, eq, isNotNull, sql } from "drizzle-orm";
import { scopedDb } from "@/db/scoped";
import { users } from "@/db/schema";
import { newId } from "@/lib/ids";
import { conflict, forbidden, notFound } from "@/lib/errors";
import type { RequestContext } from "@/middleware/context";
import type { InviteInput } from "./team.schema";

type Member = {
  id: string;
  email: string;
  name: string;
  role: string;
  status: "active" | "pending";
};

/**
 * Invite a teacher/admin into the org (AGENTS §6). Creates a PENDING user with
 * no Supabase identity yet — the first login with this verified email links it
 * (see middleware/auth.ts). No email is sent; share the sign-in link directly.
 */
export async function inviteTeacher(
  ctx: RequestContext,
  input: InviteInput,
): Promise<Member> {
  const sdb = scopedDb(ctx.organizationId);
  const email = input.email.trim().toLowerCase();

  const [existing] = await sdb.db
    .select({ id: users.id })
    .from(users)
    .where(sdb.where(users, eq(sql`lower(${users.email})`, email)))
    .limit(1);
  if (existing) {
    throw conflict("USER_EXISTS", "Someone with that email is already here.");
  }

  const id = newId("usr");
  await sdb.db.insert(users).values(
    sdb.withOrg({
      id,
      supabaseUserId: null,
      email,
      name: input.name.trim(),
      role: input.role,
    }),
  );

  return { id, email, name: input.name.trim(), role: input.role, status: "pending" };
}

/** Everyone in the org, active first (AGENTS §6). */
export async function listTeam(ctx: RequestContext): Promise<Member[]> {
  const sdb = scopedDb(ctx.organizationId);
  const rows = await sdb.db
    .select()
    .from(users)
    .where(sdb.where(users))
    .orderBy(asc(users.createdAt));

  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    name: r.name,
    role: r.role,
    status: r.supabaseUserId ? "active" : "pending",
  }));
}

/**
 * Remove a member — either revoke a pending invite or remove an active
 * teacher/admin (AGENTS §6). Guardrails against footguns: you can't remove
 * yourself, a teacher can't remove an admin, and the last ACTIVE admin can't be
 * removed (that would lock the org out). Hard delete: authored-by references are
 * plain text (no FK), so nothing structural breaks.
 */
export async function removeMember(
  ctx: RequestContext,
  memberId: string,
): Promise<{ removed: true }> {
  const sdb = scopedDb(ctx.organizationId);
  const [target] = await sdb.db
    .select()
    .from(users)
    .where(sdb.where(users, eq(users.id, memberId)))
    .limit(1);
  if (!target) throw notFound("Member not found");

  if (target.id === ctx.userId) {
    throw forbidden("You can’t remove yourself.");
  }
  if (target.role === "admin" && ctx.role !== "admin") {
    throw forbidden("Only an admin can remove an admin.");
  }
  // Guard the last active admin (only relevant when removing an active admin).
  if (target.role === "admin" && target.supabaseUserId) {
    const [{ n }] = await sdb.db
      .select({ n: count() })
      .from(users)
      .where(
        sdb.where(
          users,
          and(eq(users.role, "admin"), isNotNull(users.supabaseUserId)),
        ),
      );
    if (n <= 1) throw forbidden("You can’t remove the last admin.");
  }

  await sdb.db.delete(users).where(sdb.where(users, eq(users.id, memberId)));
  return { removed: true };
}

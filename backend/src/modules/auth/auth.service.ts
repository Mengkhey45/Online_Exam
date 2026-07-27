import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { organizations, users } from "@/db/schema";
import { unauthorized } from "@/lib/errors";
import { verifySupabaseJwt } from "@/lib/supabase-jwt";
import type { RequestContext } from "@/middleware/context";

export type Profile = {
  userId: string;
  organizationId: string;
  organizationName: string;
  email: string;
  name: string;
  role: string;
};

async function profileForSupabaseUser(supabaseUserId: string): Promise<Profile> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.supabaseUserId, supabaseUserId))
    .limit(1);
  // A verified identity with no user row has no organisation yet — onboarding
  // (inviting a teacher into an org) is an explicit admin action, not implicit.
  if (!user) throw unauthorized("No account for this identity");

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, user.organizationId))
    .limit(1);

  return {
    userId: user.id,
    organizationId: user.organizationId,
    organizationName: org?.name ?? "",
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

/** Verify the Supabase token and return the caller's profile. */
export async function completeGoogleCallback(
  accessToken: string,
): Promise<Profile> {
  try {
    const payload = await verifySupabaseJwt(accessToken);
    if (!payload.sub) throw unauthorized();
    return await profileForSupabaseUser(payload.sub);
  } catch {
    throw unauthorized();
  }
}

/** The authenticated caller's profile (auth middleware already ran). */
export async function getMe(ctx: RequestContext): Promise<Profile> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, ctx.userId))
    .limit(1);
  if (!user) throw unauthorized();

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, ctx.organizationId))
    .limit(1);

  return {
    userId: user.id,
    organizationId: user.organizationId,
    organizationName: org?.name ?? "",
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

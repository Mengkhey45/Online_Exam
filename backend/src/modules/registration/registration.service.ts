import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { organizations, users } from "@/db/schema";
import { conflict, unauthorized } from "@/lib/errors";
import { newId } from "@/lib/ids";
import { verifySupabaseJwt } from "@/lib/supabase-jwt";
import { registerOrganizationSchema, type RegisterOrganizationInput } from "./registration.schema";

export type RegisteredOrganization = {
  organizationId: string;
  organizationName: string;
  slug: string;
  userId: string;
  role: "admin";
};

function slugBase(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 56);
  return normalized || "organization";
}

async function availableSlug(name: string): Promise<string> {
  const base = slugBase(name);
  for (let suffix = 1; suffix < 1000; suffix += 1) {
    const candidate = suffix === 1 ? base : `${base}-${suffix}`;
    const [existing] = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.slug, candidate))
      .limit(1);
    if (!existing) return candidate;
  }
  throw conflict("SLUG_UNAVAILABLE", "Choose a different organization name.");
}

/**
 * Provision a tenant only for a verified Supabase session. Supabase Auth owns
 * passwords and email verification; this API owns the application tenant and
 * its initial administrator record. No service-role key is used here.
 */
export async function registerOrganization(
  accessToken: string | undefined,
  input: RegisterOrganizationInput,
): Promise<RegisteredOrganization> {
  if (!accessToken) throw unauthorized();

  const payload = await verifySupabaseJwt(accessToken);
  const supabaseUserId = payload.sub;
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  if (!supabaseUserId || !email) throw unauthorized("A verified email is required.");

  // The existing v1 users table is the tenant membership record. Its unique
  // Supabase UID means one organization per account until the dedicated
  // multi-organization membership migration is introduced.
  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.supabaseUserId, supabaseUserId))
    .limit(1);
  if (existingUser) {
    const [existingMembership] = await db
      .select({
        organizationId: users.organizationId,
        organizationName: organizations.name,
        slug: organizations.slug,
        userId: users.id,
        role: users.role,
      })
      .from(users)
      .innerJoin(organizations, eq(organizations.id, users.organizationId))
      .where(eq(users.id, existingUser.id))
      .limit(1);
    if (existingMembership?.role === "admin") {
      return {
        organizationId: existingMembership.organizationId,
        organizationName: existingMembership.organizationName,
        slug: existingMembership.slug,
        userId: existingMembership.userId,
        role: "admin",
      };
    }
    throw conflict("ACCOUNT_ALREADY_PROVISIONED", "This account already belongs to an organization.");
  }

  const name = input.organizationName.trim();
  const slug = await availableSlug(name);
  const organizationId = newId("org");
  const userId = newId("usr");

  await db.transaction(async (tx) => {
    await tx.insert(organizations).values({
      id: organizationId,
      name,
      slug,
      status: "active",
      plan: "trial",
    });
    await tx.insert(users).values({
      id: userId,
      organizationId,
      supabaseUserId,
      email,
      name: input.adminName.trim(),
      role: "admin",
    });
  });

  return { organizationId, organizationName: name, slug, userId, role: "admin" };
}

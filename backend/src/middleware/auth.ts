import type { NextFunction, Request, Response } from "express";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { organizations, users, type UserRow } from "@/db/schema";
import { forbidden, unauthorized } from "@/lib/errors";
import { verifySupabaseJwt } from "@/lib/supabase-jwt";
import { verifyAttemptToken } from "@/lib/attempt-token";
import { logger } from "@/lib/logger";
import { registerOrganization, registerOrganizationSchema } from "@/modules/registration";

/**
 * Accept a pending invite on first login: if no user is linked to this identity
 * yet, and the token carries a VERIFIED email matching an invited-but-unlinked
 * row, claim that row for this identity. Verified-email matching is safe because
 * Google (via Supabase) asserts the address; we never link on an unverified one.
 */
async function claimPendingInvite(
  supabaseUserId: string,
  email: string | undefined,
  emailVerified: boolean,
): Promise<UserRow | undefined> {
  if (!email || !emailVerified) return undefined;
  const [pending] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(sql`lower(${users.email})`, email.toLowerCase()),
        isNull(users.supabaseUserId),
      ),
    )
    .limit(1);
  if (!pending) return undefined;
  const [linked] = await db
    .update(users)
    .set({ supabaseUserId })
    .where(eq(users.id, pending.id))
    .returning();
  return linked;
}

/**
 * Verifies the Supabase JWT and attaches { userId, organizationId, role } to the
 * request (AGENTS §6). Tokens are verified against the project's JWKS endpoint.
 * The DB user row is the source of truth for org + role.
 */
function bearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  // Fallback to the Supabase auth cookie if present.
  const cookie = (req as Request & { cookies?: Record<string, string> })
    .cookies?.["sb-access-token"];
  return cookie ?? null;
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = bearerToken(req);
    if (!token) throw unauthorized();

    const payload = await verifySupabaseJwt(token);
    const supabaseUserId = payload.sub;
    if (!supabaseUserId) throw unauthorized();

    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.supabaseUserId, supabaseUserId))
      .limit(1);

    const meta = payload.user_metadata as Record<string, unknown> | undefined;
    const emailVerified =
      payload.email_verified === true || meta?.email_verified === true;
    const email = typeof payload.email === "string" ? payload.email : undefined;

    let user = existing ?? (await claimPendingInvite(supabaseUserId, email, emailVerified));

    // Self-registration stores its signed onboarding data in Supabase user
    // metadata. Complete it on the first verified authenticated request so a
    // confirmation redirect cannot strand an account in auth.users only.
    if (!user && emailVerified) {
      const pendingRegistration = registerOrganizationSchema.safeParse({
        organizationName: meta?.organization_name,
        adminName: meta?.full_name,
      });
      if (pendingRegistration.success) {
        await registerOrganization(token, pendingRegistration.data);
        [user] = await db
          .select()
          .from(users)
          .where(eq(users.supabaseUserId, supabaseUserId))
          .limit(1);
      }
    }

    if (!user) throw unauthorized("No account for this identity");

    const [organization] = await db
      .select({ status: organizations.status })
      .from(organizations)
      .where(eq(organizations.id, user.organizationId))
      .limit(1);
    if (!organization || organization.status !== "active") {
      throw unauthorized("This organization is not active.");
    }

    req.ctx = {
      userId: user.id,
      organizationId: user.organizationId,
      role: user.role,
    };
    next();
  } catch (err) {
    // Log the reason (never the token) so 401s are diagnosable, then normalise.
    logger.warn(
      { reason: err instanceof Error ? err.message : "auth failed" },
      "auth rejected",
    );
    next(unauthorized());
  }
}

/**
 * Authenticates an anonymous student sitting an exam via an attempt token
 * (AGENTS §7 entry flow). This is mounted ONLY on the student sitting routes,
 * kept entirely separate from the Supabase-authenticated teacher routes, so an
 * attempt token can never reach a teacher endpoint. The context's `attemptId`
 * confines the request to one sitting — handlers assert it with `requireAttempt`.
 */
export async function attemptAuthenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = bearerToken(req);
    if (!token) throw unauthorized();

    const claims = await verifyAttemptToken(token);
    req.ctx = {
      // No user row exists for a student; the studentId is the acting identity.
      userId: claims.studentId,
      organizationId: claims.organizationId,
      role: "student",
      attemptId: claims.attemptId,
    };
    next();
  } catch (err) {
    logger.warn(
      { reason: err instanceof Error ? err.message : "attempt auth failed" },
      "attempt auth rejected",
    );
    next(unauthorized());
  }
}

/** Restrict a route to specific roles (e.g. teacher/admin only). */
export function requireRole(...roles: Array<"admin" | "teacher" | "student">) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.ctx || !roles.includes(req.ctx.role)) {
      next(forbidden("You don’t have permission to do that."));
      return;
    }
    next();
  };
}

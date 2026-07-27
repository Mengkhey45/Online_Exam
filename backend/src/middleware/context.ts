import type { Request } from "express";
import type { UserRole } from "@/db/schema";
import { forbidden, unauthorized } from "@/lib/errors";

/**
 * The authenticated request context attached by auth middleware (AGENTS §6).
 * Every downstream module depends on this being correct.
 *
 * `attemptId` is set ONLY for anonymous student sittings authenticated by an
 * attempt token (§7 entry flow); it is absent for Supabase-authenticated
 * teachers/admins. When present it means "this request may act on that one
 * attempt and no other" — enforce it with `requireAttempt`.
 */
export type RequestContext = {
  userId: string;
  organizationId: string;
  role: UserRole;
  attemptId?: string;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      ctx?: RequestContext;
      requestId?: string;
    }
  }
}

/** Read the context or throw 401 — use in handlers that require auth. */
export function requireCtx(req: Request): RequestContext {
  if (!req.ctx) throw unauthorized();
  return req.ctx;
}

/**
 * Read the context AND assert it may act on this attempt. A student's attempt
 * token is scoped to one sitting, so a token for attempt A must never drive
 * attempt B (AGENTS §7). Teacher/admin contexts carry no attemptId and pass —
 * but the student sitting routes are only ever reached through attempt auth.
 */
export function requireAttempt(req: Request, attemptId: string): RequestContext {
  const ctx = requireCtx(req);
  if (ctx.attemptId !== undefined && ctx.attemptId !== attemptId) {
    throw forbidden("This token is not valid for this attempt.");
  }
  return ctx;
}

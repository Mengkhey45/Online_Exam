import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";
import { env } from "@/config/env";

/**
 * Attempt-session tokens for anonymous students (AGENTS §7 entry flow).
 *
 * A student enters with an exam key and has no account. On start-attempt the
 * server issues a token bound to exactly one attempt + organization; the sitting
 * routes verify it and act only on that attempt. This is a capability scoped to
 * a single sitting — never a general credential, never usable on teacher routes
 * (those stay behind Supabase auth). Never log the token itself (AGENTS §9).
 */
const ISSUER = "examroom-attempt";
const AUDIENCE = "examroom-sitting";

const secret = new TextEncoder().encode(env.ATTEMPT_TOKEN_SECRET);

const claimsSchema = z.object({
  attemptId: z.string(),
  organizationId: z.string(),
  studentId: z.string(),
});
export type AttemptClaims = z.infer<typeof claimsSchema>;

/** Sign a token for one attempt. Expires when the sitting can no longer matter. */
export async function signAttemptToken(
  claims: AttemptClaims,
  expiresAt: Date,
): Promise<string> {
  return new SignJWT({
    organizationId: claims.organizationId,
    studentId: claims.studentId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.attemptId)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    // A little past the exam window so a final sync/submit still authorises.
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000) + 3600)
    .sign(secret);
}

/** Verify an attempt token. Throws (like any auth failure) if invalid/expired. */
export async function verifyAttemptToken(token: string): Promise<AttemptClaims> {
  const { payload } = await jwtVerify(token, secret, {
    issuer: ISSUER,
    audience: AUDIENCE,
  });
  return claimsSchema.parse({
    attemptId: payload.sub,
    organizationId: payload.organizationId,
    studentId: payload.studentId,
  });
}

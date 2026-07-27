import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { env } from "@/config/env";

/**
 * Verifies Supabase-issued access tokens using the project's JWKS endpoint
 * (asymmetric signing keys — the current Supabase default). This replaces the
 * legacy shared HS256 secret, so no SUPABASE_JWT_SECRET is needed.
 *
 * The key set is fetched once and cached, refreshing automatically on rotation.
 */
const jwksUrl = new URL(`${env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`);
const jwks = createRemoteJWKSet(jwksUrl);

export async function verifySupabaseJwt(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, jwks, {
    issuer: `${env.SUPABASE_URL}/auth/v1`,
  });
  return payload;
}

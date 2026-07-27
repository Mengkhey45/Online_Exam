import "dotenv/config";
import { z } from "zod";

/**
 * Zod-parsed environment (AGENTS §4). This throws on startup if a required
 * variable is missing or malformed — fail fast, never boot half-configured.
 * Every new variable is added here AND to .env.example in the same commit (§9).
 *
 * High blast radius: this file is reviewed by a second person (§5).
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),

  // The Next.js frontend origin, for CORS.
  WEB_ORIGIN: z.string().url().default("http://localhost:3000"),

  // Supabase Postgres — pooled connection string for the `postgres` driver.
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Supabase project + keys. Access tokens are verified against the project's
  // JWKS endpoint (derived from SUPABASE_URL) — no shared JWT secret needed.
  // The anon key may be the new publishable key (sb_publishable_…); the
  // service-role key may be a new secret key (sb_secret_…) and is used ONLY by
  // the worker (AGENTS §3.1 / §10), never in the API server.
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Signs attempt-session tokens for anonymous (keyless) students sitting an
  // exam (AGENTS §7 entry flow). A student has no Supabase account; start-attempt
  // issues a token bound to one attempt, verified on the sitting routes. Use a
  // long random string; rotating it invalidates in-flight sittings.
  ATTEMPT_TOKEN_SECRET: z
    .string()
    .min(32, "ATTEMPT_TOKEN_SECRET must be at least 32 characters"),

  // Third-party services. Optional so the API can boot for local work before
  // these are provisioned; the modules that use them validate presence lazily.
  ANTHROPIC_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  SENTRY_DSN: z.string().optional(),

  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    // Throw on startup — do not boot with an invalid environment.
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}

export const env = loadEnv();
export const isProd = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";

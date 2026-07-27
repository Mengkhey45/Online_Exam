import pino from "pino";
import { env, isProd } from "@/config/env";

/**
 * Structured logging (AGENTS §9). Always include organizationId and a request
 * id at the call site. NEVER log tokens, keys, answers, or student names — the
 * redaction list below is a backstop, not a substitute for care.
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "*.password",
      "*.token",
      "*.jwt",
      "*.apiKey",
      "*.answers",
      "*.studentName",
    ],
    remove: true,
  },
  ...(isProd
    ? {}
    : { transport: { target: "pino-pretty", options: { colorize: true } } }),
});

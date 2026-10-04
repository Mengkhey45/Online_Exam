import express, { type Express } from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";
import { randomUUID } from "node:crypto";
import { env } from "@/config/env";
import { authenticate } from "@/middleware/auth";
import { errorHandler, notFoundHandler } from "@/middleware/error";
import { authPublicRouter, authRouter } from "@/modules/auth";
import { organizationRouter } from "@/modules/organization";
import { teamRouter } from "@/modules/team";
import { rosterRouter } from "@/modules/roster";
import { examRouter } from "@/modules/exam";
import { attemptRouter, attemptSessionRouter } from "@/modules/attempt";
import { entryRouter } from "@/modules/entry";
import { gradingRouter } from "@/modules/grading";
import { proctoringRouter } from "@/modules/proctoring";
import { aiImportRouter } from "@/modules/ai-import";
import { registrationRouter } from "@/modules/registration";
import { bankRouter } from "@/modules/bank";

/** Assemble the API server (AGENTS §4). Wiring only — no business logic here. */
export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }));
  app.use(compression());
  app.use(cookieParser());
  app.use(express.json({ limit: "5mb" }));

  // Attach a request id for structured logging (AGENTS §9).
  app.use((req, _res, next) => {
    req.requestId = randomUUID();
    next();
  });

  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 300,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  // Public auth (token exchange) runs before authentication.
  app.use(authPublicRouter);
  app.use(registrationRouter);

  // Public student ENTRY (AGENTS §7): key lookup + start-attempt. A keyless
  // student has no Supabase token — the org is derived from the exam key.
  app.use(entryRouter);

  // Student SITTING routes, authenticated by an attempt token (not Supabase).
  // Mounted before `authenticate` so a student's token never reaches a teacher
  // route, and a teacher's JWT is never required to sit an exam. The token
  // check is applied per-route inside the router, so non-matching requests fall
  // through to the Supabase-authenticated routers untouched.
  app.use(attemptSessionRouter);

  // Everything below requires a verified Supabase JWT (AGENTS §6).
  app.use(authenticate);
  app.use(authRouter);
  app.use(organizationRouter);
  app.use(bankRouter);
  app.use(teamRouter);
  app.use(rosterRouter);
  app.use(examRouter);
  app.use(attemptRouter);
  app.use(gradingRouter);
  app.use(proctoringRouter);
  app.use(aiImportRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

import { Router } from "express";
import { validate, validated } from "@/middleware/validate";
import { requireAttempt, requireCtx } from "@/middleware/context";
import { attemptAuthenticate } from "@/middleware/auth";
import {
  ingestEvents,
  ingestEventsSchema,
  type IngestEventsInput,
} from "@/modules/proctoring";
import {
  attemptIdParams,
  createAttemptSchema,
  examIdParams,
  lockSchema,
  syncAnswersSchema,
  type CreateAttemptInput,
  type SyncAnswersInput,
} from "./attempt.schema";
import {
  createAttempt,
  getMonitoring,
  getSitting,
  lockAttempt,
  submitAttempt,
  syncAnswers,
  unlockAttempt,
} from "./attempt.service";

/**
 * Teacher/admin attempt routes — mounted behind Supabase `authenticate`.
 * The student-driven SITTING routes live in `attemptSessionRouter` below, which
 * is authenticated by an attempt token instead (AGENTS §7 entry flow).
 */
export const attemptRouter: Router = Router();

attemptRouter.post("/attempts", validate(createAttemptSchema), async (req, res) => {
  const input = validated<CreateAttemptInput>(req);
  res.status(201).json(await createAttempt(requireCtx(req), input));
});

attemptRouter.post(
  "/attempts/:id/unlock",
  validate(attemptIdParams, "params"),
  async (req, res) => {
    const { id } = validated<{ id: string }>(req, "params");
    res.json(await unlockAttempt(requireCtx(req), id));
  },
);

attemptRouter.get(
  "/exams/:id/attempts",
  validate(examIdParams, "params"),
  async (req, res) => {
    const { id } = validated<{ id: string }>(req, "params");
    res.json(await getMonitoring(requireCtx(req), id));
  },
);

/**
 * Student SITTING routes — authenticated by an attempt token (see
 * `attemptAuthenticate`) and confined to one attempt by `requireAttempt`. A
 * student has no Supabase account, so these must NOT sit behind teacher auth.
 */
export const attemptSessionRouter: Router = Router();

attemptSessionRouter.get(
  "/attempts/:id",
  attemptAuthenticate,
  validate(attemptIdParams, "params"),
  async (req, res) => {
    const { id } = validated<{ id: string }>(req, "params");
    res.json(await getSitting(requireAttempt(req, id), id));
  },
);

attemptSessionRouter.put(
  "/attempts/:id/answers",
  attemptAuthenticate,
  validate(attemptIdParams, "params"),
  validate(syncAnswersSchema),
  async (req, res) => {
    const { id } = validated<{ id: string }>(req, "params");
    const { answers } = validated<SyncAnswersInput>(req);
    res.json(await syncAnswers(requireAttempt(req, id), id, answers));
  },
);

attemptSessionRouter.post(
  "/attempts/:id/submit",
  attemptAuthenticate,
  validate(attemptIdParams, "params"),
  async (req, res) => {
    const { id } = validated<{ id: string }>(req, "params");
    res.json(await submitAttempt(requireAttempt(req, id), id));
  },
);

attemptSessionRouter.post(
  "/attempts/:id/lock",
  attemptAuthenticate,
  validate(attemptIdParams, "params"),
  validate(lockSchema),
  async (req, res) => {
    const { id } = validated<{ id: string }>(req, "params");
    const { reason } = validated<{ reason: string }>(req);
    res.json(await lockAttempt(requireAttempt(req, id), id, reason));
  },
);

// Proctoring telemetry, batched from the student's browser (AGENTS §7). Ingest
// only — it is stored as evidence and never adjusts a score (rule 3.4).
attemptSessionRouter.post(
  "/attempts/:id/events",
  attemptAuthenticate,
  validate(attemptIdParams, "params"),
  validate(ingestEventsSchema),
  async (req, res) => {
    const { id } = validated<{ id: string }>(req, "params");
    const { events } = validated<IngestEventsInput>(req);
    res.json(await ingestEvents(requireAttempt(req, id), id, events));
  },
);

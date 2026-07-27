import { Router } from "express";
import { validate, validated } from "@/middleware/validate";
import {
  entryExamIdParams,
  entryKeyParams,
  startAttemptSchema,
  type StartAttemptInput,
} from "./entry.schema";
import { lookupByKey, startAttempt } from "./entry.service";

/**
 * PUBLIC student entry routes (AGENTS §7). Mounted BEFORE `authenticate`: a
 * keyless student has no Supabase token. start-attempt returns an attempt token
 * that authorises the sitting routes.
 */
export const entryRouter: Router = Router();

entryRouter.get(
  "/entry/:key",
  validate(entryKeyParams, "params"),
  async (req, res) => {
    const { key } = validated<{ key: string }>(req, "params");
    res.json(await lookupByKey(key));
  },
);

entryRouter.post(
  "/exams/:id/attempts",
  validate(entryExamIdParams, "params"),
  validate(startAttemptSchema),
  async (req, res) => {
    const { id } = validated<{ id: string }>(req, "params");
    const input = validated<StartAttemptInput>(req);
    res.status(201).json(await startAttempt(id, input));
  },
);

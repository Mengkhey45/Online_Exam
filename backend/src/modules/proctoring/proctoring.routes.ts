import { Router } from "express";
import { validate, validated } from "@/middleware/validate";
import { requireCtx } from "@/middleware/context";
import {
  attemptIdParams,
  incidentSchema,
  type IncidentInput,
} from "./proctoring.schema";
import { getActivity, recordIncident } from "./proctoring.service";

// Teacher-facing proctoring routes (behind Supabase auth). Telemetry INGEST
// (POST /attempts/:id/events) is student-produced and lives in the attempt
// session router (attempt-token auth) instead — see attempt.routes.ts.
export const proctoringRouter: Router = Router();

proctoringRouter.get(
  "/attempts/:id/activity",
  validate(attemptIdParams, "params"),
  async (req, res) => {
    const { id } = validated<{ id: string }>(req, "params");
    res.json(await getActivity(requireCtx(req), id));
  },
);

proctoringRouter.post(
  "/attempts/:id/incident",
  validate(attemptIdParams, "params"),
  validate(incidentSchema),
  async (req, res) => {
    const { id } = validated<{ id: string }>(req, "params");
    const { note } = validated<IncidentInput>(req);
    res.status(201).json(await recordIncident(requireCtx(req), id, note));
  },
);

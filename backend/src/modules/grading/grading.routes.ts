import { Router } from "express";
import { validate, validated } from "@/middleware/validate";
import { requireCtx } from "@/middleware/context";
import {
  answerIdParams,
  examIdParams,
  scoreSchema,
  type ScoreInput,
} from "./grading.schema";
import { getGrading, releaseResults, scoreAnswer } from "./grading.service";

export const gradingRouter: Router = Router();

gradingRouter.get(
  "/exams/:id/grading",
  validate(examIdParams, "params"),
  async (req, res) => {
    const { id } = validated<{ id: string }>(req, "params");
    res.json(await getGrading(requireCtx(req), id));
  },
);

gradingRouter.put(
  "/answers/:id/score",
  validate(answerIdParams, "params"),
  validate(scoreSchema),
  async (req, res) => {
    const { id } = validated<{ id: string }>(req, "params");
    const { awarded, comment } = validated<ScoreInput>(req);
    res.json(await scoreAnswer(requireCtx(req), id, awarded, comment));
  },
);

gradingRouter.post(
  "/exams/:id/release-results",
  validate(examIdParams, "params"),
  async (req, res) => {
    const { id } = validated<{ id: string }>(req, "params");
    res.json(await releaseResults(requireCtx(req), id));
  },
);

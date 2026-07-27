import { Router } from "express";
import { validate, validated } from "@/middleware/validate";
import { requireCtx } from "@/middleware/context";
import {
  createExamGroupSchema,
  createExamSchema,
  examConfigSchema,
  examIdParams,
  patchExamSchema,
  type CreateExamGroupInput,
  type CreateExamInput,
  type ExamConfigInput,
  type PatchExamInput,
} from "./exam.schema";
import {
  createExam,
  createGroup,
  exportResultsCsv,
  getExam,
  listGroupsWithExams,
  patchExam,
} from "./exam.service";
import { getExamConfig, saveExamConfig } from "./config.service";
import { publishExam } from "./publish.service";
import { getVersion } from "./versioning.service";

// Thin handlers (AGENTS §4): validate, call service, respond. Express 5
// forwards async rejections to the error middleware automatically.
export const examRouter: Router = Router();

examRouter.get("/exam-groups", async (req, res) => {
  res.json(await listGroupsWithExams(requireCtx(req)));
});

examRouter.post(
  "/exam-groups",
  validate(createExamGroupSchema),
  async (req, res) => {
    const input = validated<CreateExamGroupInput>(req);
    res.status(201).json(await createGroup(requireCtx(req), input));
  },
);

examRouter.get("/exams/dashboard", async (req, res) => {
  res.json(await listGroupsWithExams(requireCtx(req)));
});

examRouter.post("/exams", validate(createExamSchema), async (req, res) => {
  const input = validated<CreateExamInput>(req);
  res.status(201).json(await createExam(requireCtx(req), input));
});

examRouter.get(
  "/exams/:id",
  validate(examIdParams, "params"),
  async (req, res) => {
    const { id } = validated<{ id: string }>(req, "params");
    res.json(await getExam(requireCtx(req), id));
  },
);

examRouter.patch(
  "/exams/:id",
  validate(examIdParams, "params"),
  validate(patchExamSchema),
  async (req, res) => {
    const { id } = validated<{ id: string }>(req, "params");
    const input = validated<PatchExamInput>(req);
    res.json(await patchExam(requireCtx(req), id, input));
  },
);

// Configuration screen (frontend §7). Read assembles columns + jsonb; write
// splits them back. Returns 409 if the exam is published (see saveExamConfig).
examRouter.get(
  "/exams/:id/config",
  validate(examIdParams, "params"),
  async (req, res) => {
    const { id } = validated<{ id: string }>(req, "params");
    res.json(await getExamConfig(requireCtx(req), id));
  },
);

examRouter.patch(
  "/exams/:id/config",
  validate(examIdParams, "params"),
  validate(examConfigSchema),
  async (req, res) => {
    const { id } = validated<{ id: string }>(req, "params");
    const input = validated<ExamConfigInput>(req);
    res.json(await saveExamConfig(requireCtx(req), id, input));
  },
);

examRouter.get(
  "/exams/:id/export",
  validate(examIdParams, "params"),
  async (req, res) => {
    const { id } = validated<{ id: string }>(req, "params");
    const csv = await exportResultsCsv(requireCtx(req), id);
    res.setHeader("Content-Type", "text/csv");
    res.send(csv);
  },
);

// Mengkhey §7 — publishing and version reads.
examRouter.post(
  "/exams/:id/publish",
  validate(examIdParams, "params"),
  async (req, res) => {
    const { id } = validated<{ id: string }>(req, "params");
    res.json(await publishExam(requireCtx(req), id));
  },
);

examRouter.get("/exam-versions/:id", async (req, res) => {
  res.json(await getVersion(requireCtx(req), req.params.id));
});

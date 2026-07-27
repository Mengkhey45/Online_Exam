import { Router } from "express";
import { validate, validated } from "@/middleware/validate";
import { requireCtx } from "@/middleware/context";
import { unauthorized } from "@/lib/errors";
import {
  applyConversionSchema,
  blockParams,
  createImportSchema,
  examConversionParams,
  importIdParams,
  patchBlockSchema,
  uploadUrlSchema,
  type ApplyConversionInput,
  type CreateImportInput,
  type PatchBlockInput,
  type UploadUrlInput,
} from "./ai-import.schema";
import {
  applyConversionByExam,
  approveImport,
  createImport,
  createUploadUrl,
  getConversionByExam,
  getImport,
  patchBlock,
} from "./ai-import.service";

export const aiImportRouter: Router = Router();

// Exam-keyed review endpoints the frontend uses (§7). They resolve the exam's
// latest import and delegate to the importId-keyed logic above.
aiImportRouter.get(
  "/exams/:examId/conversion",
  validate(examConversionParams, "params"),
  async (req, res) => {
    const { examId } = validated<{ examId: string }>(req, "params");
    res.json(await getConversionByExam(requireCtx(req), examId));
  },
);

aiImportRouter.post(
  "/exams/:examId/conversion/apply",
  validate(examConversionParams, "params"),
  validate(applyConversionSchema),
  async (req, res) => {
    const { examId } = validated<{ examId: string }>(req, "params");
    const input = validated<ApplyConversionInput>(req);
    res.json(await applyConversionByExam(requireCtx(req), examId, input));
  },
);

aiImportRouter.post(
  "/uploads/exam-pdf",
  validate(uploadUrlSchema),
  async (req, res) => {
    const { filename } = validated<UploadUrlInput>(req);
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) throw unauthorized();
    res.json(await createUploadUrl(requireCtx(req), token, filename));
  },
);

aiImportRouter.post("/imports", validate(createImportSchema), async (req, res) => {
  const input = validated<CreateImportInput>(req);
  res.status(201).json(await createImport(requireCtx(req), input));
});

aiImportRouter.get(
  "/imports/:id",
  validate(importIdParams, "params"),
  async (req, res) => {
    const { id } = validated<{ id: string }>(req, "params");
    res.json(await getImport(requireCtx(req), id));
  },
);

aiImportRouter.patch(
  "/imports/:id/blocks/:blockId",
  validate(blockParams, "params"),
  validate(patchBlockSchema),
  async (req, res) => {
    const { id, blockId } = validated<{ id: string; blockId: string }>(
      req,
      "params",
    );
    const input = validated<PatchBlockInput>(req);
    res.json(await patchBlock(requireCtx(req), id, blockId, input));
  },
);

aiImportRouter.post(
  "/imports/:id/approve",
  validate(importIdParams, "params"),
  async (req, res) => {
    const { id } = validated<{ id: string }>(req, "params");
    res.json(await approveImport(requireCtx(req), id));
  },
);

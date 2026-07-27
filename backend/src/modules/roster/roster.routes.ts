import { Router } from "express";
import { validate, validated } from "@/middleware/validate";
import { requireCtx } from "@/middleware/context";
import { unauthorized } from "@/lib/errors";
import {
  importIdParams,
  patchRowSchema,
  rowParams,
  scanImportSchema,
  scanUploadSchema,
  startImportSchema,
  type PatchRowInput,
  type ScanImportInput,
  type ScanUploadInput,
  type StartImportInput,
} from "./roster.schema";
import {
  confirmImport,
  createScanImport,
  createScanUploadUrl,
  getImport,
  patchRow,
  startImport,
} from "./roster.service";

export const rosterRouter: Router = Router();

// AI roster scan (Phase 2): sign an upload, then queue the extraction job. The
// review + confirm reuse the CSV import's /roster/imports/:id endpoints.
rosterRouter.post(
  "/roster/uploads/scan",
  validate(scanUploadSchema),
  async (req, res) => {
    const { filename } = validated<ScanUploadInput>(req);
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) throw unauthorized();
    res.json(await createScanUploadUrl(requireCtx(req), token, filename));
  },
);

rosterRouter.post("/roster/scan", validate(scanImportSchema), async (req, res) => {
  const input = validated<ScanImportInput>(req);
  res.status(201).json(await createScanImport(requireCtx(req), input));
});

rosterRouter.post(
  "/roster/imports",
  validate(startImportSchema),
  async (req, res) => {
    const input = validated<StartImportInput>(req);
    res.status(201).json(await startImport(requireCtx(req), input));
  },
);

rosterRouter.get(
  "/roster/imports/:id",
  validate(importIdParams, "params"),
  async (req, res) => {
    const { id } = validated<{ id: string }>(req, "params");
    res.json(await getImport(requireCtx(req), id));
  },
);

rosterRouter.patch(
  "/roster/imports/:id/rows/:rowId",
  validate(rowParams, "params"),
  validate(patchRowSchema),
  async (req, res) => {
    const { id, rowId } = validated<{ id: string; rowId: string }>(
      req,
      "params",
    );
    const patch = validated<PatchRowInput>(req);
    res.json(await patchRow(requireCtx(req), id, rowId, patch));
  },
);

rosterRouter.post(
  "/roster/imports/:id/confirm",
  validate(importIdParams, "params"),
  async (req, res) => {
    const { id } = validated<{ id: string }>(req, "params");
    res.json(await confirmImport(requireCtx(req), id));
  },
);

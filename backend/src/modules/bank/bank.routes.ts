import { Router } from "express";
import { validate, validated } from "@/middleware/validate";
import { requireCtx } from "@/middleware/context";
import { bankNameParams, bankQuestionIdParams, copyBankParams, copyBankQuestionSchema, createBankQuestionSchema, updateBankNameSchema, updateBankQuestionSchema, type CopyBankQuestionInput, type CreateBankQuestionInput, type UpdateBankQuestionInput } from "./bank.schema";
import { copyBankQuestion, createBankQuestion, deleteBank, deleteBankQuestion, listBankQuestions, renameBank, updateBankQuestion } from "./bank.service";

export const bankRouter: Router = Router();

bankRouter.get("/bank/questions", async (req, res) => {
  res.json(await listBankQuestions(requireCtx(req)));
});

bankRouter.post("/bank/questions", validate(createBankQuestionSchema), async (req, res) => {
  res.status(201).json(await createBankQuestion(requireCtx(req), validated<CreateBankQuestionInput>(req)));
});

bankRouter.post("/exams/:examId/questions/from-bank", validate(copyBankParams, "params"), validate(copyBankQuestionSchema), async (req, res) => {
  const { examId } = validated<{ examId: string }>(req, "params");
  res.status(201).json(await copyBankQuestion(requireCtx(req), examId, validated<CopyBankQuestionInput>(req)));
});

bankRouter.patch("/bank/questions/:id", validate(bankQuestionIdParams, "params"), validate(updateBankQuestionSchema), async (req, res) => {
  const { id } = validated<{ id: string }>(req, "params");
  res.json(await updateBankQuestion(requireCtx(req), id, validated<UpdateBankQuestionInput>(req)));
});

bankRouter.delete("/bank/questions/:id", validate(bankQuestionIdParams, "params"), async (req, res) => {
  const { id } = validated<{ id: string }>(req, "params");
  res.json(await deleteBankQuestion(requireCtx(req), id));
});

bankRouter.patch("/bank/banks/:name", validate(bankNameParams, "params"), validate(updateBankNameSchema), async (req, res) => {
  const { name } = validated<{ name: string }>(req, "params");
  const { name: nextName } = validated<{ name: string }>(req);
  res.json(await renameBank(requireCtx(req), name, nextName));
});

bankRouter.delete("/bank/banks/:name", validate(bankNameParams, "params"), async (req, res) => {
  const { name } = validated<{ name: string }>(req, "params");
  res.json(await deleteBank(requireCtx(req), name));
});
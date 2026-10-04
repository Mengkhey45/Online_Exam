import { and, eq, count } from "drizzle-orm";
import { questionBank, examQuestions, exams } from "@/db/schema";
import { scopedDb } from "@/db/scoped";
import { conflict, notFound } from "@/lib/errors";
import { newId } from "@/lib/ids";
import type { RequestContext } from "@/middleware/context";
import type { Block } from "@/schema";
import type { CopyBankQuestionInput, CreateBankQuestionInput, UpdateBankQuestionInput } from "./bank.schema";

export async function listBankQuestions(ctx: RequestContext) {
  const sdb = scopedDb(ctx.organizationId);
  const rows = await sdb.db.select().from(questionBank).where(sdb.where(questionBank, eq(questionBank.createdBy, ctx.userId)));
  const used = await sdb.db
    .select({ sourceQuestionId: examQuestions.sourceQuestionId, count: count() })
    .from(examQuestions)
    .where(sdb.where(examQuestions))
    .groupBy(examQuestions.sourceQuestionId);
  const usedBySource = new Map(used.map((row) => [row.sourceQuestionId, row.count]));
  return rows.map((row) => ({
    ...row.block,
    id: row.id,
    bankName: row.bankName,
    subject: row.subject,
    difficulty: row.difficulty,
    usedCount: usedBySource.get(row.id) ?? 0,
  }));
}

export async function createBankQuestion(ctx: RequestContext, input: CreateBankQuestionInput) {
  const sdb = scopedDb(ctx.organizationId);
  const id = newId("q");
  await sdb.db.insert(questionBank).values(sdb.withOrg({
    id,
    createdBy: ctx.userId,
    bankName: input.bankName,
    subject: input.bankName,
    difficulty: input.difficulty,
    block: input.block,
  }));
  return { id };
}

export async function copyBankQuestion(
  ctx: RequestContext,
  examId: string,
  input: CopyBankQuestionInput,
) {
  const sdb = scopedDb(ctx.organizationId);
  const [exam] = await sdb.db.select().from(exams).where(sdb.where(exams, and(eq(exams.id, examId), eq(exams.createdBy, ctx.userId)))).limit(1);
  if (!exam) throw notFound("Exam not found");
  if (exam.status !== "draft") throw conflict("EXAM_ALREADY_PUBLISHED", "Published exams cannot receive new questions.");
  const [source] = await sdb.db.select().from(questionBank).where(sdb.where(questionBank, and(eq(questionBank.id, input.questionId), eq(questionBank.createdBy, ctx.userId)))).limit(1);
  if (!source) throw notFound("Question bank item not found");
  // The builder may have created this section locally but not saved it yet.
  // Draft save persists the section and copied block together, so do not
  // reject a valid teacher-owned section solely because it is not in the DB.
  const [position] = await sdb.db.select({ value: count() }).from(examQuestions).where(sdb.where(examQuestions, eq(examQuestions.sectionId, input.sectionId)));
  const block = source.block;
  const id = newId("q");
  await sdb.db.insert(examQuestions).values(sdb.withOrg({
    id,
    examId,
    sectionId: input.sectionId,
    sourceQuestionId: source.id,
    type: block.type,
    stem: block.stem,
    marks: block.marks,
    required: block.required,
    pinned: block.pinned ?? null,
    options: block.options ?? null,
    blanks: block.blanks ?? null,
    language: block.language ?? null,
    charLimit: block.charLimit ?? null,
    shuffleOptions: block.shuffleOptions ?? null,
    reviewed: block.reviewed ?? null,
    confidence: block.confidence ?? null,
    position: position?.value ?? 0,
  }));
  return { block: { ...block, id, sourceQuestionId: source.id } satisfies Block };
}

export async function updateBankQuestion(ctx: RequestContext, id: string, input: UpdateBankQuestionInput) {
  const sdb = scopedDb(ctx.organizationId);
  const [row] = await sdb.db.select().from(questionBank).where(sdb.where(questionBank, and(eq(questionBank.id, id), eq(questionBank.createdBy, ctx.userId)))).limit(1);
  if (!row) throw notFound("Question bank item not found");
  await sdb.db.update(questionBank).set({
    bankName: input.bankName ?? row.bankName,
    subject: input.bankName ?? row.subject,
    difficulty: input.difficulty ?? row.difficulty,
    block: input.block ? { ...row.block, ...input.block, id: row.block.id } : row.block,
    updatedAt: new Date(),
  }).where(sdb.where(questionBank, eq(questionBank.id, id)));
  return { ok: true };
}

export async function renameBank(ctx: RequestContext, oldName: string, name: string) {
  const sdb = scopedDb(ctx.organizationId);
  await sdb.db.update(questionBank).set({ bankName: name, subject: name, updatedAt: new Date() }).where(sdb.where(questionBank, and(eq(questionBank.createdBy, ctx.userId), eq(questionBank.bankName, oldName))));
  return { ok: true };
}

export async function deleteBankQuestion(ctx: RequestContext, id: string) {
  const sdb = scopedDb(ctx.organizationId);
  const deleted = await sdb.db.delete(questionBank).where(sdb.where(questionBank, and(eq(questionBank.id, id), eq(questionBank.createdBy, ctx.userId)))).returning({ id: questionBank.id });
  if (deleted.length === 0) throw notFound("Question bank item not found");
  return { ok: true };
}

export async function deleteBank(ctx: RequestContext, name: string) {
  const sdb = scopedDb(ctx.organizationId);
  await sdb.db.delete(questionBank).where(sdb.where(questionBank, and(eq(questionBank.createdBy, ctx.userId), eq(questionBank.bankName, name))));
  return { ok: true };
}
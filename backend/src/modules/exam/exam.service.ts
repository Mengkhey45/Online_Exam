import { count, eq, inArray } from "drizzle-orm";
import { scopedDb } from "@/db/scoped";
import {
  attempts,
  examGroups,
  examQuestions,
  examSections,
  exams,
  students,
} from "@/db/schema";
import { newExamKey, newId } from "@/lib/ids";
import { conflict, notFound } from "@/lib/errors";
import type { RequestContext } from "@/middleware/context";
import type { Exam } from "@/schema";
import { assembleExam, computeTotalMarks } from "./exam.mapping";
import type {
  CreateExamGroupInput,
  CreateExamInput,
  PatchExamInput,
} from "./exam.schema";

export type ExamSummary = {
  id: string;
  title: string;
  createdAt: string;
  examKey: string;
  status: string;
  access: string;
  security: string;
  questionCount: number;
  enteredStudents: number;
  totalStudents: number;
};

/** Dashboard feed: groups, each with a summary table of exams (frontend §7). */
export async function listGroupsWithExams(ctx: RequestContext) {
  const sdb = scopedDb(ctx.organizationId);

  const [groupRows, examRows, totalStudentsRow] = await Promise.all([
    sdb.db.select().from(examGroups).where(sdb.where(examGroups)),
    sdb.db.select().from(exams).where(sdb.where(exams)),
    sdb.db.select({ n: count() }).from(students).where(sdb.where(students)),
  ]);
  const totalStudents = totalStudentsRow[0]?.n ?? 0;

  const examIds = examRows.map((e) => e.id);
  const questionCounts = await questionCountsByExam(ctx, examIds);
  const enteredCounts = await enteredCountsByExam(ctx, examIds);

  const summaries = new Map<string, ExamSummary[]>();
  for (const e of examRows) {
    const list = summaries.get(e.groupId) ?? [];
    list.push({
      id: e.id,
      title: e.title,
      createdAt: e.createdAt.toISOString(),
      examKey: e.examKey,
      status: e.status,
      access: e.access,
      security: e.security,
      questionCount: questionCounts.get(e.id) ?? 0,
      enteredStudents: enteredCounts.get(e.id) ?? 0,
      totalStudents,
    });
    summaries.set(e.groupId, list);
  }

  return {
    groups: groupRows.map((g) => ({
      id: g.id,
      name: g.name,
      exams: summaries.get(g.id) ?? [],
    })),
  };
}

async function questionCountsByExam(ctx: RequestContext, examIds: string[]) {
  const map = new Map<string, number>();
  if (examIds.length === 0) return map;
  const sdb = scopedDb(ctx.organizationId);
  const rows = await sdb.db
    .select({ examId: examQuestions.examId, n: count() })
    .from(examQuestions)
    .where(sdb.where(examQuestions, inArray(examQuestions.examId, examIds)))
    .groupBy(examQuestions.examId);
  for (const r of rows) map.set(r.examId, r.n);
  return map;
}

async function enteredCountsByExam(ctx: RequestContext, examIds: string[]) {
  const map = new Map<string, number>();
  if (examIds.length === 0) return map;
  const sdb = scopedDb(ctx.organizationId);
  const rows = await sdb.db
    .select({ examId: attempts.examId, n: count() })
    .from(attempts)
    .where(sdb.where(attempts, inArray(attempts.examId, examIds)))
    .groupBy(attempts.examId);
  for (const r of rows) map.set(r.examId, r.n);
  return map;
}

export async function createGroup(
  ctx: RequestContext,
  input: CreateExamGroupInput,
) {
  const sdb = scopedDb(ctx.organizationId);
  const row = { id: newId("grp"), name: input.name };
  await sdb.db.insert(examGroups).values(sdb.withOrg(row));
  return { id: row.id, name: row.name, exams: [] };
}

export async function createExam(ctx: RequestContext, input: CreateExamInput) {
  const sdb = scopedDb(ctx.organizationId);
  const examId = newId("exm");
  await sdb.db.insert(exams).values(
    sdb.withOrg({
      id: examId,
      groupId: input.groupId,
      title: input.title,
      examKey: newExamKey(),
    }),
  );
  // Every new exam opens with one empty section (matches the builder).
  await sdb.db.insert(examSections).values(
    sdb.withOrg({
      id: newId("sec"),
      examId,
      title: "Section 1",
      position: 0,
    }),
  );
  return getExam(ctx, examId);
}

export async function getExam(ctx: RequestContext, id: string): Promise<Exam> {
  const sdb = scopedDb(ctx.organizationId);
  const [exam] = await sdb.db
    .select()
    .from(exams)
    .where(sdb.where(exams, eq(exams.id, id)))
    .limit(1);
  if (!exam) throw notFound("Exam not found");

  const [sectionRows, questionRows] = await Promise.all([
    sdb.db
      .select()
      .from(examSections)
      .where(sdb.where(examSections, eq(examSections.examId, id))),
    sdb.db
      .select()
      .from(examQuestions)
      .where(sdb.where(examQuestions, eq(examQuestions.examId, id))),
  ]);
  return assembleExam(exam, sectionRows, questionRows);
}

export async function patchExam(
  ctx: RequestContext,
  id: string,
  input: PatchExamInput,
): Promise<Exam> {
  const sdb = scopedDb(ctx.organizationId);
  const [exam] = await sdb.db
    .select()
    .from(exams)
    .where(sdb.where(exams, eq(exams.id, id)))
    .limit(1);
  if (!exam) throw notFound("Exam not found");

  // Published exams are immutable here — editing creates a new version, which
  // is Mengkhey's publish module (AGENTS §6).
  if (exam.status === "published") {
    throw conflict(
      "EXAM_ALREADY_PUBLISHED",
      "This exam is published. Editing creates a new version.",
    );
  }

  const header: Record<string, unknown> = { updatedAt: new Date() };
  if (input.title !== undefined) header.title = input.title;
  if (input.access !== undefined) header.access = input.access;
  if (input.security !== undefined) header.security = input.security;
  if (input.durationMinutes !== undefined)
    header.durationMinutes = input.durationMinutes;
  if (input.passMarkPct !== undefined) header.passMarkPct = input.passMarkPct;
  if (input.scheduledStart !== undefined)
    header.scheduledStart = input.scheduledStart
      ? new Date(input.scheduledStart)
      : null;
  if (input.scheduledEnd !== undefined)
    header.scheduledEnd = input.scheduledEnd
      ? new Date(input.scheduledEnd)
      : null;
  if (input.config !== undefined) header.config = input.config;

  if (input.sections) {
    header.totalMarks = computeTotalMarks(input.sections);
  }

  await sdb.db
    .update(exams)
    .set(header)
    .where(sdb.where(exams, eq(exams.id, id)));

  if (input.sections) {
    await replaceContent(ctx, id, input.sections);
  }
  return getExam(ctx, id);
}

/** Replace all draft sections/questions for an exam (full-content save). */
async function replaceContent(
  ctx: RequestContext,
  examId: string,
  sections: Exam["sections"],
) {
  const sdb = scopedDb(ctx.organizationId);
  await sdb.db
    .delete(examQuestions)
    .where(sdb.where(examQuestions, eq(examQuestions.examId, examId)));
  await sdb.db
    .delete(examSections)
    .where(sdb.where(examSections, eq(examSections.examId, examId)));

  for (const [si, s] of sections.entries()) {
    await sdb.db.insert(examSections).values(
      sdb.withOrg({
        id: s.id,
        examId,
        title: s.title,
        instructions: s.instructions,
        mode: s.mode,
        shuffleQuestions: s.shuffleQuestions,
        pdfPageUrls: s.pdfPageUrls ?? null,
        position: si,
      }),
    );
    for (const [bi, b] of s.blocks.entries()) {
      await sdb.db.insert(examQuestions).values(
        sdb.withOrg({
          id: b.id,
          examId,
          sectionId: s.id,
          type: b.type,
          stem: b.stem,
          marks: b.marks,
          required: b.required,
          pinned: b.pinned ?? null,
          options: b.options ?? null,
          blanks: b.blanks ?? null,
          language: b.language ?? null,
          charLimit: b.charLimit ?? null,
          shuffleOptions: b.shuffleOptions ?? null,
          reviewed: b.reviewed ?? null,
          confidence: b.confidence ?? null,
          position: bi,
        }),
      );
    }
  }
}

/** Results export (AGENTS §6). CSV of each attempt's total awarded marks. */
export async function exportResultsCsv(
  ctx: RequestContext,
  examId: string,
): Promise<string> {
  const sdb = scopedDb(ctx.organizationId);
  const rows = await sdb.db
    .select({
      studentId: attempts.studentId,
      status: attempts.status,
    })
    .from(attempts)
    .where(sdb.where(attempts, eq(attempts.examId, examId)));

  const header = "student_id,status";
  const lines = rows.map((r) => `${r.studentId},${r.status}`);
  return [header, ...lines].join("\n");
}

import { and, count, eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  examQuestions,
  exams,
  organizations,
  students,
} from "@/db/schema";
import type { ExamConfig } from "@/db/schema/exams";
import { newId } from "@/lib/ids";
import { badRequest, forbidden, notFound } from "@/lib/errors";
import { signAttemptToken } from "@/lib/attempt-token";
import { createAttempt } from "@/modules/attempt";
import type { RequestContext } from "@/middleware/context";
import type { StartAttemptInput } from "./entry.schema";

/**
 * The student entry flow (AGENTS §7): key lookup and start-attempt. These are
 * PUBLIC — a student enters with an exam key and has no account. The org is
 * derived from the key/exam, never from an auth context, so these queries use
 * the unscoped `db` and derive the organizationId from the exam row itself.
 */

type EntryField = {
  id: string;
  label: string;
  type: "text" | "email";
  required: boolean;
  prefilled?: string;
};

// Minimum details when an exam hasn't customised its student-info fields.
const DEFAULT_ENTRY_FIELDS: EntryField[] = [
  { id: "student_id", label: "Student ID", type: "text", required: true },
  { id: "full_name", label: "Full name", type: "text", required: true },
];

/** Fields the student is asked to confirm, from the exam's config (or default). */
function entryFields(config: ExamConfig): EntryField[] {
  const studentInfo = (config as { studentInfo?: { fields?: unknown } })
    .studentInfo;
  const fields = Array.isArray(studentInfo?.fields) ? studentInfo.fields : null;
  if (!fields) return DEFAULT_ENTRY_FIELDS;

  const mapped: EntryField[] = [];
  for (const f of fields as Array<Record<string, unknown>>) {
    if (f.collect !== true) continue;
    const id = String(f.id);
    mapped.push({
      id,
      label: String(f.label ?? id),
      type: id === "email" ? "email" : "text",
      // A locked field (e.g. student ID) is always required; others too, since
      // the exam chose to collect them.
      required: true,
    });
  }
  return mapped.length > 0 ? mapped : DEFAULT_ENTRY_FIELDS;
}

/** Reject keys for exams that aren't currently open (AGENTS §7). */
function assertOpenForEntry(exam: typeof exams.$inferSelect): void {
  if (exam.status !== "published" || !exam.currentVersionId) {
    throw badRequest("EXAM_NOT_PUBLISHED", "This exam is not open yet.");
  }
  if (exam.access === "closed") {
    throw forbidden("This exam is not open for entry.");
  }
  if (exam.access === "scheduled") {
    const now = Date.now();
    if (exam.scheduledStart && now < exam.scheduledStart.getTime()) {
      throw forbidden("This exam has not started yet.");
    }
    if (exam.scheduledEnd && now > exam.scheduledEnd.getTime()) {
      throw forbidden("This exam has closed.");
    }
  }
}

export async function lookupByKey(key: string) {
  const normalized = key.trim().toUpperCase();
  const [exam] = await db
    .select()
    .from(exams)
    .where(eq(exams.examKey, normalized))
    .limit(1);
  if (!exam) throw notFound("No exam matches that key. Check it and try again.");
  assertOpenForEntry(exam);

  const [org] = await db
    .select({ name: organizations.name })
    .from(organizations)
    .where(eq(organizations.id, exam.organizationId))
    .limit(1);

  const [{ n: questionCount }] = await db
    .select({ n: count() })
    .from(examQuestions)
    .where(eq(examQuestions.examId, exam.id));

  return {
    examId: exam.id,
    title: exam.title,
    institution: org?.name ?? "",
    durationMinutes: exam.durationMinutes,
    questionCount,
    totalMarks: exam.totalMarks,
    security: exam.security,
    fields: entryFields(exam.config),
  };
}

/** Find a student by ref within the org, or create one from entered details. */
async function findOrCreateStudent(
  organizationId: string,
  details: Record<string, string>,
): Promise<string> {
  const ref = details.student_id?.trim();
  if (ref) {
    const [existing] = await db
      .select({ id: students.id })
      .from(students)
      .where(
        and(
          eq(students.organizationId, organizationId),
          eq(students.studentRef, ref),
        ),
      )
      .limit(1);
    if (existing) return existing.id;
  }

  const id = newId("std");
  await db.insert(students).values({
    id,
    organizationId,
    studentRef: ref || id,
    name: details.full_name?.trim() || "Student",
    email: details.email?.trim() || "",
    program: details.class?.trim() || null,
  });
  return id;
}

export async function startAttempt(examId: string, input: StartAttemptInput) {
  const [exam] = await db
    .select()
    .from(exams)
    .where(eq(exams.id, examId))
    .limit(1);
  if (!exam) throw notFound("Exam not found");
  assertOpenForEntry(exam);

  const studentId = await findOrCreateStudent(exam.organizationId, input.details);

  // Reuse the §7 attempt engine (presented order, version snapshot) with a
  // context synthesised from the exam's org — the student has no user row.
  const ctx: RequestContext = {
    userId: studentId,
    organizationId: exam.organizationId,
    role: "student",
  };
  const { attemptId, expiresAt } = await createAttempt(ctx, {
    examId,
    studentId,
  });

  const attemptToken = await signAttemptToken(
    { attemptId, organizationId: exam.organizationId, studentId },
    expiresAt,
  );

  return { attemptId, attemptToken };
}

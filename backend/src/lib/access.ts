import { eq } from "drizzle-orm";
import { scopedDb } from "@/db/scoped";
import { attempts, exams } from "@/db/schema";
import { notFound } from "./errors";
import type { RequestContext } from "@/middleware/context";

// ADDED: new function to verify the user owns the exam
export async function assertCanMonitorExam(ctx: RequestContext, examId: string) {
    const sdb = scopedDb(ctx.organizationId);
    const [exam] = await sdb.db
        .select({ id: exams.id, title: exams.title, ownerId: exams.createdBy })
        .from(exams)
        .where(sdb.where(exams, eq(exams.id, examId)))
        .limit(1);

    if (!exam) throw notFound("Exam not found");
    if (ctx.role !== "admin" && exam.ownerId !== ctx.userId) {
        throw notFound("Exam not found");
    }
    return exam;
}

// ADDED: new function to verify the user owns the exam tied to a specific attempt
export async function assertCanMonitorAttempt(ctx: RequestContext, attemptId: string) {
    const sdb = scopedDb(ctx.organizationId);
    const [a] = await sdb.db
        .select({ examId: attempts.examId })
        .from(attempts)
        .where(sdb.where(attempts, eq(attempts.id, attemptId)))
        .limit(1);

    if (!a) throw notFound("Attempt not found");
    return assertCanMonitorExam(ctx, a.examId);
}
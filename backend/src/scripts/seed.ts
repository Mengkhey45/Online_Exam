import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  attempts,
  examGroups,
  examQuestions,
  examSections,
  exams,
  organizations,
  students,
  users,
} from "@/db/schema";
import { listGroupsWithExams } from "@/modules/exam/exam.service";
import { publishExam } from "@/modules/exam/publish.service";
import {
  createAttempt,
  getMonitoring,
  getSitting,
  syncAnswers,
} from "@/modules/attempt/attempt.service";
import { getGrading } from "@/modules/grading/grading.service";
import type { RequestContext } from "@/middleware/context";

/**
 * Idempotent dev seed. Creates an organisation, a teacher, an exam group, an
 * exam, then PUBLISHES it and creates a student attempt with one scored answer
 * — enough data to see the dashboard, monitoring, grading, and student runtime
 * screens working against real data. Re-runnable.
 *
 * Link it to your real login: SEED_SUPABASE_UID=<supabase auth uid> npm run seed
 */
const ORG_ID = "org_demo";
const USER_ID = "usr_demo";
const GROUP_ID = "grp_demo";
const EXAM_ID = "exm_demo";
const SECTION_ID = "sec_demo";
const STUDENT_ID = "std_demo";

const ctx: RequestContext = {
  userId: USER_ID,
  organizationId: ORG_ID,
  role: "teacher",
};

async function main() {
  const supabaseUid =
    process.env.SEED_SUPABASE_UID ?? "seed-placeholder-uid-replace-me";

  await db.insert(organizations).values({
    id: ORG_ID,
    name: "Riverside University",
    slug: "riverside-university",
    status: "active",
    plan: "trial",
  }).onConflictDoNothing();

  // Upsert the login link: when SEED_SUPABASE_UID is given, RE-link an existing
  // demo user to it (onConflictDoNothing would silently skip the update, which
  // is why re-seeding never fixed a stale link). Without the env var, don't
  // clobber a real link with the placeholder.
  const userInsert = db.insert(users).values({
    id: USER_ID,
    organizationId: ORG_ID,
    supabaseUserId: supabaseUid,
    email: "teacher@riverside.edu",
    name: "Demo Teacher",
    role: "teacher",
  });
  if (process.env.SEED_SUPABASE_UID) {
    await userInsert.onConflictDoUpdate({
      target: users.id,
      set: { supabaseUserId: supabaseUid },
    });
  } else {
    await userInsert.onConflictDoNothing();
  }

  await db.insert(examGroups).values({
    id: GROUP_ID,
    organizationId: ORG_ID,
    name: "Computer Science · Year 2",
  }).onConflictDoNothing();

  await db.insert(exams).values({
    id: EXAM_ID,
    organizationId: ORG_ID,
    groupId: GROUP_ID,
    title: "Algorithms — Midterm",
    status: "draft",
    access: "scheduled",
    security: "high",
    durationMinutes: 90,
    examKey: "ALGO-7F3K",
  }).onConflictDoNothing();

  await db.insert(examSections).values({
    id: SECTION_ID,
    organizationId: ORG_ID,
    examId: EXAM_ID,
    title: "Section A — Concepts",
    shuffleQuestions: true,
    position: 0,
  }).onConflictDoNothing();

  await db.insert(examQuestions).values({
    id: "q_demo_1",
    organizationId: ORG_ID,
    examId: EXAM_ID,
    sectionId: SECTION_ID,
    type: "mcq",
    stem: "The time complexity of binary search on a sorted array is:",
    marks: 1,
    required: true,
    shuffleOptions: true,
    options: [
      { id: "opt_1", text: "$O(\\log n)$", isCorrect: true },
      { id: "opt_2", text: "$O(n)$", isCorrect: false },
      { id: "opt_3", text: "$O(1)$", isCorrect: false },
    ],
    position: 0,
  }).onConflictDoNothing();

  await db.insert(students).values({
    id: STUDENT_ID,
    organizationId: ORG_ID,
    studentRef: "S-2048",
    name: "Ada Lovelace",
    email: "ada@riverside.edu",
  }).onConflictDoNothing();

  // Publish (only once) so the exam can be sat.
  const [examRow] = await db.select().from(exams).where(eq(exams.id, EXAM_ID)).limit(1);
  if (examRow && examRow.status !== "published") {
    await publishExam(ctx, EXAM_ID);
  }

  // One attempt for the demo student (reuse if it exists).
  const existing = await db
    .select()
    .from(attempts)
    .where(and(eq(attempts.examId, EXAM_ID), eq(attempts.studentId, STUDENT_ID)))
    .limit(1);
  const attemptId =
    existing[0]?.id ??
    (await createAttempt(ctx, { examId: EXAM_ID, studentId: STUDENT_ID }))
      .attemptId;

  // A correct answer (auto-scored on sync).
  await syncAnswers(ctx, attemptId, [
    {
      questionId: "q_demo_1",
      optionIds: ["opt_1"],
      flaggedForReview: false,
      updatedAt: new Date().toISOString(),
    },
  ]);

  // Round-trip through the real services to prove the whole chain works.
  const dashboard = await listGroupsWithExams(ctx);
  const monitoring = await getMonitoring(ctx, EXAM_ID);
  const grading = await getGrading(ctx, EXAM_ID);
  const sitting = await getSitting(ctx, attemptId);

  console.log("✅ Seed complete.\n");
  console.log("Dashboard exams:", dashboard.groups[0]?.exams.length ?? 0);
  console.log(
    "Monitoring:",
    monitoring.students.length,
    "student(s), unlockQueue:",
    monitoring.unlockQueue.length,
  );
  console.log(
    "Grading Q1 responses:",
    grading.questions[0]?.responses.map((r) => ({
      student: r.studentId,
      answerId: r.answerId,
      auto: r.autoScore,
      awarded: r.awarded,
    })),
  );
  console.log(
    "Sitting: exam has",
    sitting.exam.sections.reduce((n, s) => n + s.blocks.length, 0),
    "blocks; presented order sections:",
    Object.keys(sitting.attempt.presentedOrder).length,
  );
  console.log(`\nLinked login UID: ${supabaseUid}`);
}

main()
  .then(() => process.exit(0))
  .catch((e: unknown) => {
    console.error("SEED ERROR:", e instanceof Error ? e.message : e);
    process.exit(1);
  });

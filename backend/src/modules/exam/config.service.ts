import { eq } from "drizzle-orm";
import { scopedDb } from "@/db/scoped";
import { exams } from "@/db/schema";
import { notFound } from "@/lib/errors";
import type { RequestContext } from "@/middleware/context";
import type { SecurityLevel } from "@/schema";
import type { ExamConfigInput } from "./exam.schema";

/**
 * Exam configuration (frontend §7 configuration screen). The authoritative
 * fields live in real exam columns — duration, pass mark, access, security
 * level, schedule; the UI-only extras (student-info fields, workspace answer
 * methods, per-level cheat-prevention sub-settings) live in the `config` jsonb.
 * This service reads/writes both sides so the frontend sees one whole object.
 */

type CheatPrevention = ExamConfigInput["cheatPrevention"];
type StudentInfo = ExamConfigInput["studentInfo"];
type Workspace = ExamConfigInput["workspace"];

/** The parts of the config that have no dedicated column, stashed in jsonb. */
type ConfigExtras = {
  studentInfo?: StudentInfo;
  workspace?: Workspace;
  cheatPrevention?: CheatPrevention;
};

const DEFAULT_STUDENT_INFO: StudentInfo = {
  fields: [
    { id: "student_id", label: "Student ID", collect: true, locked: true },
    { id: "full_name", label: "Full name", collect: true },
    { id: "email", label: "Email", collect: false },
    { id: "class", label: "Class / section", collect: false },
  ],
};

const DEFAULT_WORKSPACE: Workspace = {
  methods: [
    {
      id: "onscreen",
      label: "On-screen answers",
      description: "Students type or select answers directly in the exam.",
      enabled: true,
    },
    {
      id: "scratch",
      label: "Scratch pad",
      description: "A rough-work area that is not submitted.",
      enabled: true,
    },
    {
      id: "upload",
      label: "File upload",
      description: "Students attach a file for open-ended work.",
      enabled: false,
    },
  ],
};

/** Sub-settings for every level; the UI shows only those for the active level. */
function defaultCheatPrevention(level: SecurityLevel): CheatPrevention {
  return {
    level,
    low: { shuffleQuestions: true, shuffleOptions: true },
    medium: {
      requireFullscreen: true,
      warnOnTabSwitch: true,
      lockAfterSwitches: 2,
    },
    high: {
      requireFullscreen: true,
      blockCopyPaste: true,
      singleDevice: false,
      requireCamera: false,
    },
  };
}

export async function getExamConfig(
  ctx: RequestContext,
  id: string,
): Promise<ExamConfigInput> {
  const sdb = scopedDb(ctx.organizationId);
  const [exam] = await sdb.db
    .select()
    .from(exams)
    .where(sdb.where(exams, eq(exams.id, id)))
    .limit(1);
  if (!exam) throw notFound("Exam not found");

  const extras = (exam.config ?? {}) as ConfigExtras;
  const cheatPrevention = extras.cheatPrevention
    ? {
        ...extras.cheatPrevention,
        level: exam.security,
        high: {
          ...extras.cheatPrevention.high,
          singleDevice: false,
          requireCamera: false,
        },
      }
    : defaultCheatPrevention(exam.security);

  return {
    examId: exam.id,
    title: exam.title,
    general: {
      durationMinutes: exam.durationMinutes,
      passMarkPct: exam.passMarkPct,
      access: exam.access,
      scheduledStart: exam.scheduledStart?.toISOString(),
      scheduledEnd: exam.scheduledEnd?.toISOString(),
    },
    studentInfo: extras.studentInfo ?? DEFAULT_STUDENT_INFO,
    workspace: extras.workspace ?? DEFAULT_WORKSPACE,
    cheatPrevention,
  };
}

export async function saveExamConfig(
  ctx: RequestContext,
  id: string,
  input: ExamConfigInput,
): Promise<{ ok: true }> {
  const sdb = scopedDb(ctx.organizationId);
  const [exam] = await sdb.db
    .select()
    .from(exams)
    .where(sdb.where(exams, eq(exams.id, id)))
    .limit(1);
  if (!exam) throw notFound("Exam not found");

  // Unlike exam CONTENT (questions), configuration is operational and stays
  // editable after publishing — a teacher needs to open/close access, adjust the
  // schedule, etc. on a live exam. Existing in-progress attempts are unaffected
  // (they snapshot content at creation; access is re-checked live at entry).

  // Preserve any unrelated keys already in the jsonb, overlay the UI-only parts.
  const existingExtras = (exam.config ?? {}) as Record<string, unknown>;
  const config: Record<string, unknown> = {
    ...existingExtras,
    studentInfo: input.studentInfo,
    workspace: input.workspace,
    cheatPrevention: {
      ...input.cheatPrevention,
      high: {
        ...input.cheatPrevention.high,
        singleDevice: false,
        requireCamera: false,
      },
    },
  };

  await sdb.db
    .update(exams)
    .set({
      title: input.title,
      durationMinutes: input.general.durationMinutes,
      passMarkPct: input.general.passMarkPct,
      access: input.general.access,
      // The security level is authoritative in its own column.
      security: input.cheatPrevention.level,
      scheduledStart: input.general.scheduledStart
        ? new Date(input.general.scheduledStart)
        : null,
      scheduledEnd: input.general.scheduledEnd
        ? new Date(input.general.scheduledEnd)
        : null,
      config,
      updatedAt: new Date(),
    })
    .where(sdb.where(exams, eq(exams.id, id)));

  return { ok: true };
}

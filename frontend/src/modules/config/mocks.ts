import { examConfigSchema, type ExamConfig } from "./schema";

/** Fixture config while the backend is unbuilt. Validated through the schema. */
export const mockConfig: ExamConfig = examConfigSchema.parse({
  examId: "exm_001",
  title: "Algorithms — Midterm",
  general: {
    durationMinutes: 90,
    passMarkPct: 50,
    access: "scheduled",
    scheduledStart: "2026-08-01T09:00",
    scheduledEnd: "2026-08-01T12:00",
  },
  studentInfo: {
    fields: [
      { id: "student_id", label: "Student ID", collect: true, locked: true },
      { id: "full_name", label: "Full name", collect: true },
      { id: "email", label: "Email", collect: true },
      { id: "seat", label: "Seat number", collect: false },
      { id: "program", label: "Programme", collect: false },
    ],
  },
  workspace: {
    methods: [
      {
        id: "typed",
        label: "Typed text",
        description: "Students type answers into the browser.",
        enabled: true,
      },
      {
        id: "math",
        label: "Maths input",
        description: "Equation editor for mathematical answers.",
        enabled: true,
      },
      {
        id: "code",
        label: "Code editor",
        description: "Syntax-highlighted editor for programming answers.",
        enabled: true,
      },
      {
        id: "upload",
        label: "File upload",
        description: "Attach a scanned or prepared file.",
        enabled: false,
      },
    ],
  },
  cheatPrevention: {
    level: "medium",
    low: { shuffleQuestions: true, shuffleOptions: true },
    medium: {
      requireFullscreen: true,
      warnOnTabSwitch: true,
      lockAfterSwitches: 3,
    },
    high: {
      requireFullscreen: true,
      blockCopyPaste: true,
      singleDevice: false,
      requireCamera: false,
    },
  },
});

import { monitoringSchema, activitySchema, type Monitoring } from "./schema";

const m = 60_000;

export const mockMonitoring: Monitoring = monitoringSchema.parse({
  examId: "exm_001",
  examTitle: "Algorithms — Midterm",
  students: [
    { attemptId: "att_1", studentId: "S-2048", status: "in_progress", answered: 18, total: 32, timeLeftMs: 41 * m, flagCount: 0 },
    { attemptId: "att_2", studentId: "S-3011", status: "in_progress", answered: 9, total: 32, timeLeftMs: 44 * m, flagCount: 3 },
    { attemptId: "att_3", studentId: "S-1187", status: "locked", answered: 22, total: 32, timeLeftMs: 39 * m, flagCount: 1 },
    { attemptId: "att_4", studentId: "S-7723", status: "submitted", answered: 32, total: 32, timeLeftMs: 0, flagCount: 0 },
    { attemptId: "att_5", studentId: "S-9002", status: "disconnected", answered: 14, total: 32, timeLeftMs: 40 * m, flagCount: 2 },
    { attemptId: "att_6", studentId: "S-4415", status: "not_started", answered: 0, total: 32, timeLeftMs: 90 * m, flagCount: 0 },
  ],
  unlockQueue: [
    {
      attemptId: "att_3",
      studentId: "S-1187",
      reason: "Left the exam window",
      at: new Date(Date.now() - 2 * m).toISOString(),
      note: "My laptop switched to a call app.",
    },
  ],
});

export const mockActivities: Record<string, ReturnType<typeof activitySchema.parse>> = {
  att_2: activitySchema.parse({
    attemptId: "att_2",
    studentId: "S-3011",
    events: [
      { id: "e1", type: "blur", at: new Date(Date.now() - 12 * m).toISOString(), durationMs: 8000 },
      { id: "e2", type: "paste", at: new Date(Date.now() - 9 * m).toISOString(), charCount: 240 },
      { id: "e3", type: "fullscreen_exit", at: new Date(Date.now() - 4 * m).toISOString(), durationMs: 15000 },
    ],
  }),
  att_3: activitySchema.parse({
    attemptId: "att_3",
    studentId: "S-1187",
    events: [
      { id: "e4", type: "blur", at: new Date(Date.now() - 2 * m).toISOString(), durationMs: 30000 },
    ],
  }),
  att_5: activitySchema.parse({
    attemptId: "att_5",
    studentId: "S-9002",
    events: [
      { id: "e5", type: "disconnect", at: new Date(Date.now() - 6 * m).toISOString() },
      { id: "e6", type: "burst", at: new Date(Date.now() - 5 * m).toISOString(), charCount: 520 },
    ],
  }),
};

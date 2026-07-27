import { entryExamSchema, type EntryExam } from "./schema";

export const mockEntryExam: EntryExam = entryExamSchema.parse({
  examId: "exm_001",
  title: "Algorithms — Midterm",
  institution: "Riverside University",
  durationMinutes: 90,
  questionCount: 32,
  totalMarks: 22,
  security: "medium",
  fields: [
    { id: "full_name", label: "Full name", type: "text", required: true },
    { id: "email", label: "Email", type: "email", required: true },
    { id: "seat", label: "Seat number", type: "text", required: false },
  ],
});

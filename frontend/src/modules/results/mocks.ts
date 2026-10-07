import { examResultsSchema, type ExamResults } from "./schema";

export const mockResults: ExamResults = examResultsSchema.parse({
  examId: "exm_demo",
  title: "Algorithms — Midterm",
  subject: "Algorithms",
  totalStudents: 5,
  notSubmitted: 0,
  passMarkPct: 50,
  released: true,
  classes: [],
  subjects: ["Algorithms"],
  rows: [
    { studentRef: "KIT-2401-025", name: "Ravuth", classId: null, className: "Unassigned", marks: 89, outOf: 100, percentage: 89, rank: 1, status: "pass" },
    { studentRef: "KIT-2401-118", name: "Mengkhey", classId: null, className: "Unassigned", marks: 82, outOf: 100, percentage: 82, rank: 2, status: "pass" },
    { studentRef: "KIT-2401-093", name: "Sokhem", classId: null, className: "Unassigned", marks: 78, outOf: 100, percentage: 78, rank: 3, status: "pass" },
    { studentRef: "KIT-2401-004", name: "Sopheap", classId: null, className: "Unassigned", marks: 65, outOf: 100, percentage: 65, rank: 4, status: "pass" },
    { studentRef: "KIT-2401-017", name: "Piseth", classId: null, className: "Unassigned", marks: 42, outOf: 100, percentage: 42, rank: 5, status: "fail" },
  ],
});

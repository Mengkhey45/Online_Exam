import { attemptSchema, examSchema } from "@/modules/exam";
import { sittingSchema, type Sitting } from "./queries";

/**
 * A published exam plus a per-student attempt. The attempt's presentedOrder and
 * presentedOptions deliberately differ from canonical order so the runtime is
 * exercised against rule 3.1 (identity by ID, never position).
 */
const exam = examSchema.parse({
  id: "exm_001",
  versionId: "ver_1",
  title: "Algorithms — Midterm",
  status: "published",
  access: "scheduled",
  security: "medium",
  durationMinutes: 90,
  totalMarks: 22,
  sections: [
    {
      id: "sec_a",
      title: "Section A — Concepts",
      instructions: "Answer all questions.",
      mode: "blocks",
      shuffleQuestions: true,
      blocks: [
        {
          id: "q_bin",
          type: "mcq",
          stem: "The time complexity of binary search on a sorted array is:",
          marks: 1,
          required: true,
          shuffleOptions: true,
          options: [
            { id: "o_log", text: "$O(\\log n)$", isCorrect: true },
            { id: "o_n", text: "$O(n)$", isCorrect: false },
            { id: "o_nlogn", text: "$O(n \\log n)$", isCorrect: false },
            { id: "o_1", text: "$O(1)$", isCorrect: false },
          ],
        },
        {
          id: "q_stable",
          type: "multi_select",
          stem: "Which of these are stable sorting algorithms?",
          marks: 2,
          required: true,
          shuffleOptions: true,
          options: [
            { id: "o_merge", text: "Merge sort", isCorrect: true },
            { id: "o_ins", text: "Insertion sort", isCorrect: true },
            { id: "o_quick", text: "Quicksort", isCorrect: false },
            { id: "o_heap", text: "Heapsort", isCorrect: false },
          ],
        },
        {
          id: "q_hash",
          type: "fill_blank",
          stem: "A hash table offers average-case {{b1}} lookup time.",
          marks: 1,
          required: true,
          blanks: [
            {
              id: "b1",
              acceptedAnswers: ["O(1)", "constant"],
              caseSensitive: false,
              marks: 1,
            },
          ],
        },
      ],
    },
    {
      id: "sec_b",
      title: "Section B — Written",
      instructions: "",
      mode: "blocks",
      shuffleQuestions: false,
      blocks: [
        {
          id: "q_note",
          type: "content",
          stem: "The following questions are marked by hand. Show your working.",
          marks: 0,
          required: false,
        },
        {
          id: "q_dijkstra",
          type: "long_answer",
          stem: "Explain how Dijkstra’s algorithm finds shortest paths, and state its limitation with negative edge weights.",
          marks: 8,
          required: true,
          charLimit: 2000,
        },
        {
          id: "q_traverse",
          type: "code",
          stem: "Implement an iterative in-order traversal of a binary tree.",
          marks: 10,
          required: true,
          language: "python",
        },
      ],
    },
  ],
});

const attempt = attemptSchema.parse({
  id: "att_1",
  examVersionId: "ver_1",
  presentedOrder: {
    // Section A questions shuffled for this student.
    sec_a: ["q_hash", "q_bin", "q_stable"],
    sec_b: ["q_note", "q_dijkstra", "q_traverse"],
  },
  presentedOptions: {
    q_bin: ["o_n", "o_log", "o_1", "o_nlogn"],
    q_stable: ["o_quick", "o_merge", "o_heap", "o_ins"],
  },
  startedAt: new Date().toISOString(),
  // 47 minutes remaining, so the amber-under-10 threshold is reachable in demo.
  expiresAt: new Date(Date.now() + 47 * 60_000).toISOString(),
});

export const mockSitting: Sitting = sittingSchema.parse({ exam, attempt });

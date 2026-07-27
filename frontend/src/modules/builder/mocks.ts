import { examSchema, type Exam } from "@/modules/exam";

/**
 * Fixture exam for the builder while the backend is being built. Enabled with
 * NEXT_PUBLIC_USE_MOCKS=1. Validated through the real Exam schema so shapes stay
 * honest. Includes an unreviewed AI-imported block to exercise publish gating.
 */
const raw: Exam = {
  id: "exm_001",
  versionId: "ver_draft",
  title: "Algorithms — Midterm",
  status: "draft",
  access: "scheduled",
  security: "high",
  durationMinutes: 90,
  totalMarks: 0,
  sections: [
    {
      id: "sec_a",
      title: "Section A — Concepts",
      instructions: "",
      mode: "blocks",
      shuffleQuestions: true,
      blocks: [
        {
          id: "blk_1",
          type: "mcq",
          stem: "The time complexity of binary search on a sorted array is:",
          marks: 1,
          required: true,
          shuffleOptions: true,
          options: [
            { id: "opt_1", text: "$O(\\log n)$", isCorrect: true },
            { id: "opt_2", text: "$O(n)$", isCorrect: false },
            { id: "opt_3", text: "$O(n \\log n)$", isCorrect: false },
            { id: "opt_4", text: "$O(1)$", isCorrect: false },
          ],
        },
        {
          id: "blk_2",
          type: "multi_select",
          stem: "Which of these are stable sorting algorithms?",
          marks: 2,
          required: true,
          shuffleOptions: true,
          options: [
            { id: "opt_5", text: "Merge sort", isCorrect: true },
            { id: "opt_6", text: "Insertion sort", isCorrect: true },
            { id: "opt_7", text: "Quicksort", isCorrect: false },
            { id: "opt_8", text: "Heapsort", isCorrect: false },
          ],
        },
        {
          id: "blk_3",
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
          id: "blk_4",
          type: "long_answer",
          stem: "Explain how Dijkstra’s algorithm finds shortest paths, and state its limitation with negative edge weights.",
          marks: 8,
          required: true,
          charLimit: 2000,
        },
        {
          id: "blk_5",
          type: "code",
          stem: "Implement an iterative in-order traversal of a binary tree.",
          marks: 10,
          required: true,
          language: "python",
          // AI-imported and not yet reviewed → blocks publish (rule 3.6).
          reviewed: false,
          confidence: "medium",
        },
      ],
    },
  ],
};

export const mockExam = examSchema.parse(raw);

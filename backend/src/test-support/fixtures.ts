import type { Answer, Exam } from "@/schema";

/**
 * Test fixtures shared by the grading and attempt test suites. A small exam of
 * objective questions with known correct answers, all identified by ID.
 */
export function makeObjectiveExam(overrides?: Partial<Exam>): Exam {
  return {
    id: "exm_test",
    versionId: "ver_1",
    title: "Test exam",
    status: "published",
    access: "closed",
    security: "medium",
    durationMinutes: 60,
    totalMarks: 7,
    sections: [
      {
        id: "sec_a",
        title: "A",
        instructions: "",
        mode: "blocks",
        shuffleQuestions: true,
        blocks: [
          {
            id: "q_mcq",
            type: "mcq",
            stem: "Pick the right one",
            marks: 1,
            required: true,
            shuffleOptions: true,
            options: [
              { id: "o1", text: "correct", isCorrect: true },
              { id: "o2", text: "wrong", isCorrect: false },
              { id: "o3", text: "wrong", isCorrect: false },
              { id: "o4", text: "all of the above", isCorrect: false, keepLast: true },
            ],
          },
          {
            id: "q_multi",
            type: "multi_select",
            stem: "Pick all correct",
            marks: 4,
            required: true,
            shuffleOptions: true,
            options: [
              { id: "m1", text: "c", isCorrect: true },
              { id: "m2", text: "c", isCorrect: true },
              { id: "m3", text: "w", isCorrect: false },
              { id: "m4", text: "w", isCorrect: false },
            ],
          },
        ],
      },
      {
        id: "sec_b",
        title: "B",
        instructions: "",
        mode: "blocks",
        shuffleQuestions: false,
        blocks: [
          {
            id: "q_blank",
            type: "fill_blank",
            stem: "Average lookup is {{b1}}.",
            marks: 2,
            required: true,
            blanks: [
              {
                id: "b1",
                acceptedAnswers: ["O(1)", "constant"],
                caseSensitive: false,
                marks: 2,
              },
            ],
          },
        ],
      },
    ],
    ...overrides,
  };
}

/** All-correct answers for makeObjectiveExam, keyed by question ID. */
export function correctAnswers(): Map<string, Answer> {
  const now = new Date().toISOString();
  return new Map<string, Answer>([
    ["q_mcq", { questionId: "q_mcq", optionIds: ["o1"], flaggedForReview: false, updatedAt: now }],
    ["q_multi", { questionId: "q_multi", optionIds: ["m1", "m2"], flaggedForReview: false, updatedAt: now }],
    ["q_blank", { questionId: "q_blank", blankAnswers: { b1: "O(1)" }, flaggedForReview: false, updatedAt: now }],
  ]);
}

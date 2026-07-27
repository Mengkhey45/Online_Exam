import { bankQuestionSchema, type BankQuestion } from "./schema";

const raw: BankQuestion[] = [
  {
    id: "bq_1",
    text: "A simple graph with 7 vertices has at most how many edges?",
    type: "mcq",
    subject: "Discrete Mathematics",
    difficulty: "easy",
    marks: 2,
    usedCount: 3,
  },
  {
    id: "bq_2",
    text: "Explain the time complexity of merge sort and why it is $O(n \\log n)$.",
    type: "long_answer",
    subject: "Data Structures",
    difficulty: "medium",
    marks: 5,
    usedCount: 1,
  },
  {
    id: "bq_3",
    text: "Which of these are stable sorting algorithms?",
    type: "multi_select",
    subject: "Algorithms",
    difficulty: "medium",
    marks: 2,
    usedCount: 4,
  },
  {
    id: "bq_4",
    text: "A hash table offers average-case {{b1}} lookup time.",
    type: "fill_blank",
    subject: "Data Structures",
    difficulty: "easy",
    marks: 1,
    usedCount: 6,
  },
  {
    id: "bq_5",
    text: "Implement an iterative in-order traversal of a binary tree.",
    type: "code",
    subject: "Algorithms",
    difficulty: "hard",
    marks: 10,
    usedCount: 0,
  },
];

export const mockBankQuestions = raw.map((q) => bankQuestionSchema.parse(q));

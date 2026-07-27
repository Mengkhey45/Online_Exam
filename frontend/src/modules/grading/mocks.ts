import { gradingSchema, type Grading } from "./schema";

export const mockGrading: Grading = gradingSchema.parse({
  examId: "exm_001",
  title: "Algorithms — Midterm",
  released: false,
  questions: [
    {
      id: "q_bin",
      number: 1,
      type: "mcq",
      stem: "The time complexity of binary search on a sorted array is:",
      maxMarks: 1,
      autoScored: true,
      rubric: [],
      responses: [
        { answerId: null, attemptId: "att_1", studentId: "S-2048", answerText: "$O(\\log n)$", autoScore: 1, awarded: 1, comment: "" },
        { answerId: null, attemptId: "att_2", studentId: "S-3011", answerText: "$O(n)$", autoScore: 0, awarded: 0, comment: "" },
        { answerId: null, attemptId: "att_4", studentId: "S-7723", answerText: "$O(\\log n)$", autoScore: 1, awarded: 1, comment: "" },
      ],
    },
    {
      id: "q_dijkstra",
      number: 2,
      type: "long_answer",
      stem: "Explain how Dijkstra’s algorithm finds shortest paths, and state its limitation with negative edge weights.",
      maxMarks: 8,
      autoScored: false,
      rubric: [
        "Greedy selection of the nearest unvisited node (2)",
        "Relaxation of neighbour distances (3)",
        "Correct statement of the negative-weight limitation (3)",
      ],
      responses: [
        {
          attemptId: "att_1",
          studentId: "S-2048",
          answerText:
            "Dijkstra keeps a set of finalised nodes and repeatedly picks the unvisited node with the smallest tentative distance, relaxing its neighbours. It fails with negative edges because a finalised node may later be reachable more cheaply.",
          autoScore: null,
          awarded: null,
          comment: "",
        },
        {
          attemptId: "att_2",
          studentId: "S-3011",
          answerText:
            "It uses a priority queue to always expand the closest node and updates neighbour distances. Doesn't work with negative weights.",
          autoScore: null,
          awarded: null,
          comment: "",
        },
        {
          attemptId: "att_4",
          studentId: "S-7723",
          answerText: "It finds shortest paths using a greedy approach.",
          autoScore: null,
          awarded: null,
          comment: "",
        },
      ],
    },
  ],
});

import { conversionSchema, type Conversion } from "./schema";

export const mockConversion: Conversion = conversionSchema.parse({
  examId: "exm_001",
  title: "Algorithms — Midterm (imported)",
  pages: [
    {
      id: "p1",
      label: "Page 1",
      lines: [
        "1. The time complexity of binary search on a sorted",
        "   array of n elements is O(log n).",
        "",
        "2. A hash table offers average-case O(1) lookup time,",
        "   degrading to O(n) with many collisions.",
      ],
    },
    {
      id: "p2",
      label: "Page 2",
      lines: [
        "3. Compute the number of comparisons merge sort makes",
        "   on 8 elements in the worst case: 17.",
        "",
        "4. Explain the difference between BFS and DFS traversal.",
      ],
    },
  ],
  blocks: [
    {
      id: "b1",
      pageId: "p1",
      number: 1,
      type: "mcq",
      stem: "The time complexity of binary search on a sorted array is:",
      confidence: "high",
      reviewed: false,
      options: [
        { id: "o1", text: "$O(\\log n)$", isCorrect: true },
        { id: "o2", text: "$O(n)$", isCorrect: false },
        { id: "o3", text: "$O(n \\log n)$", isCorrect: false },
      ],
    },
    {
      id: "b2",
      pageId: "p1",
      number: 2,
      type: "fill_blank",
      stem: "A hash table offers average-case {{b}} lookup time.",
      confidence: "medium",
      reviewed: false,
    },
    {
      id: "b3",
      pageId: "p2",
      number: 3,
      type: "short_answer",
      stem: "Compute the number of comparisons merge sort makes on 8 elements in the worst case.",
      confidence: "low",
      reviewed: false,
      // The source says 17, the conversion produced 15 — flagged prominently.
      numericMismatch: { source: ["8", "17"], converted: ["8", "15"] },
    },
    {
      id: "b4",
      pageId: "p2",
      number: 4,
      type: "long_answer",
      stem: "Explain the difference between BFS and DFS traversal.",
      confidence: "high",
      reviewed: false,
    },
  ],
});

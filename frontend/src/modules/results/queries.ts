import { useQuery } from "@tanstack/react-query";
import type { ExamResults } from "./schema";

/**
 * Released results. No backend endpoint yet, so this resolves fixtures. When a
 * results API lands, swap for api.get(`/exams/${examId}/results`, …).
 */
async function fetchResults(): Promise<ExamResults> {
  const { mockResults } = await import("./mocks");
  await new Promise((r) => setTimeout(r, 250));
  return mockResults;
}

export function useExamResults(examId: string) {
  return useQuery({
    queryKey: ["results", examId],
    queryFn: fetchResults,
  });
}

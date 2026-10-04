import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { examResultsSchema } from "./schema";
import type { ExamResults } from "./schema";

async function fetchResults(
  examId: string,
  filters: { classId?: string; subject?: string },
  signal?: AbortSignal,
): Promise<ExamResults> {
  const params = new URLSearchParams();
  if (filters.classId) params.set("classId", filters.classId);
  if (filters.subject) params.set("subject", filters.subject);
  const query = params.toString();
  return api.get(
    `/exams/${examId}/results${query ? `?${query}` : ""}`,
    examResultsSchema,
    signal,
  );
}

export function useExamResults(
  examId: string,
  filters: { classId?: string; subject?: string } = {},
) {
  return useQuery({
    queryKey: ["results", examId, filters],
    queryFn: ({ signal }) => fetchResults(examId, filters, signal),
  });
}

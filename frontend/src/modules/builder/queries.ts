import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api/client";
import { examSchema, examKeys, type Exam, type Section } from "@/modules/exam";

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "1";

async function fetchExam(examId: string, signal?: AbortSignal): Promise<Exam> {
  if (USE_MOCKS) {
    const { mockExam } = await import("./mocks");
    await new Promise((r) => setTimeout(r, 300));
    return mockExam;
  }
  return api.get(`/exams/${examId}`, examSchema, signal);
}

export function useExam(examId: string) {
  return useQuery({
    queryKey: examKeys.detail(examId),
    queryFn: ({ signal }) => fetchExam(examId, signal),
  });
}

/**
 * Persist the draft: title + the full sections/blocks array (AGENTS §6). The
 * backend replaces the exam's draft content wholesale, so we always send the
 * complete set — this is what makes the builder survive a refresh.
 */
export function useSaveExam(examId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title: string; sections: Section[] }) => {
      if (USE_MOCKS) {
        await new Promise((r) => setTimeout(r, 300));
        return;
      }
      await api.patch(`/exams/${examId}`, input, examSchema);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: examKeys.detail(examId) });
      queryClient.invalidateQueries({ queryKey: examKeys.dashboard() });
    },
  });
}

/**
 * Publish the exam (AGENTS §6). The backend gates this — it returns 409 if any
 * AI-imported block is still unreviewed (rule 3.6) — so surface that message.
 */
export function usePublishExam(examId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (USE_MOCKS) {
        await new Promise((r) => setTimeout(r, 300));
        return;
      }
      await api.post(`/exams/${examId}/publish`, {}, z.unknown());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: examKeys.detail(examId) });
      queryClient.invalidateQueries({ queryKey: examKeys.dashboard() });
    },
  });
}

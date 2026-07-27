import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api/client";
import { examConfigSchema, type ExamConfig } from "./schema";

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "1";

export const configKeys = {
  detail: (examId: string) => ["exam-config", examId] as const,
};

async function fetchConfig(
  examId: string,
  signal?: AbortSignal,
): Promise<ExamConfig> {
  if (USE_MOCKS) {
    const { mockConfig } = await import("./mocks");
    await new Promise((r) => setTimeout(r, 300));
    return mockConfig;
  }
  return api.get(`/exams/${examId}/config`, examConfigSchema, signal);
}

export function useExamConfig(examId: string) {
  return useQuery({
    queryKey: configKeys.detail(examId),
    queryFn: ({ signal }) => fetchConfig(examId, signal),
  });
}

const saveAckSchema = z.object({ ok: z.boolean() });

export function useSaveConfig(examId: string) {
  return useMutation({
    mutationFn: async (config: ExamConfig) => {
      if (USE_MOCKS) {
        await new Promise((r) => setTimeout(r, 400));
        return { ok: true };
      }
      return api.patch(`/exams/${examId}/config`, config, saveAckSchema);
    },
  });
}

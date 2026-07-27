import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api/client";
import { gradingSchema, type Grading } from "./schema";

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "1";

export const gradingKeys = {
  detail: (examId: string) => ["grading", examId] as const,
};

async function fetchGrading(
  examId: string,
  signal?: AbortSignal,
): Promise<Grading> {
  if (USE_MOCKS) {
    const { mockGrading } = await import("./mocks");
    await new Promise((r) => setTimeout(r, 300));
    return mockGrading;
  }
  return api.get(`/exams/${examId}/grading`, gradingSchema, signal);
}

export function useGrading(examId: string) {
  return useQuery({
    queryKey: gradingKeys.detail(examId),
    queryFn: ({ signal }) => fetchGrading(examId, signal),
  });
}

const ackSchema = z.object({ ok: z.boolean() });

/** Persist one awarded mark + comment. The server is authoritative (§9). */
export function useSaveMark() {
  return useMutation({
    mutationFn: async (input: {
      answerId: string;
      awarded: number | null;
      comment: string;
    }) => {
      if (USE_MOCKS) {
        await new Promise((r) => setTimeout(r, 150));
        return { ok: true };
      }
      // Scored by answer id: PUT /answers/:id/score.
      return api.put(
        `/answers/${input.answerId}/score`,
        { awarded: input.awarded, comment: input.comment },
        ackSchema,
      );
    },
  });
}

export function useReleaseResults(examId: string) {
  return useMutation({
    mutationFn: async () => {
      if (USE_MOCKS) {
        await new Promise((r) => setTimeout(r, 400));
        return { ok: true };
      }
      return api.post(`/exams/${examId}/release-results`, {}, ackSchema);
    },
  });
}

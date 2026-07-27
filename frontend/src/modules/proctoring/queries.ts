import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api/client";
import {
  activitySchema,
  monitoringSchema,
  type Activity,
  type Monitoring,
} from "./schema";

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "1";

export const monitoringKeys = {
  board: (examId: string) => ["monitoring", examId] as const,
  activity: (attemptId: string) => ["activity", attemptId] as const,
};

async function fetchMonitoring(
  examId: string,
  signal?: AbortSignal,
): Promise<Monitoring> {
  if (USE_MOCKS) {
    const { mockMonitoring } = await import("./mocks");
    await new Promise((r) => setTimeout(r, 300));
    return mockMonitoring;
  }
  // Backend route is /exams/:id/attempts (the monitoring feed).
  return api.get(`/exams/${examId}/attempts`, monitoringSchema, signal);
}

export function useMonitoring(examId: string) {
  return useQuery({
    queryKey: monitoringKeys.board(examId),
    queryFn: ({ signal }) => fetchMonitoring(examId, signal),
    // Live board — refresh periodically.
    refetchInterval: 15_000,
  });
}

async function fetchActivity(attemptId: string): Promise<Activity> {
  if (USE_MOCKS) {
    const { mockActivities } = await import("./mocks");
    await new Promise((r) => setTimeout(r, 200));
    return (
      mockActivities[attemptId] ?? {
        attemptId,
        studentId: attemptId,
        events: [],
      }
    );
  }
  return api.get(`/attempts/${attemptId}/activity`, activitySchema);
}

export function useActivity(attemptId: string | null) {
  return useQuery({
    queryKey: monitoringKeys.activity(attemptId ?? "none"),
    queryFn: () => fetchActivity(attemptId!),
    enabled: Boolean(attemptId),
  });
}

const unlockAckSchema = z.object({ ok: z.boolean() });

export function useUnlockAttempt(examId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (attemptId: string) => {
      if (USE_MOCKS) {
        await new Promise((r) => setTimeout(r, 300));
        return { ok: true };
      }
      return api.post(`/attempts/${attemptId}/unlock`, {}, unlockAckSchema);
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: monitoringKeys.board(examId) }),
  });
}

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
    // CHANGED: 15_000=>4_000
    refetchInterval: 4_000,
    // ADDED: Keeps fetching data even if the teacher has another tab open
    refetchIntervalInBackground: true,
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


const incidentAckSchema = z.object({ id: z.string() });

export function useRecordIncident(attemptId: string | null) {
  const qc = useQueryClient();

  return useMutation({
    // accepts an optional note string. if undefined, defaults to a standard message
    mutationFn: async (note: string) => {
      if (!attemptId) throw new Error("No attempt ID provided");

      if (USE_MOCKS) {
        await new Promise((r) => setTimeout(r, 300));
        return { id: "mock-inc-123"};
      }

      // POSTs to the proctoringRouter endpoint
      return api.post(
        `/attempts/${attemptId}/incident`,
        { note: note || "Flagged by teacher during live monitoring" },
        incidentAckSchema
      );
    },
    onSuccess: () => {
      // refresh the timeline to show the new incident if it's rendered there
      if (attemptId) {
        qc.invalidateQueries({ queryKey: monitoringKeys.activity(attemptId) });
      }
    },
  });
}
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api/client";
import { getAttemptToken } from "@/lib/auth/attempt-session";
import {
  attemptSchema,
  examSchema,
  type Answer,
  type ProctoringEvent,
} from "@/modules/exam";

/**
 * The whole sitting loads in ONE request (AGENTS §3.3). After this, every
 * question navigation is local — there are no per-question fetches during an
 * exam, because students may be on unreliable connections.
 */
export const sittingSchema = z.object({
  exam: examSchema,
  attempt: attemptSchema,
});
export type Sitting = z.infer<typeof sittingSchema>;

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "1";

async function fetchSitting(
  attemptId: string,
  signal?: AbortSignal,
): Promise<Sitting> {
  if (USE_MOCKS) {
    const { mockSitting } = await import("./mocks");
    await new Promise((r) => setTimeout(r, 300));
    return mockSitting;
  }
  // Use the attempt token explicitly — this route is authorised by it, not by
  // the teacher's Supabase session the AuthProvider keeps globally (AGENTS §7).
  const token = getAttemptToken(attemptId) ?? undefined;
  return api.get(`/attempts/${attemptId}`, sittingSchema, signal, token);
}

export function useSitting(attemptId: string) {
  return useQuery({
    queryKey: ["sitting", attemptId],
    queryFn: ({ signal }) => fetchSitting(attemptId, signal),
    // The payload is fetched once and owned locally thereafter.
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 3,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

const syncAckSchema = z.object({ accepted: z.array(z.string()) });

/**
 * Push queued answers to the server. Returns the IDs the server accepted so the
 * queue can mark them synced. Throws on failure so the caller can back off.
 */
export async function syncAnswers(
  attemptId: string,
  answers: Answer[],
): Promise<string[]> {
  if (answers.length === 0) return [];
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 250));
    return answers.map((a) => a.questionId);
  }
  const token = getAttemptToken(attemptId) ?? undefined;
  const res = await api.put(
    `/attempts/${attemptId}/answers`,
    { answers },
    syncAckSchema,
    token,
  );
  return res.accepted;
}

const eventsAckSchema = z.object({ stored: z.number() });

/**
 * Send batched proctoring telemetry (AGENTS §7). Fire-and-forget from the
 * client's view — the server stores it as evidence; it never changes a score or
 * blocks the student (rule 3.4). Throws on failure so the caller can re-queue.
 */
export async function postProctoringEvents(
  attemptId: string,
  events: ProctoringEvent[],
): Promise<void> {
  if (events.length === 0) return;
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 150));
    return;
  }
  const token = getAttemptToken(attemptId) ?? undefined;
  await api.post(
    `/attempts/${attemptId}/events`,
    { events },
    eventsAckSchema,
    token,
  );
}

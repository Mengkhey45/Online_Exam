import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { getAttemptToken } from "@/lib/auth/attempt-session";
import {
  answerSchema,
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
  /** Answers already saved on the server (restores work on another device). */
  answers: z.array(answerSchema).default([]),
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
  const token = getRequiredAttemptToken(attemptId);
  return api.get(`/attempts/${attemptId}`, sittingSchema, signal, token);
}

function getRequiredAttemptToken(attemptId: string): string {
  const token = getAttemptToken(attemptId);
  if (!token) {
    throw new ApiError({
      status: 401,
      code: "attempt_token_missing",
      message: "This exam session is no longer available. Start the exam again.",
    });
  }
  return token;
}

export function useSitting(attemptId: string) {
  return useQuery({
    queryKey: ["sitting", attemptId],
    queryFn: ({ signal }) => fetchSitting(attemptId, signal),
    // The payload is fetched ONCE and owned locally thereafter (rule 3.3).
    // Lock / unlock / time-up changes come from the lightweight status poll
    // below, so a network blip can never replace the exam with an error.
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 3,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

const attemptStatusSchema = z.object({
  status: attemptSchema.shape.status,
  expiresAt: z.string(),
  lockReason: z.string().nullable(),
});
export type AttemptStatus = z.infer<typeof attemptStatusSchema>;

const STATUS_POLL_MS = 5_000;

/**
 * Small status poll (lock, unlock by the teacher, time up). Failures are
 * ignored — the last known status stays in effect and the exam keeps working.
 */
export function useAttemptStatus(attemptId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["sitting-status", attemptId],
    queryFn: ({ signal }) => {
      if (USE_MOCKS) return null;
      const token = getRequiredAttemptToken(attemptId);
      return api.get(`/attempts/${attemptId}/status`, attemptStatusSchema, signal, token);
    },
    enabled,
    refetchInterval: STATUS_POLL_MS,
    refetchIntervalInBackground: true,
    retry: false,
    refetchOnWindowFocus: true,
  });
}

const syncAckSchema = z.object({ accepted: z.array(z.string()) });
const lockAckSchema = z.object({ ok: z.boolean() });

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
  const token = getRequiredAttemptToken(attemptId);
  const res = await api.put(
    `/attempts/${attemptId}/answers`,
    { answers },
    syncAckSchema,
    token,
  );
  return res.accepted;
}

/**
 * Attach the student's optional explanation to a pause that is waiting for the
 * teacher. Shown in the teacher's unlock queue.
 */
export async function sendLockNote(attemptId: string, note: string): Promise<void> {
  if (USE_MOCKS || !note.trim()) return;
  const token = getRequiredAttemptToken(attemptId);
  await api.post(`/attempts/${attemptId}/lock-note`, { note }, lockAckSchema, token);
}

const eventsAckSchema = z.object({ stored: z.number() });

export async function lockAttempt(attemptId: string, reason: string): Promise<void> {
  if (USE_MOCKS) return;
  const token = getRequiredAttemptToken(attemptId);
  await api.post(`/attempts/${attemptId}/lock`, { reason }, lockAckSchema, token);
}

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
  const token = getRequiredAttemptToken(attemptId);
  await api.post(
    `/attempts/${attemptId}/events`,
    { events },
    eventsAckSchema,
    token,
  );
}


const submitAckSchema = z.object({ ok: z.boolean() });

/** Submit the attempt. Idempotent on the server — safe to retry. */
export async function submitAttempt(attemptId: string): Promise<void> {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 300));
    return;
  }
  const token = getRequiredAttemptToken(attemptId);
  await api.post(`/attempts/${attemptId}/submit`, {}, submitAckSchema, token);
}
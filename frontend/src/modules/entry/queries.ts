import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { storeAttemptToken } from "@/lib/auth/attempt-session";
import {
  entryExamSchema,
  startedAttemptSchema,
  type EntryExam,
} from "./schema";

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "1";

async function lookupByKey(key: string): Promise<EntryExam> {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 400));
    const normalized = key.trim().toUpperCase();
    if (normalized !== "ALGO-7F3K") {
      throw new ApiError({
        status: 404,
        code: "not_found",
        message: "No exam matches that key. Check it and try again.",
      });
    }
    const { mockEntryExam } = await import("./mocks");
    return mockEntryExam;
  }
  return api.get(`/entry/${encodeURIComponent(key)}`, entryExamSchema);
}

export function useLookupExam() {
  return useMutation({ mutationFn: lookupByKey });
}

async function startAttempt(input: {
  examId: string;
  details: Record<string, string>;
}): Promise<string> {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 500));
    return "att_1";
  }
  const res = await api.post(
    `/exams/${input.examId}/attempts`,
    { details: input.details },
    startedAttemptSchema,
  );
  // Persist the sitting token so /sit/[attemptId] can authorise its requests.
  if (res.attemptToken) storeAttemptToken(res.attemptId, res.attemptToken);
  return res.attemptId;
}

export function useStartAttempt() {
  return useMutation({ mutationFn: startAttempt });
}

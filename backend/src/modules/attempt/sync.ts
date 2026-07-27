import type { Answer } from "@/schema";

/**
 * Merge a batch of answers synced from the client's offline queue (AGENTS §7).
 * The batch may arrive out of order and contain duplicates. Resolution is
 * last-write-wins per question by `updatedAt`, and the operation is idempotent:
 * applying the same batch twice changes nothing the second time.
 */
export type MergeResult = {
  merged: Map<string, Answer>; // full answer state by questionId
  toWrite: Answer[]; // answers that actually changed and should be persisted
};

function newer(a: Answer, b: Answer): boolean {
  // Strictly greater so equal timestamps are a no-op (idempotency, stable ties).
  return Date.parse(a.updatedAt) > Date.parse(b.updatedAt);
}

export function mergeAnswers(
  existing: Map<string, Answer>,
  incoming: readonly Answer[],
): MergeResult {
  const merged = new Map(existing);
  const changed = new Map<string, Answer>();

  for (const answer of incoming) {
    const current = merged.get(answer.questionId);
    if (!current || newer(answer, current)) {
      merged.set(answer.questionId, answer);
      changed.set(answer.questionId, answer);
    }
  }

  return { merged, toWrite: [...changed.values()] };
}

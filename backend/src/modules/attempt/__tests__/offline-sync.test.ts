import { describe, expect, it } from "vitest";
import type { Answer } from "@/schema";
import { mergeAnswers } from "@/modules/attempt/sync";

/**
 * AGENTS §7: PUT /answers is idempotent and accepts out-of-order arrivals — the
 * client is syncing an offline queue. Resolution is last-write-wins per question
 * by updatedAt.
 */
function answer(questionId: string, text: string, at: string): Answer {
  return { questionId, text, flaggedForReview: false, updatedAt: at };
}

const t0 = "2026-07-01T10:00:00.000Z";
const t1 = "2026-07-01T10:00:05.000Z";
const t2 = "2026-07-01T10:00:10.000Z";

describe("offline sync merge", () => {
  it("keeps the newest write when a batch arrives out of order", () => {
    const existing = new Map<string, Answer>();
    // Newer arrives before older within the same batch.
    const { merged } = mergeAnswers(existing, [
      answer("q1", "new", t2),
      answer("q1", "old", t1),
    ]);
    expect(merged.get("q1")?.text).toBe("new");
  });

  it("does not overwrite a newer stored answer with an older arrival", () => {
    const existing = new Map<string, Answer>([["q1", answer("q1", "new", t2)]]);
    const { merged, toWrite } = mergeAnswers(existing, [answer("q1", "stale", t1)]);
    expect(merged.get("q1")?.text).toBe("new");
    expect(toWrite).toHaveLength(0);
  });

  it("is idempotent — applying the same batch twice writes nothing the second time", () => {
    const existing = new Map<string, Answer>([["q1", answer("q1", "a", t0)]]);
    const batch = [answer("q1", "b", t1)];

    const first = mergeAnswers(existing, batch);
    expect(first.toWrite).toHaveLength(1);

    const second = mergeAnswers(first.merged, batch);
    expect(second.toWrite).toHaveLength(0);
    expect(second.merged.get("q1")?.text).toBe("b");
  });

  it("merges independent questions and reports only what changed", () => {
    const existing = new Map<string, Answer>([["q1", answer("q1", "a", t1)]]);
    const { toWrite } = mergeAnswers(existing, [
      answer("q1", "a-newer", t2),
      answer("q2", "fresh", t1),
    ]);
    const ids = toWrite.map((a) => a.questionId).sort();
    expect(ids).toEqual(["q1", "q2"]);
  });
});

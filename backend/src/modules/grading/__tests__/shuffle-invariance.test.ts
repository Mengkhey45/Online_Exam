import { describe, expect, it } from "vitest";
import type { Exam } from "@/schema";
import { autoScoreExam } from "@/modules/grading/scoring";
import { buildPresentedLayout, type Rng } from "@/modules/attempt/present";
import { correctAnswers, makeObjectiveExam } from "@/test-support/fixtures";

/**
 * AGENTS §3.2 / §7: a shuffled attempt grades identically to an unshuffled one.
 * Grading is by ID and reads canonical order, so presentation must not matter.
 * This test must never be skipped or weakened.
 */
describe("shuffle invariance", () => {
  const reverseRng: Rng = (() => {
    // Deterministic RNG that reliably reorders (returns 0.99 then 0.0 …).
    let i = 0;
    const seq = [0.99, 0.01, 0.5, 0.2, 0.8, 0.33];
    return () => seq[i++ % seq.length]!;
  })();

  it("grades all-correct answers to full marks regardless of presented order", () => {
    const exam = makeObjectiveExam();
    const answers = correctAnswers();

    // Presentation is shuffled, but grading ignores it entirely.
    const layout = buildPresentedLayout(exam, reverseRng);
    expect(layout.presentedOrder.sec_a).toHaveLength(2);

    const { total } = autoScoreExam(exam, answers);
    expect(total).toBe(7); // 1 + 4 + 2
  });

  it("is invariant to the exam's own section/block ordering", () => {
    const exam = makeObjectiveExam();
    const answers = correctAnswers();
    const canonical = autoScoreExam(exam, answers).total;

    // Reorder sections and blocks — the total must be unchanged.
    const reordered: Exam = {
      ...exam,
      sections: [...exam.sections].reverse().map((s) => ({
        ...s,
        blocks: [...s.blocks].reverse(),
      })),
    };
    expect(autoScoreExam(reordered, answers).total).toBe(canonical);
  });

  it("scores by option ID, so shuffled options do not change the result", () => {
    const exam = makeObjectiveExam();
    const answers = correctAnswers();
    const layout = buildPresentedLayout(exam, reverseRng);

    // The presented option order differs from canonical, but the answer
    // references option IDs, so the score is the same.
    expect(layout.presentedOptions.q_mcq).toContain("o1");
    expect(autoScoreExam(exam, answers).total).toBe(7);
  });
});

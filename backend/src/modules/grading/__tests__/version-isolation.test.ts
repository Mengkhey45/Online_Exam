import { describe, expect, it } from "vitest";
import type { Answer, Exam } from "@/schema";
import { autoScoreExam } from "@/modules/grading/scoring";
import { makeObjectiveExam } from "@/test-support/fixtures";

/**
 * AGENTS §3.4 / §7: publishing an edit creates a NEW version; attempts already
 * in progress keep the version they started on. Grading against the version's
 * snapshot must isolate an in-progress attempt from a later republish.
 */
describe("version isolation", () => {
  const now = new Date().toISOString();

  // An answer that selected option o1 on the MCQ.
  const answers = new Map<string, Answer>([
    ["q_mcq", { questionId: "q_mcq", optionIds: ["o1"], flaggedForReview: false, updatedAt: now }],
  ]);

  it("grades an in-progress attempt against its own version, not a republish", () => {
    // v1: o1 is correct.
    const v1 = makeObjectiveExam({ versionId: "ver_1" });

    // v2: a republish where the correct MCQ option changed to o2.
    const v2: Exam = {
      ...makeObjectiveExam({ versionId: "ver_2" }),
    };
    const mcq = v2.sections[0]!.blocks[0]!;
    mcq.options = mcq.options!.map((o) => ({ ...o, isCorrect: o.id === "o2" }));

    // The attempt bound to v1 still earns the mark; the same answer on v2 does not.
    expect(autoScoreExam(v1, answers).perQuestion.q_mcq).toBe(1);
    expect(autoScoreExam(v2, answers).perQuestion.q_mcq ?? 0).toBe(0);
  });
});

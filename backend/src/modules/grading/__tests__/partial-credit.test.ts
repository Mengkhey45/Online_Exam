import { describe, expect, it } from "vitest";
import type { Block } from "@/schema";
import { scoreMultiSelect } from "@/modules/grading/scoring";

const question: Block = {
  id: "q",
  type: "multi_select",
  stem: "",
  marks: 4,
  required: true,
  options: [
    { id: "m1", text: "", isCorrect: true },
    { id: "m2", text: "", isCorrect: true },
    { id: "m3", text: "", isCorrect: false },
    { id: "m4", text: "", isCorrect: false },
  ],
};

describe("multi-select partial credit", () => {
  it("awards full marks for exactly the correct set", () => {
    expect(scoreMultiSelect(question, ["m1", "m2"])).toBe(4);
  });

  it("awards partial marks for a correct subset", () => {
    // 1 correct of 2, no wrong → 0.5 * 4
    expect(scoreMultiSelect(question, ["m1"])).toBe(2);
  });

  it("penalises wrong selections", () => {
    // (2 correct − 1 wrong) / 2 = 0.5 → 2
    expect(scoreMultiSelect(question, ["m1", "m2", "m3"])).toBe(2);
  });

  it("never goes negative — selecting everything nets zero", () => {
    expect(scoreMultiSelect(question, ["m1", "m2", "m3", "m4"])).toBe(0);
  });

  it("scores an empty selection as zero", () => {
    expect(scoreMultiSelect(question, [])).toBe(0);
  });

  it("scores selecting only wrong options as zero, not negative", () => {
    expect(scoreMultiSelect(question, ["m3", "m4"])).toBe(0);
  });
});

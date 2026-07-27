import { describe, expect, it } from "vitest";
import type { Block } from "@/schema";
import { scoreFillBlank } from "@/modules/grading/scoring";

function blankQuestion(overrides?: Partial<Block["blanks"]>): Block {
  return {
    id: "q",
    type: "fill_blank",
    stem: "{{b1}}",
    marks: 2,
    required: true,
    blanks: [
      {
        id: "b1",
        acceptedAnswers: ["O(1)", "constant"],
        caseSensitive: false,
        marks: 2,
      },
    ],
    ...(overrides ? {} : {}),
  };
}

describe("fill-blank matching", () => {
  it("matches an exact accepted answer", () => {
    expect(scoreFillBlank(blankQuestion(), { b1: "O(1)" })).toBe(2);
  });

  it("is case-insensitive when caseSensitive is false", () => {
    expect(scoreFillBlank(blankQuestion(), { b1: "constant" })).toBe(2);
    expect(scoreFillBlank(blankQuestion(), { b1: "CONSTANT" })).toBe(2);
  });

  it("tolerates surrounding and internal whitespace", () => {
    expect(scoreFillBlank(blankQuestion(), { b1: "  O(1)  " })).toBe(2);
  });

  it("respects case sensitivity when required", () => {
    const q: Block = {
      id: "q",
      type: "fill_blank",
      stem: "{{b1}}",
      marks: 1,
      required: true,
      blanks: [
        { id: "b1", acceptedAnswers: ["Dijkstra"], caseSensitive: true, marks: 1 },
      ],
    };
    expect(scoreFillBlank(q, { b1: "Dijkstra" })).toBe(1);
    expect(scoreFillBlank(q, { b1: "dijkstra" })).toBe(0);
  });

  it("applies numeric tolerance", () => {
    const q: Block = {
      id: "q",
      type: "fill_blank",
      stem: "{{b1}}",
      marks: 3,
      required: true,
      blanks: [
        {
          id: "b1",
          acceptedAnswers: ["9.81"],
          caseSensitive: false,
          numericTolerance: 0.05,
          marks: 3,
        },
      ],
    };
    expect(scoreFillBlank(q, { b1: "9.80" })).toBe(3); // within 0.05
    expect(scoreFillBlank(q, { b1: "9.70" })).toBe(0); // outside 0.05
  });

  it("scores an empty answer as zero", () => {
    expect(scoreFillBlank(blankQuestion(), { b1: "" })).toBe(0);
    expect(scoreFillBlank(blankQuestion(), {})).toBe(0);
  });
});

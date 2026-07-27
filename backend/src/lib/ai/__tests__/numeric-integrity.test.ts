import { describe, expect, it } from "vitest";
import type { Block } from "@/schema";
import {
  checkNumericIntegrity,
  extractNumbers,
} from "@/lib/ai/numeric-integrity";

function block(stem: string, optionTexts: string[] = []): Block {
  return {
    id: "b",
    type: optionTexts.length ? "mcq" : "short_answer",
    stem,
    marks: 1,
    required: true,
    ...(optionTexts.length
      ? {
          options: optionTexts.map((t, i) => ({
            id: `o${i}`,
            text: t,
            isCorrect: i === 0,
          })),
        }
      : {}),
  };
}

describe("numeric integrity", () => {
  it("extracts and normalises numbers", () => {
    expect(extractNumbers("merge sort on 8 elements makes 17 comparisons")).toEqual(
      ["8", "17"],
    );
    expect(extractNumbers("value 07 and 9.50")).toEqual(["7", "9.5"]);
  });

  it("passes when the numbers match the source", () => {
    const source = "Binary search is O(2) … answer 42";
    expect(checkNumericIntegrity(block("Binary search is O(2), answer 42"), source)).toBeNull();
  });

  it("flags a block whose number differs from the source", () => {
    // Source says 17, the model produced 15.
    const source = "Compute comparisons on 8 elements: 17";
    const mismatch = checkNumericIntegrity(
      block("Compute comparisons on 8 elements: 15"),
      source,
    );
    expect(mismatch).not.toBeNull();
    expect(mismatch?.source).toContain("17");
    expect(mismatch?.converted).toContain("15");
  });

  it("checks numbers inside options too", () => {
    const source = "Which equals 4? 2, 3, 4";
    const mismatch = checkNumericIntegrity(
      block("Which equals 4?", ["2", "3", "5"]),
      source,
    );
    expect(mismatch).not.toBeNull();
  });

  it("is order-independent (multiset comparison)", () => {
    const source = "3 and 8";
    expect(checkNumericIntegrity(block("8 and 3"), source)).toBeNull();
  });
});

"use client";

import { TriangleAlert } from "lucide-react";
import { MathText } from "@/lib/math/katex";
import { QuestionNumber } from "@/components/common/question-number";
import { Tag, type Tone } from "@/components/common/tag";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { Confidence } from "@/modules/exam";
import type { ConversionBlock } from "../schema";

const CONFIDENCE_TONE: Record<Confidence, Tone> = {
  high: "ok",
  medium: "neutral",
  low: "flag",
};

/**
 * One converted block awaiting review (AGENTS §7). Confidence is shown, numeric
 * mismatches are surfaced prominently, and a reviewed checkbox gates publish
 * (rule 3.6). Selecting the card syncs the original page on the left.
 */
export function ConversionBlockCard({
  block,
  selected,
  reviewed,
  onSelect,
  onReviewedChange,
}: {
  block: ConversionBlock;
  selected: boolean;
  reviewed: boolean;
  onSelect: () => void;
  onReviewedChange: (v: boolean) => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "rounded-lg border bg-surface p-3 transition-colors",
        selected ? "border-accent ring-1 ring-accent" : "border-rule hover:border-rule-strong",
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <QuestionNumber n={block.number} />
        <span className="text-xs font-medium text-ink-3">
          {block.type.replace("_", " ")}
        </span>
        <Tag tone={CONFIDENCE_TONE[block.confidence]} className="ml-auto">
          {block.confidence} confidence
        </Tag>
      </div>

      {block.numericMismatch ? (
        <div
          className="mb-2 rounded-md border border-flag/40 bg-flag-soft px-3 py-2"
          role="alert"
        >
          <p className="flex items-center gap-1.5 text-xs font-semibold text-flag">
            <TriangleAlert className="size-3.5" aria-hidden />
            Numbers don’t match the source — check before accepting
          </p>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 font-mono text-xs text-ink-2 tabular">
            <span>source: {block.numericMismatch.source.join(", ")}</span>
            <span>converted: {block.numericMismatch.converted.join(", ")}</span>
          </div>
        </div>
      ) : null}

      <MathText className="block font-serif text-ink" blankPlaceholder>
        {block.stem}
      </MathText>

      {block.options ? (
        <ul className="mt-2 space-y-1">
          {block.options.map((o) => (
            <li key={o.id} className="flex items-start gap-2 text-sm">
              <span
                className={cn(
                  "mt-1.5 size-2 shrink-0 rounded-full",
                  o.isCorrect ? "bg-ok" : "bg-rule-strong",
                )}
                aria-hidden
              />
              <MathText className="font-serif text-ink-2">{o.text}</MathText>
            </li>
          ))}
        </ul>
      ) : null}

      <label
        className="mt-3 flex w-fit items-center gap-2 text-sm text-ink"
        onClick={(e) => e.stopPropagation()}
      >
        <Checkbox checked={reviewed} onCheckedChange={onReviewedChange} />
        Reviewed
      </label>
    </div>
  );
}

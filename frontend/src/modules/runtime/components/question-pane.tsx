"use client";

import { createElement } from "react";
import { ChevronLeft, ChevronRight, Flag } from "lucide-react";
import { MathText } from "@/lib/math/katex";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { QuestionNumber } from "@/components/common/question-number";
import { getRuntimeRenderer } from "../blocks/registry";
import { presentedOptions } from "../select";
import { useRuntime } from "../store";

/** Centre column: one question at a time, max 720px, rendered by block type. */
export function QuestionPane() {
  const { sitting, current, currentIndex, items, answers, updateAnswer, toggleFlag, next, prev } =
    useRuntime();

  if (!current) return null;

  const { block } = current;
  const answer = answers[block.id];
  const flagged = answer?.flaggedForReview ?? false;
  const isContent = block.type === "content" || block.type === "section";
  const Renderer = getRuntimeRenderer(block.type);
  const options = presentedOptions(sitting, block);

  return (
    <div className="mx-auto flex h-full w-full max-w-[720px] flex-col px-6 py-6">
      <p className="mb-4 text-xs font-medium uppercase tracking-wide text-ink-3">
        {current.sectionTitle}
      </p>

      <div className="flex-1">
        {isContent ? (
          <div className="rounded-lg border border-rule bg-surface-sunk/40 p-5">
            <MathText className="font-serif text-lg leading-relaxed text-ink-2">
              {block.stem}
            </MathText>
          </div>
        ) : (
          <article className="space-y-5">
            <div className="flex items-start gap-3">
              {current.number !== undefined ? (
                <QuestionNumber n={current.number} state="current" className="mt-1" />
              ) : null}
              <div className="flex-1 space-y-1">
                <MathText className="font-serif text-lg leading-relaxed text-ink">
                  {block.stem}
                </MathText>
                {block.marks > 0 ? (
                  <p className="font-mono text-xs text-ink-3 tabular">
                    {block.marks} {block.marks === 1 ? "mark" : "marks"}
                  </p>
                ) : null}
              </div>
            </div>

            {Renderer ? (
              createElement(Renderer, {
                block,
                answer,
                options,
                onChange: (patch) => updateAnswer(block.id, patch),
              })
            ) : (
              <p className="text-sm text-ink-3">
                This question type isn’t available here.
              </p>
            )}
          </article>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-rule pt-4">
        <Button variant="ghost" onClick={prev} disabled={currentIndex === 0}>
          <ChevronLeft />
          Previous
        </Button>

        {!isContent ? (
          <Button
            variant={flagged ? "outline" : "ghost"}
            onClick={() => toggleFlag(block.id)}
            aria-pressed={flagged}
            className={cn(flagged && "border-flag/50 text-flag")}
          >
            <Flag className={cn(flagged && "fill-flag/20")} />
            {flagged ? "Flagged" : "Flag for review"}
          </Button>
        ) : (
          <span />
        )}

        <Button
          variant="outline"
          onClick={next}
          disabled={currentIndex === items.length - 1}
        >
          Next
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { ListChecks } from "lucide-react";
import { MathText } from "@/lib/math/katex";
import { QuestionNumber } from "@/components/common/question-number";
import { Tag } from "@/components/common/tag";
import { cn } from "@/lib/utils";
import { useGradingStore } from "../store";
import { ResponseCard } from "./response-card";

/** By-question grading (default): one question, then every student's answer. */
export function QuestionGrader() {
  const { grading } = useGradingStore();
  const [index, setIndex] = useState(0);
  const question = grading.questions[index];
  if (!question) return null;

  const gradedHere = question.responses.filter((r) => r.awarded !== null).length;

  return (
    <div className="space-y-5">
      {/* Question picker */}
      <div className="flex flex-wrap gap-1.5">
        {grading.questions.map((q, i) => {
          const done = q.responses.every((r) => r.awarded !== null);
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => setIndex(i)}
              className={cn(
                "rounded-sm px-2 py-1 font-mono text-xs tabular outline-none ring-1 ring-inset transition-colors focus-visible:ring-2 focus-visible:ring-accent/50",
                i === index
                  ? "bg-accent text-white ring-accent"
                  : done
                    ? "bg-ok-soft text-ok ring-ok/30"
                    : "bg-surface text-ink-2 ring-rule-strong hover:bg-surface-sunk",
              )}
            >
              Q{q.number}
            </button>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_16rem]">
        <div className="space-y-4">
          <div className="rounded-lg border border-rule bg-surface-sunk/40 p-4">
            <div className="flex items-start gap-3">
              <QuestionNumber n={question.number} state="current" className="mt-1" />
              <div className="flex-1 space-y-1">
                <MathText className="font-serif text-lg leading-relaxed text-ink">
                  {question.stem}
                </MathText>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-ink-3 tabular">
                    {question.maxMarks} marks
                  </span>
                  {question.autoScored ? (
                    <Tag tone="accent">Auto-scored</Tag>
                  ) : null}
                  <span className="font-mono text-xs text-ink-3 tabular">
                    {gradedHere}/{question.responses.length} graded
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {question.responses.map((r) => (
              <ResponseCard key={r.attemptId} question={question} response={r} />
            ))}
          </div>
        </div>

        {question.rubric.length > 0 ? (
          <aside className="lg:sticky lg:top-4 h-fit rounded-lg border border-rule bg-surface p-4">
            <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink">
              <ListChecks className="size-4 text-ink-3" aria-hidden />
              Rubric
            </h3>
            <ul className="space-y-1.5 text-sm text-ink-2">
              {question.rubric.map((r, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-ink-3">·</span>
                  {r}
                </li>
              ))}
            </ul>
          </aside>
        ) : null}
      </div>
    </div>
  );
}

"use client";

import { cn } from "@/lib/utils";
import { isAnswered } from "../select";
import { useRuntime } from "../store";

/**
 * The answer-sheet rail (AGENTS §4 signature element): a grid of numbered cells
 * that fill solid when answered, with a corner marker for flagged questions,
 * echoing an OMR bubble sheet. Grouped by section.
 */
export function AnswerRail() {
  const { items, currentIndex, answers, goTo } = useRuntime();

  // Group scored questions by section, keeping their index in `items`.
  const sections: { id: string; title: string; cells: number[] }[] = [];
  items.forEach((item, index) => {
    if (item.number === undefined) return;
    let group = sections.find((s) => s.id === item.sectionId);
    if (!group) {
      group = { id: item.sectionId, title: item.sectionTitle, cells: [] };
      sections.push(group);
    }
    group.cells.push(index);
  });

  return (
    <nav
      aria-label="Answer sheet"
      className="flex w-56 shrink-0 flex-col overflow-y-auto border-r border-rule bg-surface"
    >
      <div className="space-y-4 p-3">
        {sections.map((s) => (
          <div key={s.id} className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-3">
              {s.title}
            </p>
            <div className="grid grid-cols-5 gap-1.5">
              {s.cells.map((index) => {
                const item = items[index];
                const answer = answers[item.questionId];
                const flagged = answer?.flaggedForReview ?? false;
                const answered = isAnswered(item.block, answer);
                const current = index === currentIndex;
                return (
                  <Cell
                    key={item.questionId}
                    n={item.number!}
                    current={current}
                    answered={answered}
                    flagged={flagged}
                    onClick={() => goTo(index)}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <Legend />
    </nav>
  );
}

function Cell({
  n,
  current,
  answered,
  flagged,
  onClick,
}: {
  n: number;
  current: boolean;
  answered: boolean;
  flagged: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={current ? "true" : undefined}
      aria-label={`Question ${n}${answered ? ", answered" : ", not answered"}${flagged ? ", flagged" : ""}`}
      className={cn(
        "relative flex aspect-square items-center justify-center rounded-sm font-mono text-xs tabular outline-none transition-colors",
        "focus-visible:ring-2 focus-visible:ring-accent/50",
        answered
          ? "bg-accent text-white"
          : "bg-surface text-ink-2 ring-1 ring-inset ring-rule-strong hover:bg-surface-sunk",
        current && "ring-2 ring-accent ring-offset-1 ring-offset-surface",
      )}
    >
      {n}
      {flagged ? (
        <span
          className="absolute right-0 top-0 size-0 border-l-[7px] border-t-[7px] border-l-transparent border-t-flag"
          aria-hidden
        />
      ) : null}
    </button>
  );
}

function Legend() {
  return (
    <div className="mt-auto space-y-1.5 border-t border-rule p-3 text-xs text-ink-2">
      <LegendRow className="bg-accent" label="Answered" />
      <LegendRow className="bg-surface ring-1 ring-inset ring-rule-strong" label="Not answered" />
      <LegendRow className="bg-surface ring-2 ring-accent" label="Current" />
      <div className="flex items-center gap-2">
        <span className="relative size-3.5 rounded-sm bg-surface ring-1 ring-inset ring-rule-strong">
          <span className="absolute right-0 top-0 size-0 border-l-[6px] border-t-[6px] border-l-transparent border-t-flag" />
        </span>
        Flagged for review
      </div>
    </div>
  );
}

function LegendRow({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("size-3.5 rounded-sm", className)} aria-hidden />
      {label}
    </div>
  );
}

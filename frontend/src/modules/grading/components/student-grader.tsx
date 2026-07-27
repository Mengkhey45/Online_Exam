"use client";

import { useState } from "react";
import { MathText } from "@/lib/math/katex";
import { QuestionNumber } from "@/components/common/question-number";
import { cn } from "@/lib/utils";
import { useGradingStore } from "../store";
import { ResponseCard } from "./response-card";

/** By-student grading: pick a student, grade all their answers in order. */
export function StudentGrader() {
  const { grading } = useGradingStore();

  // Unique students across all questions (anonymised IDs, rule 3.5).
  const students = Array.from(
    new Map(
      grading.questions.flatMap((q) =>
        q.responses.map((r) => [r.attemptId, r.studentId] as const),
      ),
    ),
  );
  const [attemptId, setAttemptId] = useState(students[0]?.[0]);

  return (
    <div className="grid gap-5 lg:grid-cols-[12rem_1fr]">
      <aside className="h-fit space-y-1 lg:sticky lg:top-4">
        {students.map(([aid, sid]) => {
          const graded = grading.questions.every((q) => {
            const r = q.responses.find((x) => x.attemptId === aid);
            return !r || r.awarded !== null;
          });
          return (
            <button
              key={aid}
              type="button"
              onClick={() => setAttemptId(aid)}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left font-mono text-sm tabular outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent/50",
                aid === attemptId
                  ? "bg-accent-soft text-accent"
                  : "text-ink-2 hover:bg-surface-sunk",
              )}
            >
              {sid}
              {graded ? (
                <span className="size-1.5 rounded-full bg-ok" aria-label="graded" />
              ) : null}
            </button>
          );
        })}
      </aside>

      <div className="space-y-4">
        {grading.questions.map((q) => {
          const r = q.responses.find((x) => x.attemptId === attemptId);
          if (!r) return null;
          return (
            <div key={q.id} className="space-y-2">
              <div className="flex items-start gap-2">
                <QuestionNumber n={q.number} className="mt-0.5" />
                <MathText className="font-serif text-ink">{q.stem}</MathText>
              </div>
              <ResponseCard question={q} response={r} showStudent={false} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

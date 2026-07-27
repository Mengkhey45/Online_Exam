"use client";

import { useState } from "react";
import { Lock, Sparkles } from "lucide-react";
import { MathText } from "@/lib/math/katex";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/common/tag";
import { cn } from "@/lib/utils";
import type { GradableQuestion, Response } from "../schema";
import { useGradingStore } from "../store";
import { useSaveMark } from "../queries";

/**
 * One student's response with the marks control. Auto-scored questions show the
 * server score read-only with an explicit override (AGENTS §7). Marks are
 * inputs sent to the backend — never a total the frontend computes (§9).
 */
export function ResponseCard({
  question,
  response,
  showStudent = true,
  showQuestion = false,
}: {
  question: GradableQuestion;
  response: Response;
  showStudent?: boolean;
  showQuestion?: boolean;
}) {
  const { dispatch } = useGradingStore();
  const save = useSaveMark();
  const [overriding, setOverriding] = useState(false);

  const locked = question.autoScored && !overriding;
  const value = response.awarded;

  function setMark(awarded: number | null) {
    const clamped =
      awarded === null
        ? null
        : Math.max(0, Math.min(question.maxMarks, awarded));
    dispatch({
      kind: "set_mark",
      questionId: question.id,
      attemptId: response.attemptId,
      awarded: clamped,
    });
    // Only answers that exist on the server can be scored.
    if (response.answerId) {
      save.mutate({
        answerId: response.answerId,
        awarded: clamped,
        comment: response.comment,
      });
    }
  }

  function setComment(comment: string) {
    dispatch({
      kind: "set_comment",
      questionId: question.id,
      attemptId: response.attemptId,
      comment,
    });
  }

  return (
    <div className="rounded-lg border border-rule bg-surface p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        {showQuestion ? (
          <span className="font-mono text-xs text-ink-3 tabular">
            Q{question.number}
          </span>
        ) : null}
        {showStudent ? (
          <span className="font-mono text-sm font-medium text-ink tabular">
            {response.studentId}
          </span>
        ) : (
          <span />
        )}
        {question.autoScored ? (
          <Tag tone={response.autoScore ? "ok" : "neutral"}>
            <Sparkles aria-hidden />
            Auto {response.autoScore ?? 0}/{question.maxMarks}
          </Tag>
        ) : null}
      </div>

      <MathText className="mb-3 block font-serif text-ink">
        {response.answerText || "—"}
      </MathText>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Input
            type="number"
            min={0}
            max={question.maxMarks}
            step={0.5}
            value={value ?? ""}
            disabled={locked}
            placeholder="—"
            onChange={(e) =>
              setMark(e.target.value === "" ? null : Number(e.target.value))
            }
            aria-label={`Marks for ${response.studentId}`}
            className="h-8 w-20 font-mono tabular"
          />
          <span className="font-mono text-sm text-ink-3 tabular">
            / {question.maxMarks}
          </span>
        </div>

        {locked ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOverriding(true)}
            className="text-ink-2"
          >
            <Lock />
            Override
          </Button>
        ) : (
          <div className="flex items-center gap-1">
            <QuickAward label="0" onClick={() => setMark(0)} />
            {question.maxMarks > 1 ? (
              <QuickAward
                label="Half"
                onClick={() => setMark(question.maxMarks / 2)}
              />
            ) : null}
            <QuickAward label="Full" onClick={() => setMark(question.maxMarks)} />
          </div>
        )}
      </div>

      {!question.autoScored ? (
        <Textarea
          value={response.comment}
          onChange={(e) => setComment(e.target.value)}
          onBlur={() => {
            if (response.answerId) {
              save.mutate({
                answerId: response.answerId,
                awarded: response.awarded,
                comment: response.comment,
              });
            }
          }}
          placeholder="Comment for the student (optional)"
          rows={2}
          className="mt-2 text-sm"
        />
      ) : null}
    </div>
  );
}

function QuickAward({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="xs"
      onClick={onClick}
      className={cn("font-mono tabular")}
    >
      {label}
    </Button>
  );
}

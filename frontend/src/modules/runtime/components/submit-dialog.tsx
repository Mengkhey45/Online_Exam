"use client";

import { toast } from "sonner";
import { CheckCircle2, Flag, CircleDashed } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { isAnswered } from "../select";
import { useRuntime } from "../store";

/**
 * Submit confirmation (AGENTS §7). Lists unanswered and flagged counts before a
 * student commits. Jumping to the first unanswered question is one click away.
 */
export function SubmitDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { items, answers, goTo } = useRuntime();

  const questions = items.filter((i) => i.number !== undefined);
  const unanswered = questions.filter(
    (i) => !isAnswered(i.block, answers[i.questionId]),
  );
  const flagged = questions.filter(
    (i) => answers[i.questionId]?.flaggedForReview,
  );

  function jumpTo(questionId: string) {
    const index = items.findIndex((i) => i.questionId === questionId);
    if (index >= 0) goTo(index);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Submit exam?</DialogTitle>
          <DialogDescription>
            Once you submit, you can’t change your answers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <SummaryRow
            Icon={CheckCircle2}
            tone="text-ok"
            label="Answered"
            value={`${questions.length - unanswered.length} of ${questions.length}`}
          />
          <ClickableRow
            Icon={CircleDashed}
            tone="text-ink-2"
            label="Unanswered"
            items={unanswered.map((i) => ({ id: i.questionId, n: i.number! }))}
            onJump={jumpTo}
          />
          <ClickableRow
            Icon={Flag}
            tone="text-flag"
            label="Flagged for review"
            items={flagged.map((i) => ({ id: i.questionId, n: i.number! }))}
            onJump={jumpTo}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Keep working
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false);
              toast.success("Exam submitted");
            }}
          >
            Submit exam
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SummaryRow({
  Icon,
  tone,
  label,
  value,
}: {
  Icon: typeof CheckCircle2;
  tone: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-md bg-surface-sunk/60 px-3 py-2 text-sm">
      <span className="flex items-center gap-2 text-ink-2">
        <Icon className={`size-4 ${tone}`} aria-hidden />
        {label}
      </span>
      <span className="font-mono text-ink tabular">{value}</span>
    </div>
  );
}

function ClickableRow({
  Icon,
  tone,
  label,
  items,
  onJump,
}: {
  Icon: typeof Flag;
  tone: string;
  label: string;
  items: { id: string; n: number }[];
  onJump: (id: string) => void;
}) {
  return (
    <div className="rounded-md bg-surface-sunk/60 px-3 py-2 text-sm">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-ink-2">
          <Icon className={`size-4 ${tone}`} aria-hidden />
          {label}
        </span>
        <span className="font-mono text-ink tabular">{items.length}</span>
      </div>
      {items.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {items.map((it) => (
            <button
              key={it.id}
              type="button"
              onClick={() => onJump(it.id)}
              className="rounded-sm bg-surface px-1.5 py-0.5 font-mono text-xs text-ink-2 tabular ring-1 ring-inset ring-rule-strong hover:text-accent hover:ring-accent-line"
            >
              {it.n}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

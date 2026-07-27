"use client";

import { useEffect, useState } from "react";
import { PauseCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

/**
 * Medium-security lockout (AGENTS §7): a countdown, the reason, and a note
 * field. The tone is neutral — the exam is paused, not the student accused
 * (rule 3.4). Nothing here changes a score; a teacher decides what matters.
 */
export function LockoutOverlay({
  reason,
  onResume,
  holdSeconds = 5,
}: {
  reason: string;
  onResume: (note: string) => void;
  holdSeconds?: number;
}) {
  const [left, setLeft] = useState(holdSeconds);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label="Exam paused"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md space-y-4 rounded-xl border border-rule bg-surface p-6 shadow-[var(--shadow-overlay)]">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-full bg-flag-soft text-flag">
            <PauseCircle className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-base font-semibold text-ink">Your exam is paused</h2>
            <p className="text-sm text-ink-2">{reason}</p>
          </div>
        </div>

        <p className="rounded-md bg-surface-sunk px-3 py-2 text-sm text-ink-2">
          Your answers are saved. Your teacher will see that the exam was paused;
          it doesn’t change your marks.
        </p>

        <div className="space-y-1.5">
          <Label htmlFor="lockout-note" className="text-sm text-ink-2">
            Add a note about what happened (optional)
          </Label>
          <Textarea
            id="lockout-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="e.g. my browser switched apps"
          />
        </div>

        <Button
          className="w-full"
          disabled={left > 0}
          onClick={() => onResume(note)}
        >
          {left > 0 ? `Resume in ${left}s` : "Resume exam"}
        </Button>
      </div>
    </div>
  );
}

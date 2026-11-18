"use client";

import { useEffect, useState } from "react";
import { PauseCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Medium-security lockout (AGENTS §7): a short hold, then the student resumes.
 * The tone is neutral — the exam is paused, not the student accused (rule 3.4).
 * Nothing here changes a score; the time away is recorded as activity for the
 * teacher to review. (High security pauses until a teacher unlocks, and that
 * screen — in FullscreenGate — is where a note to the teacher can be sent.)
 */
export function LockoutOverlay({
  reason,
  onResume,
  holdSeconds = 5,
}: {
  reason: string;
  onResume: () => void;
  holdSeconds?: number;
}) {
  const [left, setLeft] = useState(holdSeconds);

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
          Your answers are saved. Time away from the exam is recorded for your
          teacher to review; it doesn’t change your marks. The timer keeps running.
        </p>

        <Button
          className="w-full"
          disabled={left > 0}
          onClick={onResume}
        >
          {left > 0 ? `Resume in ${left}s` : "Resume exam"}
        </Button>
      </div>
    </div>
  );
}

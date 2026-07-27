"use client";

import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCountdown } from "../hooks/use-countdown";
import { useRuntime } from "../store";
import { SaveIndicator } from "./save-indicator";

/**
 * Runtime top bar (AGENTS §7). Timer and save state are visible at all times
 * without scrolling. Countdown turns amber under 10 min, red under 2.
 */
export function RuntimeTopbar({ onSubmit }: { onSubmit: () => void }) {
  const { sitting, saveState } = useRuntime();
  const countdown = useCountdown(sitting.attempt.expiresAt);

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-rule bg-surface px-4">
      <h1 className="truncate text-sm font-semibold text-ink">
        {sitting.exam.title}
      </h1>

      <div className="ml-auto flex items-center gap-5">
        <SaveIndicator state={saveState} />

        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-sm font-semibold tabular",
            countdown.urgency === "normal" && "bg-surface-sunk text-ink-2",
            countdown.urgency === "amber" && "bg-flag-soft text-flag",
            countdown.urgency === "red" && "bg-danger-soft text-danger",
          )}
          aria-label={`Time remaining ${countdown.label}`}
        >
          <Clock className="size-3.5" aria-hidden />
          {countdown.label}
        </span>

        <Button size="sm" onClick={onSubmit}>
          Submit exam
        </Button>
      </div>
    </header>
  );
}

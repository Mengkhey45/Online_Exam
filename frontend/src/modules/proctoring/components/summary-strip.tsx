"use client";

import { cn } from "@/lib/utils";
import type { MonitoredStudent } from "../schema";

export type MonitorFilter =
  | "all"
  | "in_progress"
  | "submitted"
  | "needs_unlock"
  | "flags";

/** Clickable summary tiles that filter the table (AGENTS §7). */
export function SummaryStrip({
  students,
  active,
  onChange,
}: {
  students: MonitoredStudent[];
  active: MonitorFilter;
  onChange: (f: MonitorFilter) => void;
}) {
  const counts = {
    all: students.length,
    in_progress: students.filter((s) => s.status === "in_progress").length,
    submitted: students.filter((s) => s.status === "submitted").length,
    needs_unlock: students.filter((s) => s.status === "locked").length,
    flags: students.reduce((n, s) => n + s.flagCount, 0),
  };

  const tiles: { id: MonitorFilter; label: string; value: number; flag?: boolean }[] = [
    { id: "all", label: "All students", value: counts.all },
    { id: "in_progress", label: "In progress", value: counts.in_progress },
    { id: "submitted", label: "Submitted", value: counts.submitted },
    { id: "needs_unlock", label: "Awaiting unlock", value: counts.needs_unlock, flag: true },
    { id: "flags", label: "Flags to review", value: counts.flags, flag: true },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      {tiles.map((t) => {
        const selected = active === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            aria-pressed={selected}
            className={cn(
              "rounded-lg border p-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent/50",
              selected
                ? "border-accent bg-accent-soft"
                : "border-rule bg-surface hover:border-rule-strong",
            )}
          >
            <div
              className={cn(
                "font-mono text-xl font-semibold tabular",
                t.flag && t.value > 0 ? "text-flag" : "text-ink",
              )}
            >
              {t.value}
            </div>
            <div className="mt-0.5 text-xs text-ink-2">{t.label}</div>
          </button>
        );
      })}
    </div>
  );
}

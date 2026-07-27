import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * A dense, squared status tag. Unlike the pill Badge, this reads as a label in
 * a table row. Colour is never the only signal (AGENTS §8) — always pass text,
 * and an icon where it helps.
 */
const toneClass = {
  neutral: "bg-surface-sunk text-ink-2 ring-rule-strong/60",
  accent: "bg-accent-soft text-accent ring-accent-line/70",
  flag: "bg-flag-soft text-flag ring-flag/30",
  danger: "bg-danger-soft text-danger ring-danger/30",
  ok: "bg-ok-soft text-ok ring-ok/30",
} as const;

export type Tone = keyof typeof toneClass;

export function Tag({
  tone = "neutral",
  className,
  children,
  ...props
}: React.ComponentProps<"span"> & { tone?: Tone }) {
  return (
    <span
      data-slot="tag"
      className={cn(
        "inline-flex h-5 w-fit shrink-0 items-center gap-1 rounded-sm px-1.5",
        "text-xs font-medium whitespace-nowrap ring-1 ring-inset",
        "[&>svg]:size-3 [&>svg]:shrink-0",
        toneClass[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

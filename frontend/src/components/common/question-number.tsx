import { cn } from "@/lib/utils";

/**
 * The bordered mono box that identifies a question. The same component appears
 * in the builder, the runtime, and grading so that one question reads as the
 * same object everywhere (AGENTS §4, signature element).
 *
 * The number shown is the question's canonical position for teachers, or the
 * presented position for a student — the caller decides. This component never
 * derives meaning from the number; it only displays it.
 */
export function QuestionNumber({
  n,
  state = "default",
  className,
}: {
  n: number | string;
  state?: "default" | "current" | "answered" | "flagged";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 min-w-6 items-center justify-center rounded-sm px-1",
        "font-mono text-xs font-medium tabular-nums ring-1 ring-inset",
        state === "default" && "bg-surface text-ink-2 ring-rule-strong",
        state === "current" && "bg-accent text-white ring-accent",
        state === "answered" && "bg-accent-soft text-accent ring-accent-line",
        state === "flagged" && "bg-flag-soft text-flag ring-flag/50",
        className,
      )}
    >
      {n}
    </span>
  );
}

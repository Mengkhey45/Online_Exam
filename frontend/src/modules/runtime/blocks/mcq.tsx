"use client";

import { Check } from "lucide-react";
import { MathText } from "@/lib/math/katex";
import { cn } from "@/lib/utils";
import type { RuntimeRenderer } from "./types";

/** Single choice. The selected answer is stored as one option ID. */
export const McqRuntime: RuntimeRenderer = ({ block, answer, options, onChange }) => {
  const selected = answer?.optionIds?.[0];
  return (
    <fieldset className="space-y-2">
      <legend className="sr-only">Select one answer</legend>
      {options.map((o) => {
        const checked = selected === o.id;
        return (
          <label
            key={o.id}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
              checked
                ? "border-accent bg-accent-soft"
                : "border-rule hover:border-rule-strong hover:bg-surface-sunk/50",
            )}
          >
            <input
              type="radio"
              name={block.id}
              value={o.id}
              checked={checked}
              onChange={() => onChange({ optionIds: [o.id] })}
              className="sr-only"
            />
            <span
              className={cn(
                "mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full border",
                checked ? "border-accent bg-accent text-white" : "border-rule-strong bg-surface",
              )}
              aria-hidden
            >
              {checked ? <span className="size-2 rounded-full bg-white" /> : null}
            </span>
            <MathText className="font-serif text-ink">{o.text}</MathText>
          </label>
        );
      })}
    </fieldset>
  );
};

/** Multiple choice. Answer is a set of option IDs. */
export const MultiSelectRuntime: RuntimeRenderer = ({
  answer,
  options,
  onChange,
}) => {
  const selected = new Set(answer?.optionIds ?? []);
  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange({ optionIds: [...next] });
  }
  return (
    <fieldset className="space-y-2">
      <legend className="sr-only">Select all that apply</legend>
      {options.map((o) => {
        const checked = selected.has(o.id);
        return (
          <label
            key={o.id}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
              checked
                ? "border-accent bg-accent-soft"
                : "border-rule hover:border-rule-strong hover:bg-surface-sunk/50",
            )}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggle(o.id)}
              className="sr-only"
            />
            <span
              className={cn(
                "mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-sm border",
                checked ? "border-accent bg-accent text-white" : "border-rule-strong bg-surface",
              )}
              aria-hidden
            >
              {checked ? <Check className="size-3" /> : null}
            </span>
            <MathText className="font-serif text-ink">{o.text}</MathText>
          </label>
        );
      })}
    </fieldset>
  );
};

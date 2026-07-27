"use client";

import { CircleDot } from "lucide-react";
import type { BlockDef } from "./def";
import type { Block } from "@/modules/exam";
import { MathText } from "@/lib/math/katex";
import { genId } from "@/lib/utils";
import {
  MarksField,
  OptionsEditor,
  RequiredToggle,
  StemField,
  ToggleRow,
} from "./fields";
import { cn } from "@/lib/utils";

/** Preview of an option list. Correct answers are marked for the teacher only. */
export function OptionPreview({ block }: { block: Block }) {
  const options = block.options ?? [];
  if (options.length === 0)
    return <span className="text-sm text-ink-3">No options yet.</span>;
  return (
    <ul className="space-y-1">
      {options.map((o) => (
        <li key={o.id} className="flex items-start gap-2 text-sm">
          <span
            className={cn(
              "mt-1.5 size-2 shrink-0 rounded-full",
              o.isCorrect ? "bg-ok" : "bg-rule-strong",
            )}
            aria-hidden
          />
          <MathText
            className={cn("font-serif", o.isCorrect ? "text-ink" : "text-ink-2")}
          >
            {o.text || "…"}
          </MathText>
        </li>
      ))}
    </ul>
  );
}

/** Shared settings for single/multi choice. */
export function ChoiceSettings({
  block,
  update,
  single,
}: {
  block: Block;
  update: (patch: Partial<Block>) => void;
  single: boolean;
}) {
  const options = block.options ?? [];
  const lastPinned = options.at(-1)?.keepLast ?? false;

  function pinLast(v: boolean) {
    if (options.length === 0) return;
    update({
      options: options.map((o, i) =>
        i === options.length - 1 ? { ...o, keepLast: v } : o,
      ),
    });
  }

  return (
    <div className="space-y-4">
      <StemField block={block} update={update} />
      <OptionsEditor block={block} update={update} single={single} />
      <ToggleRow
        label="Shuffle options"
        description="Present options in a random order per student."
        checked={block.shuffleOptions ?? false}
        onChange={(shuffleOptions) => update({ shuffleOptions })}
      />
      <ToggleRow
        label="Pin the last option"
        description="Keeps “All of the above” in place when shuffling."
        checked={lastPinned}
        onChange={pinLast}
      />
      <MarksField block={block} update={update} />
      <RequiredToggle block={block} update={update} />
    </div>
  );
}

export const mcqDef: BlockDef = {
  type: "mcq",
  label: "Multiple choice",
  group: "objective",
  icon: CircleDot,
  scored: true,
  create: () => ({
    id: genId("blk"),
    type: "mcq",
    stem: "",
    marks: 1,
    required: true,
    shuffleOptions: true,
    options: [
      { id: genId("opt"), text: "", isCorrect: true },
      { id: genId("opt"), text: "", isCorrect: false },
      { id: genId("opt"), text: "", isCorrect: false },
      { id: genId("opt"), text: "", isCorrect: false },
    ],
  }),
  Body: ({ block }) => (
    <div className="space-y-2">
      <MathText className="font-serif text-ink">
        {block.stem || "Untitled question"}
      </MathText>
      <OptionPreview block={block} />
    </div>
  ),
  Settings: ({ block, update }) => (
    <ChoiceSettings block={block} update={update} single />
  ),
};

"use client";

import { ListChecks } from "lucide-react";
import type { BlockDef } from "./def";
import { MathText } from "@/lib/math/katex";
import { genId } from "@/lib/utils";
import { ChoiceSettings, OptionPreview } from "./mcq";

/** Multiple correct answers. Shares the choice settings with mcq (single=off). */
export const multiSelectDef: BlockDef = {
  type: "multi_select",
  label: "Multi-select",
  group: "objective",
  icon: ListChecks,
  scored: true,
  create: () => ({
    id: genId("blk"),
    type: "multi_select",
    stem: "",
    marks: 1,
    required: true,
    shuffleOptions: true,
    options: [
      { id: genId("opt"), text: "", isCorrect: true },
      { id: genId("opt"), text: "", isCorrect: true },
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
    <ChoiceSettings block={block} update={update} single={false} />
  ),
};

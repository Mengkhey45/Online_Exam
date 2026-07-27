"use client";

import { AlignLeft } from "lucide-react";
import type { BlockDef } from "./def";
import { MathText } from "@/lib/math/katex";
import { genId } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { MarksField, RequiredToggle, SettingRow, StemField } from "./fields";

/** Long answer — an essay/extended response, graded by a teacher. */
export const longAnswerDef: BlockDef = {
  type: "long_answer",
  label: "Long answer",
  group: "written",
  icon: AlignLeft,
  scored: true,
  create: () => ({
    id: genId("blk"),
    type: "long_answer",
    stem: "",
    marks: 5,
    required: true,
    charLimit: 2000,
  }),
  Body: ({ block }) => (
    <div className="space-y-2">
      <MathText className="font-serif text-ink">
        {block.stem || "Untitled question"}
      </MathText>
      <div className="h-16 rounded-md border border-dashed border-rule-strong bg-surface-sunk" />
    </div>
  ),
  Settings: ({ block, update }) => (
    <div className="space-y-4">
      <StemField block={block} update={update} />
      <SettingRow
        label="Character limit"
        htmlFor="charlimit"
        hint="Shown to students as a live count."
      >
        <Input
          id="charlimit"
          type="number"
          min={0}
          value={block.charLimit ?? 0}
          onChange={(e) => update({ charLimit: Number(e.target.value) })}
          className="w-32 font-mono tabular"
        />
      </SettingRow>
      <MarksField block={block} update={update} />
      <RequiredToggle block={block} update={update} />
    </div>
  ),
};

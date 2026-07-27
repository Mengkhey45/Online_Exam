"use client";

import { Minus } from "lucide-react";
import type { BlockDef } from "./def";
import { MathText } from "@/lib/math/katex";
import { genId } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { MarksField, RequiredToggle, SettingRow, StemField } from "./fields";

/** Short answer — one line of text, graded by a teacher (AGENTS: grading is
 *  backend-authoritative; the frontend never scores). */
export const shortAnswerDef: BlockDef = {
  type: "short_answer",
  label: "Short answer",
  group: "written",
  icon: Minus,
  scored: true,
  create: () => ({
    id: genId("blk"),
    type: "short_answer",
    stem: "",
    marks: 2,
    required: true,
    charLimit: 200,
  }),
  Body: ({ block }) => (
    <div className="space-y-2">
      <MathText className="font-serif text-ink">
        {block.stem || "Untitled question"}
      </MathText>
      <div className="h-8 rounded-md border border-dashed border-rule-strong bg-surface-sunk" />
    </div>
  ),
  Settings: ({ block, update }) => (
    <div className="space-y-4">
      <StemField block={block} update={update} />
      <SettingRow label="Character limit" htmlFor="charlimit">
        <Input
          id="charlimit"
          type="number"
          min={0}
          value={block.charLimit ?? 0}
          onChange={(e) => update({ charLimit: Number(e.target.value) })}
          className="w-28 font-mono tabular"
        />
      </SettingRow>
      <MarksField block={block} update={update} />
      <RequiredToggle block={block} update={update} />
    </div>
  ),
};

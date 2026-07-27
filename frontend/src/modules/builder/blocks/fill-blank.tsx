"use client";

import { TextCursorInput, Plus, Trash2 } from "lucide-react";
import type { BlockDef } from "./def";
import type { Blank, Block } from "@/modules/exam";
import { MathText } from "@/lib/math/katex";
import { genId } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MarksField, SettingRow, StemField, ToggleRow } from "./fields";

function BlanksEditor({
  block,
  update,
}: {
  block: Block;
  update: (patch: Partial<Block>) => void;
}) {
  const blanks = block.blanks ?? [];

  function setBlanks(next: Blank[]) {
    update({ blanks: next });
  }
  function patch(id: string, p: Partial<Blank>) {
    setBlanks(blanks.map((b) => (b.id === id ? { ...b, ...p } : b)));
  }
  function addBlank() {
    const id = genId("blank");
    setBlanks([
      ...blanks,
      { id, acceptedAnswers: [], caseSensitive: false, marks: 1 },
    ]);
    // Append the placeholder token so it exists in the stem.
    update({ stem: `${block.stem} {{${id}}}`.trim() });
  }
  function removeBlank(id: string) {
    setBlanks(blanks.filter((b) => b.id !== id));
    update({ stem: block.stem.replace(`{{${id}}}`, "____").trim() });
  }

  return (
    <SettingRow
      label="Blanks"
      hint="Each blank grades independently. Separate accepted answers with commas."
    >
      <div className="space-y-2">
        {blanks.map((b, i) => (
          <div key={b.id} className="rounded-md border border-rule p-2 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-ink-3">Blank {i + 1}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Remove blank ${i + 1}`}
                onClick={() => removeBlank(b.id)}
                className="text-ink-3 hover:text-danger"
              >
                <Trash2 />
              </Button>
            </div>
            <Input
              value={b.acceptedAnswers.join(", ")}
              onChange={(e) =>
                patch(b.id, {
                  acceptedAnswers: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              placeholder="Accepted answers"
              className="h-8"
            />
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                step={0.5}
                value={b.marks}
                onChange={(e) => patch(b.id, { marks: Number(e.target.value) })}
                className="h-8 w-20 font-mono tabular"
                aria-label={`Marks for blank ${i + 1}`}
              />
              <label className="flex items-center gap-1.5 text-xs text-ink-2">
                <input
                  type="checkbox"
                  checked={b.caseSensitive}
                  onChange={(e) => patch(b.id, { caseSensitive: e.target.checked })}
                  className="accent-accent"
                />
                Case sensitive
              </label>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addBlank}
          className="w-full"
        >
          <Plus />
          Add blank
        </Button>
      </div>
    </SettingRow>
  );
}

export const fillBlankDef: BlockDef = {
  type: "fill_blank",
  label: "Fill in the blank",
  group: "objective",
  icon: TextCursorInput,
  scored: true,
  create: () => ({
    id: genId("blk"),
    type: "fill_blank",
    stem: "",
    marks: 1,
    required: true,
    blanks: [],
  }),
  Body: ({ block }) => (
    <MathText className="font-serif text-ink" blankPlaceholder>
      {block.stem || "Sentence with a {{blank}}…"}
    </MathText>
  ),
  Settings: ({ block, update }) => (
    <div className="space-y-4">
      <StemField
        block={block}
        update={update}
        placeholder="The capital of France is {{blank}}."
      />
      <BlanksEditor block={block} update={update} />
      <ToggleRow
        label="Required"
        description="Students must answer to submit."
        checked={block.required}
        onChange={(required) => update({ required })}
      />
      <MarksField block={block} update={update} />
    </div>
  ),
};

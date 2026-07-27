"use client";

import { GripVertical, Plus, Trash2 } from "lucide-react";
import type { Block, Option } from "@/modules/exam";
import { genId } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** A labelled settings row: label on top, control below, with optional hint. */
export function SettingRow({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs font-medium text-ink-2">
        {label}
      </Label>
      {children}
      {hint ? <p className="text-xs text-ink-3">{hint}</p> : null}
    </div>
  );
}

/** An inline toggle row: label + description on the left, switch on the right. */
export function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3">
      <span className="space-y-0.5">
        <span className="block text-sm text-ink">{label}</span>
        {description ? (
          <span className="block text-xs text-ink-3">{description}</span>
        ) : null}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

export function StemField({
  block,
  update,
  label = "Question",
  placeholder = "Type the question. Use $…$ for maths.",
}: {
  block: Block;
  update: (patch: Partial<Block>) => void;
  label?: string;
  placeholder?: string;
}) {
  return (
    <SettingRow label={label} htmlFor="stem" hint="LaTeX inside $…$ renders live.">
      <Textarea
        id="stem"
        value={block.stem}
        onChange={(e) => update({ stem: e.target.value })}
        placeholder={placeholder}
        rows={4}
        className="font-serif"
      />
    </SettingRow>
  );
}

export function MarksField({
  block,
  update,
}: {
  block: Block;
  update: (patch: Partial<Block>) => void;
}) {
  return (
    <SettingRow label="Marks" htmlFor="marks">
      <Input
        id="marks"
        type="number"
        min={0}
        step={0.5}
        value={block.marks}
        onChange={(e) => update({ marks: Number(e.target.value) })}
        className="w-28 font-mono tabular"
      />
    </SettingRow>
  );
}

export function RequiredToggle({
  block,
  update,
}: {
  block: Block;
  update: (patch: Partial<Block>) => void;
}) {
  return (
    <ToggleRow
      label="Required"
      description="Students must answer to submit."
      checked={block.required}
      onChange={(required) => update({ required })}
    />
  );
}

/**
 * Options editor for mcq / multi_select. Correctness is a per-option flag —
 * never a position (AGENTS §3.1). `single` enforces one correct option.
 * `keepLast` marks "All/None of the above" so shuffle leaves it in place.
 */
export function OptionsEditor({
  block,
  update,
  single,
}: {
  block: Block;
  update: (patch: Partial<Block>) => void;
  single: boolean;
}) {
  const options = block.options ?? [];

  function setOptions(next: Option[]) {
    update({ options: next });
  }
  function patchOption(id: string, patch: Partial<Option>) {
    setOptions(options.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  }
  function addOption() {
    setOptions([
      ...options,
      { id: genId("opt"), text: "", isCorrect: false },
    ]);
  }
  function removeOption(id: string) {
    setOptions(options.filter((o) => o.id !== id));
  }
  function markCorrect(id: string) {
    if (single) {
      setOptions(options.map((o) => ({ ...o, isCorrect: o.id === id })));
    } else {
      const o = options.find((x) => x.id === id);
      patchOption(id, { isCorrect: !o?.isCorrect });
    }
  }

  return (
    <SettingRow
      label="Options"
      hint={
        single
          ? "Select the one correct answer."
          : "Select every correct answer."
      }
    >
      <div className="space-y-1.5">
        {options.map((o) => (
          <div key={o.id} className="flex items-start gap-1.5">
            <GripVertical
              className="mt-2 size-3.5 shrink-0 cursor-grab text-ink-3"
              aria-hidden
            />
            <button
              type="button"
              role={single ? "radio" : "checkbox"}
              aria-checked={o.isCorrect}
              aria-label={o.isCorrect ? "Correct answer" : "Mark correct"}
              onClick={() => markCorrect(o.id)}
              className={cn(
                "mt-1.5 flex size-4 shrink-0 items-center justify-center border outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
                single ? "rounded-full" : "rounded-sm",
                o.isCorrect
                  ? "border-ok bg-ok text-white"
                  : "border-rule-strong bg-surface",
              )}
            >
              {o.isCorrect ? (
                <span
                  className={cn(single ? "size-1.5 rounded-full bg-white" : "")}
                >
                  {!single ? "✓" : ""}
                </span>
              ) : null}
            </button>
            <Input
              value={o.text}
              onChange={(e) => patchOption(o.id, { text: e.target.value })}
              placeholder="Option text ($…$ for maths)"
              className="h-8 font-serif"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Remove option"
              onClick={() => removeOption(o.id)}
              className="text-ink-3 hover:text-danger"
            >
              <Trash2 />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addOption}
          className="w-full"
        >
          <Plus />
          Add option
        </Button>
      </div>
    </SettingRow>
  );
}

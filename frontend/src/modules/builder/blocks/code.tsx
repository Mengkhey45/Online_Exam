"use client";

import { Code2 } from "lucide-react";
import type { BlockDef } from "./def";
import { MathText } from "@/lib/math/katex";
import { genId } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MarksField, RequiredToggle, SettingRow, StemField } from "./fields";

const LANGUAGES = [
  "python",
  "javascript",
  "typescript",
  "java",
  "c",
  "cpp",
  "sql",
] as const;

/** Code question — the runtime uses CodeMirror; the builder configures it. */
export const codeDef: BlockDef = {
  type: "code",
  label: "Code",
  group: "written",
  icon: Code2,
  scored: true,
  create: () => ({
    id: genId("blk"),
    type: "code",
    stem: "",
    marks: 10,
    required: true,
    language: "python",
  }),
  Body: ({ block }) => (
    <div className="space-y-2">
      <MathText className="font-serif text-ink">
        {block.stem || "Untitled question"}
      </MathText>
      <div className="flex h-16 items-start rounded-md border border-dashed border-rule-strong bg-surface-sunk px-2 py-1.5 font-mono text-xs text-ink-3">
        {block.language ?? "python"} · code editor
      </div>
    </div>
  ),
  Settings: ({ block, update }) => (
    <div className="space-y-4">
      <StemField block={block} update={update} />
      <SettingRow label="Language">
        <Select
          value={block.language ?? "python"}
          onValueChange={(v) => update({ language: String(v) })}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((l) => (
              <SelectItem key={l} value={l}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>
      <MarksField block={block} update={update} />
      <RequiredToggle block={block} update={update} />
    </div>
  ),
};

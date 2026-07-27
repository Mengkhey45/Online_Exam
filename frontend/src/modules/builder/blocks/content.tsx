"use client";

import { AlignLeft } from "lucide-react";
import type { BlockDef } from "./def";
import { MathText } from "@/lib/math/katex";
import { genId } from "@/lib/utils";
import { StemField } from "./fields";

/**
 * Content block — a passage or instructions, not a question. Contributes no
 * marks and is skipped by the question counter.
 */
export const contentDef: BlockDef = {
  type: "content",
  label: "Content",
  group: "structure",
  icon: AlignLeft,
  scored: false,
  create: () => ({
    id: genId("blk"),
    type: "content",
    stem: "",
    marks: 0,
    required: false,
  }),
  Body: ({ block }) =>
    block.stem ? (
      <MathText className="font-serif text-ink-2">{block.stem}</MathText>
    ) : (
      <span className="text-sm text-ink-3">Passage or instructions…</span>
    ),
  Settings: ({ block, update }) => (
    <StemField
      block={block}
      update={update}
      label="Content"
      placeholder="Passage, context, or instructions students read but don’t answer."
    />
  ),
};

"use client";

import { Upload } from "lucide-react";
import type { BlockDef } from "./def";
import { MathText } from "@/lib/math/katex";
import { genId } from "@/lib/utils";
import { MarksField, RequiredToggle, StemField } from "./fields";

/** File upload — the student attaches a file; graded by a teacher. */
export const fileUploadDef: BlockDef = {
  type: "file_upload",
  label: "File upload",
  group: "written",
  icon: Upload,
  scored: true,
  create: () => ({
    id: genId("blk"),
    type: "file_upload",
    stem: "",
    marks: 5,
    required: true,
  }),
  Body: ({ block }) => (
    <div className="space-y-2">
      <MathText className="font-serif text-ink">
        {block.stem || "Untitled question"}
      </MathText>
      <div className="flex h-12 items-center justify-center gap-2 rounded-md border border-dashed border-rule-strong bg-surface-sunk text-xs text-ink-3">
        <Upload className="size-3.5" aria-hidden />
        Students attach a file
      </div>
    </div>
  ),
  Settings: ({ block, update }) => (
    <div className="space-y-4">
      <StemField block={block} update={update} />
      <MarksField block={block} update={update} />
      <RequiredToggle block={block} update={update} />
    </div>
  ),
};

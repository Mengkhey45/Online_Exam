"use client";

import { Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { RuntimeRenderer } from "./types";

/** Short answer — one line. Stored in answer.text. */
export const ShortAnswerRuntime: RuntimeRenderer = ({ block, answer, onChange }) => (
  <div className="space-y-1.5">
    <Input
      value={answer?.text ?? ""}
      maxLength={block.charLimit}
      onChange={(e) => onChange({ text: e.target.value })}
      placeholder="Your answer"
      aria-label="Your answer"
      className="font-serif"
    />
    <CharCount value={answer?.text ?? ""} limit={block.charLimit} />
  </div>
);

/** Long answer — extended response with a live character count. */
export const LongAnswerRuntime: RuntimeRenderer = ({ block, answer, onChange }) => (
  <div className="space-y-1.5">
    <Textarea
      value={answer?.text ?? ""}
      maxLength={block.charLimit}
      onChange={(e) => onChange({ text: e.target.value })}
      placeholder="Write your answer"
      aria-label="Your answer"
      rows={10}
      className="font-serif text-base leading-relaxed"
    />
    <CharCount value={answer?.text ?? ""} limit={block.charLimit} />
  </div>
);

/**
 * Code answer. AGENTS §2 specifies CodeMirror 6 for the full editor; this is a
 * mono textarea placeholder until that is wired in. Answer text is stored the
 * same way, so swapping the editor later is isolated to this file.
 */
export const CodeRuntime: RuntimeRenderer = ({ block, answer, onChange }) => (
  <div className="overflow-hidden rounded-lg border border-rule">
    <div className="flex items-center justify-between border-b border-rule bg-surface-sunk px-3 py-1.5">
      <span className="font-mono text-xs text-ink-3">{block.language ?? "text"}</span>
    </div>
    <Textarea
      value={answer?.text ?? ""}
      onChange={(e) => onChange({ text: e.target.value })}
      placeholder={`# Write your ${block.language ?? ""} solution`}
      aria-label="Code answer"
      rows={14}
      spellCheck={false}
      className="rounded-none border-0 font-mono text-sm leading-relaxed focus-visible:ring-0"
    />
  </div>
);

/** File upload. Stores a reference in answer.fileUrl (mock stores the name). */
export const FileUploadRuntime: RuntimeRenderer = ({ answer, onChange }) => {
  const has = Boolean(answer?.fileUrl);
  return (
    <label
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center transition-colors",
        has ? "border-ok bg-ok-soft" : "border-rule-strong hover:bg-surface-sunk/50",
      )}
    >
      <Upload className={cn("size-5", has ? "text-ok" : "text-ink-3")} aria-hidden />
      <span className="text-sm text-ink-2">
        {has ? answer?.fileUrl : "Choose a file to attach"}
      </span>
      <input
        type="file"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onChange({ fileUrl: f.name });
        }}
      />
    </label>
  );
};

function CharCount({ value, limit }: { value: string; limit?: number }) {
  if (!limit) return null;
  return (
    <p className="text-right font-mono text-xs text-ink-3 tabular">
      {value.length}/{limit}
    </p>
  );
}

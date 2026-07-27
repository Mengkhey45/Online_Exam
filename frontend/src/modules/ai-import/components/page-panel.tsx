"use client";

import { FileText } from "lucide-react";
import type { SourcePage } from "../schema";

/**
 * The original page (AGENTS §7, left side). A facsimile of the source text for
 * now; react-pdf (§2) will render the real PDF page here later. The reviewer
 * checks the conversion against this, so it stays visible (sticky) alongside.
 */
export function PagePanel({ page }: { page: SourcePage | undefined }) {
  return (
    <div className="lg:sticky lg:top-4 h-fit">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-ink-3">
        <FileText className="size-3.5" aria-hidden />
        Original {page ? `· ${page.label}` : ""}
      </div>
      <div className="min-h-[28rem] rounded-lg border border-rule bg-surface p-6 shadow-[var(--shadow-pop)]">
        {page ? (
          <pre className="whitespace-pre-wrap font-serif text-sm leading-relaxed text-ink-2">
            {page.lines.join("\n")}
          </pre>
        ) : (
          <p className="text-sm text-ink-3">Select a block to see its page.</p>
        )}
      </div>
    </div>
  );
}

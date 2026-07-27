"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { UploadCloud, Loader2 } from "lucide-react";
import { useStartPdfImport, importKeys } from "../queries";

/**
 * Upload a source PDF to convert (AGENTS §8). Shown on the review screen when
 * the exam has no conversion yet. After upload the worker converts pages in the
 * background; the screen polls until they're ready to review (rule 3.6 —
 * nothing is added to the exam without a human reviewing it first).
 */
export function ImportStarter({ examId }: { examId: string }) {
  const queryClient = useQueryClient();
  const start = useStartPdfImport(examId);

  async function onFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Upload a PDF file.");
      return;
    }
    try {
      await start.mutateAsync(file);
      // Refetch so the screen switches to the processing state.
      await queryClient.invalidateQueries({
        queryKey: importKeys.detail(examId),
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn’t start the import.");
    }
  }

  const pending = start.isPending;

  return (
    <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-rule-strong bg-surface px-6 py-16 text-center transition-colors hover:bg-surface-sunk/40">
      <span className="flex size-11 items-center justify-center rounded-full bg-accent-soft text-accent">
        {pending ? (
          <Loader2 className="size-5 animate-spin" aria-hidden />
        ) : (
          <UploadCloud className="size-5" aria-hidden />
        )}
      </span>
      <span className="space-y-1">
        <span className="block text-sm font-medium text-ink">
          {pending ? "Uploading…" : "Upload a question paper (PDF)"}
        </span>
        <span className="block max-w-sm text-sm text-ink-2">
          We’ll convert each page into editable questions for you to review. The
          original numbers are checked against the conversion.
        </span>
      </span>
      <input
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        disabled={pending}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
    </label>
  );
}

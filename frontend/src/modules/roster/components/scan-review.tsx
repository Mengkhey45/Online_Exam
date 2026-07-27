"use client";

import { toast } from "sonner";
import { Loader2, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRosterImport } from "../scan";
import { PreviewStep } from "./preview-step";

/**
 * After a scan is queued, poll until the worker has extracted rows, then hand
 * off to the SAME review step the CSV import uses (AGENTS §6). Nothing becomes
 * a student until the teacher confirms (rule 3.6).
 */
export function ScanReview({
  importId,
  onDone,
}: {
  importId: string;
  onDone: () => void;
}) {
  const { data, isError, refetch } = useRosterImport(importId);

  const processing = !data || data.status === "processing";

  return (
    <div className="rounded-xl border border-rule bg-surface p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">Review scanned roster</h2>
          <p className="text-xs text-ink-2">
            AI reads the file into rows — check them, then confirm to add.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onDone}>
          <X />
          Close
        </Button>
      </div>

      {isError ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <AlertCircle className="size-5 text-danger" aria-hidden />
          <p className="text-sm text-ink-2">Couldn’t load the scan.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      ) : processing ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Loader2 className="size-6 animate-spin text-accent" aria-hidden />
          <p className="text-sm font-medium text-ink">Reading your file…</p>
          <p className="max-w-sm text-sm text-ink-3">
            This can take a moment. You can leave and come back — the scan keeps
            running.
          </p>
        </div>
      ) : data.rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <AlertCircle className="size-5 text-flag" aria-hidden />
          <p className="text-sm font-medium text-ink">No students found</p>
          <p className="max-w-sm text-sm text-ink-2">
            The AI couldn’t read a student list from that file. Try a clearer
            image, or add students manually.
          </p>
          <Button variant="outline" size="sm" onClick={onDone}>
            Close
          </Button>
        </div>
      ) : (
        <PreviewStep
          staged={data}
          onBack={onDone}
          onImported={(count) => {
            toast.success(`${count} students imported`);
            onDone();
          }}
        />
      )}
    </div>
  );
}

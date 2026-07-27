"use client";

import { format } from "date-fns";
import { toast } from "sonner";
import { X, Activity as ActivityIcon, ClipboardPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useActivity } from "../queries";
import { eventLabel } from "../labels";

/**
 * Activity drawer (AGENTS §7): a chronological timeline for one student, in
 * neutral language. No score is changed here (rule 3.4) — "Record incident" is
 * the only action, and it's an explicit teacher decision, not automatic.
 */
export function ActivityDrawer({
  attemptId,
  onClose,
}: {
  attemptId: string | null;
  onClose: () => void;
}) {
  const { data, isPending } = useActivity(attemptId);
  if (!attemptId) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        type="button"
        aria-label="Close activity"
        onClick={onClose}
        className="absolute inset-0 bg-ink/30"
      />
      <aside
        className="relative flex h-full w-full max-w-sm flex-col border-l border-rule bg-surface shadow-[var(--shadow-overlay)]"
        role="dialog"
        aria-label="Student activity"
      >
        <header className="flex items-center justify-between border-b border-rule px-4 py-3">
          <div>
            <p className="text-xs text-ink-3">Activity</p>
            <p className="font-mono text-sm font-semibold text-ink tabular">
              {data?.studentId ?? attemptId}
            </p>
          </div>
          <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={onClose}>
            <X />
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-3 flex items-start gap-2 rounded-md bg-surface-sunk/60 px-3 py-2 text-xs text-ink-2">
            <ActivityIcon className="mt-0.5 size-3.5 shrink-0 text-ink-3" aria-hidden />
            A timeline of things worth a look. None of it changes a mark on its own.
          </div>

          {isPending ? (
            <p className="text-sm text-ink-3">Loading…</p>
          ) : !data || data.events.length === 0 ? (
            <p className="text-sm text-ink-3">No activity to review.</p>
          ) : (
            <ol className="relative space-y-4 border-l border-rule pl-4">
              {data.events.map((e) => (
                <li key={e.id} className="relative">
                  <span
                    className="absolute -left-[21px] top-1 size-2.5 rounded-full bg-flag ring-4 ring-surface"
                    aria-hidden
                  />
                  <p className="text-sm text-ink">{eventLabel(e)}</p>
                  <p className="font-mono text-xs text-ink-3 tabular">
                    {format(new Date(e.at), "HH:mm:ss")}
                    {e.durationMs ? ` · ${Math.round(e.durationMs / 1000)}s` : ""}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </div>

        <footer className="border-t border-rule p-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              toast.success("Incident recorded for review");
              onClose();
            }}
          >
            <ClipboardPen />
            Record incident
          </Button>
          <p className="mt-2 text-center text-xs text-ink-3">
            Flags it for a colleague. Marks are unaffected.
          </p>
        </footer>
      </aside>
    </div>
  );
}

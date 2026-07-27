import { AlertCircle, FolderPlus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { NewGroupDialog } from "./new-group-dialog";

/** Loading skeleton mirroring the group-card / table layout (AGENTS §8). */
export function DashboardSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading exams">
      {[0, 1].map((g) => (
        <div key={g} className="rounded-xl border border-rule bg-surface">
          <div className="flex items-center gap-2 px-3 py-2.5">
            <Skeleton className="size-4 rounded-sm" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="border-t border-rule px-3 py-2">
            {[0, 1, 2].map((r) => (
              <div key={r} className="flex items-center gap-4 py-2.5">
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="ml-auto h-5 w-20 rounded-sm" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Whole-dashboard empty state — invites the first action (AGENTS §8). */
export function DashboardEmpty() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-rule-strong bg-surface px-6 py-16 text-center">
      <div className="flex size-11 items-center justify-center rounded-full bg-accent-soft text-accent">
        <FolderPlus className="size-5" aria-hidden />
      </div>
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-ink">
          Create your first exam
        </h2>
        <p className="max-w-sm text-sm text-ink-2">
          Group your exams by course or cohort, then build questions, configure
          security, and share a key with students.
        </p>
      </div>
      <NewGroupDialog
        trigger={
          <Button>
            <FolderPlus />
            New exam group
          </Button>
        }
      />
    </div>
  );
}

/** Error state — states what happened and offers the fix (AGENTS §8). */
export function DashboardError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-4 rounded-xl border border-danger/30 bg-danger-soft px-6 py-14 text-center"
    >
      <div className="flex size-11 items-center justify-center rounded-full bg-surface text-danger ring-1 ring-danger/20">
        <AlertCircle className="size-5" aria-hidden />
      </div>
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-ink">
          Couldn’t load your exams
        </h2>
        <p className="max-w-sm text-sm text-ink-2">{message}</p>
      </div>
      <Button variant="outline" onClick={onRetry}>
        <RefreshCw />
        Try again
      </Button>
    </div>
  );
}

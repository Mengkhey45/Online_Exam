"use client";

import { useMemo, useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { ApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMonitoring, useUnlockAttempt } from "../queries";
import type { MonitoredStudent } from "../schema";
import { SummaryStrip, type MonitorFilter } from "./summary-strip";
import { UnlockQueue } from "./unlock-queue";
import { StudentTable } from "./student-table";
import { ActivityDrawer } from "./activity-drawer";

/** Live monitoring (AGENTS §7). Anonymised IDs, neutral language throughout. */
export function MonitoringView({ examId }: { examId: string }) {
  const { data, isPending, isError, error, refetch } = useMonitoring(examId);
  const unlock = useUnlockAttempt(examId);
  const [filter, setFilter] = useState<MonitorFilter>("all");
  const [openAttempt, setOpenAttempt] = useState<string | null>(null);

  const filtered = useMemo(
    () => (data ? applyFilter(data.students, filter) : []),
    [data, filter],
  );

  if (isPending) return <MonitoringSkeleton />;
  if (isError) {
    return (
      <div className="mx-auto mt-24 flex max-w-md flex-col items-center gap-4 text-center">
        <div className="flex size-11 items-center justify-center rounded-full bg-danger-soft text-danger">
          <AlertCircle className="size-5" aria-hidden />
        </div>
        <p className="text-sm text-ink-2">
          {error instanceof ApiError ? error.message : "Couldn’t load monitoring."}
        </p>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw />
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-6">
      <header className="mb-5">
        <h1 className="text-xl font-semibold tracking-tight text-ink">
          Monitoring
        </h1>
        <p className="mt-0.5 text-sm text-ink-2">
          {data.examTitle} · live. Students are shown by ID only while the exam is
          in progress.
        </p>
      </header>

      <div className="mb-5">
        <SummaryStrip students={data.students} active={filter} onChange={setFilter} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <StudentTable students={filtered} onOpen={setOpenAttempt} />
        <UnlockQueue
          requests={data.unlockQueue}
          onUnlock={(id) => unlock.mutate(id)}
          unlockingId={unlock.isPending ? unlock.variables : undefined}
        />
      </div>

      <ActivityDrawer attemptId={openAttempt} onClose={() => setOpenAttempt(null)} />
    </div>
  );
}

function applyFilter(
  students: MonitoredStudent[],
  filter: MonitorFilter,
): MonitoredStudent[] {
  switch (filter) {
    case "in_progress":
      return students.filter((s) => s.status === "in_progress");
    case "submitted":
      return students.filter((s) => s.status === "submitted");
    case "needs_unlock":
      return students.filter((s) => s.status === "locked");
    case "flags":
      return students.filter((s) => s.flagCount > 0);
    default:
      return students;
  }
}

function MonitoringSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 px-6 py-6" aria-busy="true">
      <Skeleton className="h-12 w-72" />
      <div className="grid grid-cols-5 gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

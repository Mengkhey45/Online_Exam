"use client";

import { useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { ApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { useSitting } from "../queries";
import { RuntimeProvider, useRuntime } from "../store";
import { useLockout } from "../hooks/use-lockout";
import { useProctoring } from "../hooks/use-proctoring";
import { RuntimeTopbar } from "./runtime-topbar";
import { AnswerRail } from "./answer-rail";
import { QuestionPane } from "./question-pane";
import { SubmitDialog } from "./submit-dialog";
import { LockoutOverlay } from "./lockout-overlay";

/**
 * Student runtime (AGENTS §7, the critical screen). Fully client-side — never
 * server-rendered (§8). The whole exam loads once, then everything is local.
 */
export function RuntimeView({ attemptId }: { attemptId: string }) {
  const { data: sitting, isPending, isError, error, refetch } =
    useSitting(attemptId);

  if (isPending) return <RuntimeLoading />;

  if (isError) {
    return (
      <div className="flex h-svh flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="flex size-11 items-center justify-center rounded-full bg-danger-soft text-danger">
          <AlertCircle className="size-5" aria-hidden />
        </div>
        <div className="space-y-1">
          <h1 className="text-base font-semibold text-ink">Couldn’t load your exam</h1>
          <p className="max-w-sm text-sm text-ink-2">
            {error instanceof ApiError
              ? error.message
              : "Something went wrong. Try again."}
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw />
          Try again
        </Button>
      </div>
    );
  }

  return (
    <RuntimeProvider attemptId={attemptId} sitting={sitting}>
      <RuntimeShell attemptId={attemptId} />
    </RuntimeProvider>
  );
}

function RuntimeShell({ attemptId }: { attemptId: string }) {
  const { sitting } = useRuntime();
  const [submitOpen, setSubmitOpen] = useState(false);
  const { lock, clear } = useLockout(sitting.exam.security === "medium");

  // Record proctoring telemetry for supervised exams (rule 3.4 — evidence only).
  useProctoring(attemptId, sitting.exam.security !== "low");

  return (
    <div className="flex h-svh flex-col overflow-hidden bg-paper">
      <RuntimeTopbar onSubmit={() => setSubmitOpen(true)} />
      <div className="flex min-h-0 flex-1">
        <AnswerRail />
        <main className="min-w-0 flex-1 overflow-y-auto">
          <QuestionPane />
        </main>
      </div>

      <SubmitDialog open={submitOpen} onOpenChange={setSubmitOpen} />

      {lock ? (
        <LockoutOverlay reason={lock.reason} onResume={() => clear()} />
      ) : null}
    </div>
  );
}

function RuntimeLoading() {
  return (
    <div
      className="flex h-svh items-center justify-center bg-paper"
      aria-busy="true"
    >
      <div className="flex items-center gap-2 text-sm text-ink-3">
        <RefreshCw className="size-4 motion-safe:animate-spin" aria-hidden />
        Loading your exam…
      </div>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
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
import { FullscreenGate } from "./fullscreen-gate";

/**
 * Student runtime (AGENTS §7, the critical screen). Fully client-side — never
 * server-rendered (§8). The whole exam loads once, then everything is local.
 */
export function RuntimeView({ attemptId }: { attemptId: string }) {
  const [submitted, setSubmitted] = useState(false);
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

  if (submitted || sitting.attempt.status === "submitted") {
    return <CompletionScreen title={sitting.exam.title} />;
  }

  return (
    <RuntimeProvider attemptId={attemptId} sitting={sitting}>
      <RuntimeShell
        attemptId={attemptId}
        onSubmitted={() => setSubmitted(true)}
      />
    </RuntimeProvider>
  );
}

function RuntimeShell({
  attemptId,
  onSubmitted,
}: {
  attemptId: string;
  onSubmitted: () => void;
}) {
  const { sitting } = useRuntime();
  const [submitOpen, setSubmitOpen] = useState(false);
  const { lock, clear, lockNow } = useLockout(
    sitting.exam.security === "medium" || sitting.exam.security === "high",
    attemptId,
    sitting.attempt.status === "locked",
    sitting.exam.security === "high",
  );

  // Record proctoring telemetry for supervised exams (rule 3.4 — evidence only).
  useProctoring(
    attemptId,
    sitting.exam.security !== "low",
    sitting.exam.security === "high",
  );

  return (
    <FullscreenGate
      key={sitting.attempt.status}
      security={sitting.exam.security}
      locked={sitting.exam.security === "high" && sitting.attempt.status === "locked"}
      onExit={
        sitting.exam.security === "high"
          ? () => lockNow("Fullscreen was exited. Waiting for teacher unlock.")
          : undefined
      }
    >
      <div className="flex h-svh flex-col overflow-hidden bg-paper">
        <RuntimeTopbar onSubmit={() => setSubmitOpen(true)} />
        <div className="flex min-h-0 flex-1">
          <AnswerRail />
          <main className="min-w-0 flex-1 overflow-y-auto">
            <QuestionPane />
          </main>
        </div>

        <SubmitDialog
          open={submitOpen}
          onOpenChange={setSubmitOpen}
          attemptId={attemptId}
          onSubmitted={onSubmitted}
        />

        {lock ? (
          <LockoutOverlay reason={lock.reason} onResume={() => clear()} />
        ) : null}
      </div>
    </FullscreenGate>
  );
}

function CompletionScreen({ title }: { title: string }) {
  const router = useRouter();

  return (
    <main className="flex min-h-svh items-center justify-center bg-paper px-6 py-10">
      <section className="w-full max-w-md space-y-6 rounded-lg border border-rule bg-surface p-8 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-accent-soft text-accent">
          <span className="text-xl" aria-hidden>
            ✓
          </span>
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-ink">Congratulations!</h1>
          <p className="text-sm leading-6 text-ink-2">
            You have finished {title}.
          </p>
        </div>
        <Button className="w-full" onClick={() => router.push("/enter")}>
          Return to exam entry
        </Button>
      </section>
    </main>
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

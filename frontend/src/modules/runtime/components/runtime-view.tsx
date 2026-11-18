"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { ApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import type { Attempt } from "@/modules/exam";
import { sendLockNote, useAttemptStatus, useSitting } from "../queries";
import { RuntimeProvider, useRuntime } from "../store";
import { useLockout } from "../hooks/use-lockout";
import { useProctoring } from "../hooks/use-proctoring";
import { useTimeUp } from "../hooks/use-time-up";
import { RuntimeTopbar } from "./runtime-topbar";
import { AnswerRail } from "./answer-rail";
import { QuestionPane } from "./question-pane";
import { SubmitDialog } from "./submit-dialog";
import { LockoutOverlay } from "./lockout-overlay";
import { FullscreenGate } from "./fullscreen-gate";
import { TimeUpScreen } from "./time-up-screen";

type Finish = "submitted" | "time_up";

/**
 * Student runtime (AGENTS §7, the critical screen). Fully client-side — never
 * server-rendered (§8). The whole exam loads once, then everything is local;
 * only a small status check runs in the background (lock / unlock / time up).
 */
export function RuntimeView({ attemptId }: { attemptId: string }) {
  const [finished, setFinished] = useState<Finish | null>(null);
  const { data: sitting, isPending, error, refetch } = useSitting(attemptId);
  const { data: liveStatus } = useAttemptStatus(
    attemptId,
    Boolean(sitting) && finished === null,
  );

  if (isPending) return <RuntimeLoading />;

  // Only a failed FIRST load shows an error. Once the exam is on screen, it
  // stays on screen whatever the network does (rule 3.2).
  if (!sitting) {
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

  const status: Attempt["status"] = liveStatus?.status ?? sitting.attempt.status;

  if (finished || status === "submitted") {
    return (
      <CompletionScreen
        title={sitting.exam.title}
        timeUp={finished === "time_up"}
      />
    );
  }

  return (
    <RuntimeProvider attemptId={attemptId} sitting={sitting}>
      <RuntimeShell
        key={status}
        attemptId={attemptId}
        status={status}
        onFinished={setFinished}
      />
    </RuntimeProvider>
  );
}

function RuntimeShell({
  attemptId,
  status,
  onFinished,
}: {
  attemptId: string;
  status: Attempt["status"];
  onFinished: (how: Finish) => void;
}) {
  const { sitting } = useRuntime();
  const security = sitting.exam.security;
  const supervised = security === "medium" || security === "high";
  // High security pauses on the server until a teacher unlocks; medium pauses
  // locally and the student resumes after a short hold.
  const serverPause = security === "high";
  const [submitOpen, setSubmitOpen] = useState(false);
  const timeUp = useTimeUp(sitting.attempt.expiresAt);
  const { lock, clear, lockNow } = useLockout(supervised, attemptId, serverPause);

  // Record proctoring telemetry for supervised exams (rule 3.4 — evidence only).
  useProctoring(attemptId, security !== "low", security === "high");

  const onTimeUpSubmitted = useCallback(() => onFinished("time_up"), [onFinished]);
  const onExit = useCallback(
    () => lockNow("Fullscreen was exited. Waiting for teacher unlock."),
    [lockNow],
  );

  // Time up takes over everything — even a paused or fullscreen-gated sitting.
  if (timeUp) {
    return <TimeUpScreen attemptId={attemptId} onSubmitted={onTimeUpSubmitted} />;
  }

  return (
    <FullscreenGate
      security={security}
      locked={serverPause && (status === "locked" || lock !== null)}
      onExit={serverPause ? onExit : undefined}
      onSendNote={serverPause ? (note) => sendLockNote(attemptId, note) : undefined}
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
          onSubmitted={() => onFinished("submitted")}
        />

        {lock && !serverPause ? (
          <LockoutOverlay reason={lock.reason} onResume={() => clear()} />
        ) : null}
      </div>
    </FullscreenGate>
  );
}

function CompletionScreen({ title, timeUp }: { title: string; timeUp: boolean }) {
  const router = useRouter();

  return (
    <main className="flex min-h-svh items-center justify-center bg-paper px-6 py-10">
      <section className="w-full max-w-md space-y-6 rounded-lg border border-rule bg-surface p-8 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-accent-soft text-accent">
          <CheckCircle2 className="size-5" aria-hidden />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-ink">Exam submitted</h1>
          <p className="text-sm leading-6 text-ink-2">
            {timeUp
              ? `Time ran out, so your answers for ${title} were submitted automatically.`
              : `Your answers for ${title} have been submitted.`}
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

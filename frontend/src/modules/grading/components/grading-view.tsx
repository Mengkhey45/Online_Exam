"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AlertCircle, RefreshCw, Send, CheckCircle2 } from "lucide-react";
import { ApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useGrading, useReleaseResults } from "../queries";
import { GradingProvider, useGradingStore } from "../store";
import { QuestionGrader } from "./question-grader";
import { StudentGrader } from "./student-grader";

type Mode = "question" | "student";

/** Grading screen (AGENTS §7). Two modes; release gated on full grading. */
export function GradingView({ examId }: { examId: string }) {
  const { data, isPending, isError, error, refetch } = useGrading(examId);

  if (isPending) return <GradingSkeleton />;
  if (isError) {
    return (
      <div className="mx-auto mt-24 flex max-w-md flex-col items-center gap-4 text-center">
        <div className="flex size-11 items-center justify-center rounded-full bg-danger-soft text-danger">
          <AlertCircle className="size-5" aria-hidden />
        </div>
        <p className="text-sm text-ink-2">
          {error instanceof ApiError ? error.message : "Couldn’t load grading."}
        </p>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw />
          Try again
        </Button>
      </div>
    );
  }

  return (
    <GradingProvider initial={data}>
      <GradingInner examId={examId} />
    </GradingProvider>
  );
}

function GradingInner({ examId }: { examId: string }) {
  const { grading, fullyGraded, graded, totalResponses } = useGradingStore();
  const [mode, setMode] = useState<Mode>("question");
  const release = useReleaseResults(examId);

  return (
    <div className="pb-16">
      <div>
        <div className="mx-auto w-full max-w-5xl px-6 py-6">
          <header className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-ink">
                Grading
              </h1>
              <p className="mt-0.5 text-sm text-ink-2">
                {grading.title} · students shown by ID until results are released.
              </p>
            </div>
            <div className="inline-flex rounded-md border border-rule bg-surface p-0.5">
              <ModeButton active={mode === "question"} onClick={() => setMode("question")}>
                By question
              </ModeButton>
              <ModeButton active={mode === "student"} onClick={() => setMode("student")}>
                By student
              </ModeButton>
            </div>
          </header>

          {mode === "question" ? (
            <QuestionGrader />
          ) : (
            <StudentGrader />
          )}
        </div>
      </div>

      {/* Sticky totals footer (AGENTS §7). */}
      <footer className="fixed inset-x-0 bottom-0 z-20 flex items-center gap-4 border-t border-rule bg-surface/95 px-6 py-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-4">
        <span className="flex items-center gap-2 text-sm text-ink-2">
          <CheckCircle2
            className={cn("size-4", fullyGraded ? "text-ok" : "text-ink-3")}
            aria-hidden
          />
          <span className="font-mono tabular">
            {graded}/{totalResponses}
          </span>{" "}
          responses graded
        </span>

        <div className="ml-auto">
          {grading.released ? (
            <span className="text-sm font-medium text-ok">Results released</span>
          ) : fullyGraded ? (
            <Button
              onClick={() =>
                release.mutate(undefined, {
                  onSuccess: () => toast.success("Results released"),
                  onError: () => toast.error("Couldn’t release results."),
                })
              }
              disabled={release.isPending}
            >
              <Send />
              {release.isPending ? "Releasing…" : "Release results"}
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger
                render={
                  <span tabIndex={0} className="outline-none">
                    <Button disabled aria-disabled className="pointer-events-none">
                      <Send />
                      Release results
                    </Button>
                  </span>
                }
              />
              <TooltipContent>
                Grade every response before releasing.
              </TooltipContent>
            </Tooltip>
          )}
          </div>
        </div>
      </footer>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-[3px] px-3 py-1 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent/50",
        active ? "bg-accent-soft text-accent" : "text-ink-2 hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

function GradingSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 px-6 py-6" aria-busy="true">
      <Skeleton className="h-12 w-72" />
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

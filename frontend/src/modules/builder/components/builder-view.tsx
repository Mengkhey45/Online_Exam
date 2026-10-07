"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { ApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useExam } from "../queries";
import { BuilderProvider } from "../store";
import type { BuilderState } from "../types";
import { BuilderTopbar } from "./builder-topbar";
import { Palette } from "./palette";
import { Sheet } from "./sheet";
import { SettingsPanel } from "./settings-panel";

/** Exam builder screen (AGENTS §7): palette · sheet · settings. */
export function BuilderView({ examId }: { examId: string }) {
  const { data: exam, isPending, isError, error, refetch } = useExam(examId);

  if (isPending) return <BuilderLoading />;

  if (isError) {
    return (
      <div
        role="alert"
        className="mx-auto mt-24 flex max-w-md flex-col items-center gap-4 text-center"
      >
        <div className="flex size-11 items-center justify-center rounded-full bg-danger-soft text-danger">
          <AlertCircle className="size-5" aria-hidden />
        </div>
        <div className="space-y-1">
          <h1 className="text-base font-semibold text-ink">
            Couldn’t load this exam
          </h1>
          <p className="text-sm text-ink-2">
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

  const initial: BuilderState = {
    examId: exam.id,
    title: exam.title,
    status: exam.status,
    sections: exam.sections,
    selectedBlockId: null,
    selectedSectionId: null,
    dirty: false,
  };

  return (
    <BuilderProvider key={exam.versionId} initial={initial}>
      <div className="flex h-svh flex-col overflow-hidden bg-paper">
        <BuilderTopbar />
        <div className={`flex min-h-0 flex-1 ${exam.status === "published" ? "pointer-events-none select-none opacity-90" : ""}`}>
          <Palette />
          <div className="min-w-0 flex-1 overflow-y-auto">
            <Sheet />
          </div>
          <SettingsPanel />
        </div>
      </div>
    </BuilderProvider>
  );
}

function BuilderLoading() {
  return (
    <div className="flex h-svh flex-col" aria-busy="true">
      <div className="flex h-14 items-center gap-3 border-b border-rule bg-surface px-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-6 w-64" />
        <Skeleton className="ml-auto h-8 w-24" />
      </div>
      <div className="flex flex-1">
        <Skeleton className="h-full w-62 rounded-none" />
        <div className="flex-1 space-y-3 p-6">
          <Skeleton className="h-24 w-full max-w-3xl" />
          <Skeleton className="h-24 w-full max-w-3xl" />
        </div>
        <Skeleton className="h-full w-80 rounded-none" />
      </div>
    </div>
  );
}

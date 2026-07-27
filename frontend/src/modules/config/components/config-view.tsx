"use client";

import Link from "next/link";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AlertCircle, RefreshCw, Save } from "lucide-react";
import { ApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { examConfigSchema, type ExamConfig } from "../schema";
import { useExamConfig, useSaveConfig } from "../queries";
import { GeneralTab } from "./tabs/general-tab";
import { StudentInfoTab } from "./tabs/student-info-tab";
import { WorkspaceTab } from "./tabs/workspace-tab";
import { CheatPreventionTab } from "./tabs/cheat-prevention-tab";

/** Exam configuration screen (AGENTS §7): four tabs, one form. */
export function ConfigView({ examId }: { examId: string }) {
  const { data, isPending, isError, error, refetch } = useExamConfig(examId);

  if (isPending) return <ConfigLoading />;
  if (isError) {
    return (
      <div className="mx-auto mt-24 flex max-w-md flex-col items-center gap-4 text-center">
        <div className="flex size-11 items-center justify-center rounded-full bg-danger-soft text-danger">
          <AlertCircle className="size-5" aria-hidden />
        </div>
        <p className="text-sm text-ink-2">
          {error instanceof ApiError ? error.message : "Couldn’t load settings."}
        </p>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw />
          Try again
        </Button>
      </div>
    );
  }
  return <ConfigForm examId={examId} config={data} />;
}

function ConfigForm({ examId, config }: { examId: string; config: ExamConfig }) {
  const form = useForm<ExamConfig>({
    resolver: zodResolver(examConfigSchema),
    defaultValues: config,
    mode: "onBlur",
  });
  const save = useSaveConfig(examId);
  const {
    handleSubmit,
    reset,
    formState: { isDirty },
  } = form;

  const onSubmit = handleSubmit(async (values) => {
    try {
      await save.mutateAsync(values);
      reset(values); // clears the dirty state
      toast.success("Settings saved");
    } catch (e) {
      toast.error(
        e instanceof ApiError ? e.message : "Couldn’t save. Try again.",
      );
    }
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="flex h-svh flex-col bg-paper">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-rule bg-surface px-4">
          <Link
            href={`/builder/${examId}`}
            className="text-sm text-ink-3 hover:text-ink"
          >
            ← Builder
          </Link>
          <span className="h-6 w-px bg-rule" />
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold text-ink">
              {config.title}
            </h1>
            <p className="text-xs text-ink-3">Configuration</p>
          </div>
          <div className="ml-auto">
            <Button type="submit" size="sm" disabled={!isDirty || save.isPending}>
              <Save />
              {save.isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-2xl px-6 py-6">
            <Tabs defaultValue="general">
              <TabsList className="mb-6">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="student">Student information</TabsTrigger>
                <TabsTrigger value="workspace">Workspace</TabsTrigger>
                <TabsTrigger value="cheat">Cheat prevention</TabsTrigger>
              </TabsList>

              <TabsContent value="general">
                <GeneralTab />
              </TabsContent>
              <TabsContent value="student">
                <StudentInfoTab />
              </TabsContent>
              <TabsContent value="workspace">
                <WorkspaceTab />
              </TabsContent>
              <TabsContent value="cheat">
                <CheatPreventionTab />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}

function ConfigLoading() {
  return (
    <div className="flex h-svh flex-col" aria-busy="true">
      <div className="flex h-14 items-center gap-3 border-b border-rule bg-surface px-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-5 w-48" />
        <Skeleton className="ml-auto h-8 w-28" />
      </div>
      <div className="mx-auto w-full max-w-2xl space-y-4 px-6 py-8">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  RefreshCw,
  Send,
  TriangleAlert,
  FileX2,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { ApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Confidence } from "@/modules/exam";
import { useApplyConversion, useConversion } from "../queries";
import type { ConversionBlock } from "../schema";
import { PagePanel } from "./page-panel";
import { ConversionBlockCard } from "./conversion-block-card";
import { ImportStarter } from "./import-starter";

/** A page shell shared by the upload / processing / error states. */
function ImportShell({
  children,
  subtitle,
}: {
  children: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-6">
      <header className="mb-5">
        <h1 className="text-xl font-semibold tracking-tight text-ink">
          Import from PDF
        </h1>
        {subtitle ? (
          <p className="mt-0.5 text-sm text-ink-2">{subtitle}</p>
        ) : null}
      </header>
      {children}
    </div>
  );
}

const RANK: Record<Confidence, number> = { low: 0, medium: 1, high: 2 };

/** AI conversion review (AGENTS §7). Nothing applies until every block is reviewed. */
export function ImportView({ examId }: { examId: string }) {
  const { data, isPending, isError, error, refetch } = useConversion(examId);
  const apply = useApplyConversion(examId);

  const [reviewed, setReviewed] = useState<Record<string, boolean>>({});
  const [discarded, setDiscarded] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Seed reviewed state once data arrives.
  const seeded = useMemo(() => {
    if (!data) return {};
    return Object.fromEntries(data.blocks.map((b) => [b.id, b.reviewed]));
  }, [data]);
  const reviewedState = { ...seeded, ...reviewed };

  const pageById = useMemo(
    () => new Map((data?.pages ?? []).map((p) => [p.id, p])),
    [data],
  );

  // Group blocks by page; order pages and blocks low-confidence first (§7).
  const groups = useMemo(() => {
    if (!data) return [];
    const byPage = new Map<string, ConversionBlock[]>();
    for (const b of data.blocks) {
      const list = byPage.get(b.pageId) ?? [];
      list.push(b);
      byPage.set(b.pageId, list);
    }
    const arr = [...byPage.entries()].map(([pageId, blocks]) => ({
      pageId,
      blocks: [...blocks].sort((a, b) => RANK[a.confidence] - RANK[b.confidence]),
      minRank: Math.min(...blocks.map((b) => RANK[b.confidence])),
    }));
    return arr.sort((a, b) => a.minRank - b.minRank);
  }, [data]);

  if (isPending) return <ImportSkeleton />;

  // No conversion yet (404) — offer the upload dropzone.
  if (isError) {
    if (error instanceof ApiError && error.status === 404) {
      return (
        <ImportShell subtitle="Upload a question paper and we’ll turn it into editable questions.">
          <ImportStarter examId={examId} />
        </ImportShell>
      );
    }
    return (
      <div className="mx-auto mt-24 flex max-w-md flex-col items-center gap-4 text-center">
        <div className="flex size-11 items-center justify-center rounded-full bg-danger-soft text-danger">
          <AlertCircle className="size-5" aria-hidden />
        </div>
        <p className="text-sm text-ink-2">
          {error instanceof ApiError ? error.message : "Couldn’t load the conversion."}
        </p>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw />
          Try again
        </Button>
      </div>
    );
  }

  // The worker is still converting — poll (see useConversion) and show progress.
  if (data.status === "pending" || data.status === "processing") {
    const done = data.pagesDone ?? 0;
    const total = data.pageCount ?? 0;
    return (
      <ImportShell subtitle={data.title}>
        <div className="flex flex-col items-center gap-3 rounded-xl border border-rule bg-surface px-6 py-16 text-center">
          <Loader2 className="size-6 animate-spin text-accent" aria-hidden />
          <p className="text-sm font-medium text-ink">Converting your PDF…</p>
          <p className="font-mono text-sm text-ink-2 tabular">
            {total > 0 ? `${done}/${total} pages` : "Reading pages…"}
          </p>
          <p className="max-w-sm text-sm text-ink-3">
            You can leave this page — the conversion keeps running. Come back to
            review the questions.
          </p>
        </div>
      </ImportShell>
    );
  }

  // The conversion failed — let the teacher upload a different file.
  if (data.status === "failed") {
    return (
      <ImportShell subtitle="The conversion didn’t finish. You can upload the file again.">
        <ImportStarter examId={examId} />
      </ImportShell>
    );
  }

  const activeBlocks = data.blocks.filter((b) => !discarded.has(b.pageId));
  const reviewedCount = activeBlocks.filter((b) => reviewedState[b.id]).length;
  const allReviewed = activeBlocks.length > 0 && reviewedCount === activeBlocks.length;
  const mismatches = activeBlocks.filter((b) => b.numericMismatch).length;

  const selectedPage = selectedId
    ? pageById.get(data.blocks.find((b) => b.id === selectedId)?.pageId ?? "")
    : pageById.get(groups[0]?.pageId ?? "");

  function toggleDiscard(pageId: string) {
    setDiscarded((prev) => {
      const next = new Set(prev);
      if (next.has(pageId)) next.delete(pageId);
      else next.add(pageId);
      return next;
    });
  }

  return (
    <div className="pb-16">
      <div className="mx-auto w-full max-w-6xl px-6 py-6">
        <header className="mb-5">
          <h1 className="text-xl font-semibold tracking-tight text-ink">
            Review conversion
          </h1>
          <p className="mt-0.5 text-sm text-ink-2">
            {data.title}. Check each block against the original, then mark it
            reviewed. Nothing is added to the exam until you apply.
          </p>
        </header>

        {mismatches > 0 ? (
          <div
            className="mb-4 flex items-center gap-2 rounded-lg border border-flag/40 bg-flag-soft px-3 py-2 text-sm text-flag"
            role="alert"
          >
            <TriangleAlert className="size-4 shrink-0" aria-hidden />
            {mismatches} {mismatches === 1 ? "block has" : "blocks have"} numbers
            that don’t match the source. Check them before applying.
          </div>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-2">
          <PagePanel page={selectedPage} />

          <div className="space-y-5">
            {groups.map((g) => {
              const page = pageById.get(g.pageId);
              const isDiscarded = discarded.has(g.pageId);
              return (
                <div key={g.pageId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-wide text-ink-3">
                      {page?.label}
                    </span>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => toggleDiscard(g.pageId)}
                      className={isDiscarded ? "text-accent" : "text-ink-3"}
                    >
                      {isDiscarded ? (
                        <>
                          <RotateCcw />
                          Restore conversion
                        </>
                      ) : (
                        <>
                          <FileX2 />
                          Discard, keep PDF
                        </>
                      )}
                    </Button>
                  </div>

                  {isDiscarded ? (
                    <div className="rounded-lg border border-dashed border-rule-strong bg-surface-sunk/40 px-3 py-4 text-sm text-ink-3">
                      Conversion discarded. The original PDF page will be kept as
                      is.
                    </div>
                  ) : (
                    g.blocks.map((b) => (
                      <ConversionBlockCard
                        key={b.id}
                        block={b}
                        selected={selectedId === b.id}
                        reviewed={Boolean(reviewedState[b.id])}
                        onSelect={() => setSelectedId(b.id)}
                        onReviewedChange={(v) =>
                          setReviewed((prev) => ({ ...prev, [b.id]: v }))
                        }
                      />
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-rule bg-surface/95 px-6 py-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-4">
          <span className="font-mono text-sm text-ink-2 tabular">
            {reviewedCount}/{activeBlocks.length} reviewed
          </span>
          <div className="ml-auto">
            {allReviewed ? (
              <Button
                disabled={apply.isPending}
                onClick={() =>
                  apply.mutate(
                    {
                      reviewedBlockIds: activeBlocks.map((b) => b.id),
                      discardedPageIds: [...discarded],
                    },
                    {
                      onSuccess: () => toast.success("Conversion applied to the exam"),
                      onError: () => toast.error("Couldn’t apply the conversion."),
                    },
                  )
                }
              >
                <Send />
                {apply.isPending ? "Applying…" : "Apply to exam"}
              </Button>
            ) : (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span tabIndex={0} className="outline-none">
                      <Button disabled aria-disabled className="pointer-events-none">
                        <Send />
                        Apply to exam
                      </Button>
                    </span>
                  }
                />
                <TooltipContent>
                  Review every block before applying.
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

function ImportSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 px-6 py-6" aria-busy="true">
      <Skeleton className="h-12 w-80" />
      <div className="grid gap-5 lg:grid-cols-2">
        <Skeleton className="h-96" />
        <div className="space-y-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    </div>
  );
}

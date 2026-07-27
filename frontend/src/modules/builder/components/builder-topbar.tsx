"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, Settings2, Save, Send, TriangleAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ApiError } from "@/lib/api/errors";
import { getBlockDef } from "../blocks/registry";
import { useBuilder, useCounters } from "../store";
import { useSaveExam, usePublishExam } from "../queries";
import { PreviewDialog } from "./preview-dialog";

const AON_RE = /\b(all|none) of the above\b/i;

/** Top bar: title, live counters, and actions with publish gating (§7). */
export function BuilderTopbar() {
  const { state, dispatch } = useBuilder();
  const counters = useCounters();
  const router = useRouter();
  const save = useSaveExam(state.examId);
  const publish = usePublishExam(state.examId);
  const busy = save.isPending || publish.isPending;

  function saveDraft() {
    save.mutate(
      { title: state.title, sections: state.sections },
      {
        onSuccess: () => toast.success("Draft saved"),
        onError: () => toast.error("Couldn’t save the draft. Try again."),
      },
    );
  }

  async function publishExam() {
    try {
      // Persist the latest edits first, then publish what's saved.
      await save.mutateAsync({ title: state.title, sections: state.sections });
      await publish.mutateAsync();
      toast.success("Exam published");
      router.push("/dashboard");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Couldn’t publish the exam.",
      );
    }
  }

  // Warn when a shuffled question has an "All/None of the above" option that is
  // not pinned in place (AGENTS §7).
  const shuffleWarnings = useMemo(() => {
    const hits: string[] = [];
    let n = 0;
    for (const s of state.sections) {
      for (const b of s.blocks) {
        if (getBlockDef(b.type)?.scored) n += 1;
        if (!b.shuffleOptions || !b.options) continue;
        const risky = b.options.some(
          (o) => AON_RE.test(o.text) && !o.keepLast,
        );
        if (risky) hits.push(`Q${n}`);
      }
    }
    return hits;
  }, [state.sections]);

  const canPublish = counters.unreviewed === 0 && counters.questions > 0;
  const publishReason =
    counters.questions === 0
      ? "Add at least one question before publishing."
      : counters.unreviewed > 0
        ? `${counters.unreviewed} AI-imported ${counters.unreviewed === 1 ? "block is" : "blocks are"} not reviewed yet.`
        : "";

  return (
    <div className="flex h-14 items-center gap-3 border-b border-rule bg-surface px-4">
      <Link
        href="/dashboard"
        className="shrink-0 text-sm text-ink-3 hover:text-ink"
      >
        ← Exams
      </Link>
      <Separator orientation="vertical" className="h-6" />

      <Input
        value={state.title}
        onChange={(e) => dispatch({ kind: "set_title", title: e.target.value })}
        aria-label="Exam title"
        className="h-8 max-w-sm border-transparent bg-transparent px-1.5 text-sm font-semibold text-ink hover:border-rule focus-visible:bg-surface"
      />

      <Counter label="Q" value={counters.questions} />
      <Counter label="marks" value={counters.marks} />
      <Counter label="sections" value={counters.sections} />

      {shuffleWarnings.length > 0 ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <span
                tabIndex={0}
                className="inline-flex items-center gap-1 rounded-sm bg-flag-soft px-1.5 py-0.5 text-xs font-medium text-flag outline-none focus-visible:ring-2 focus-visible:ring-flag/40"
              >
                <TriangleAlert className="size-3" aria-hidden />
                {shuffleWarnings.length} shuffle{" "}
                {shuffleWarnings.length === 1 ? "warning" : "warnings"}
              </span>
            }
          />
          <TooltipContent>
            {shuffleWarnings.join(", ")}: an “all/none of the above” option can
            shuffle out of place. Pin the last option.
          </TooltipContent>
        </Tooltip>
      ) : null}

      <div className="ml-auto flex items-center gap-1.5">
        <PreviewDialog
          trigger={
            <Button variant="ghost" size="sm">
              <Eye />
              Preview
            </Button>
          }
        />
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href={`/configure/${state.examId}`} />}
        >
          <Settings2 />
          Configure
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={saveDraft}
        >
          <Save />
          {save.isPending ? "Saving…" : "Save draft"}
        </Button>

        {canPublish ? (
          <Button size="sm" disabled={busy} onClick={publishExam}>
            <Send />
            {publish.isPending ? "Publishing…" : "Publish"}
          </Button>
        ) : (
          <Tooltip>
            <TooltipTrigger
              render={
                // A disabled button can't receive focus, so wrap for the tooltip
                // and keep the explanation reachable (AGENTS §3.6).
                <span tabIndex={0} className="outline-none">
                  <Button size="sm" disabled aria-disabled className="pointer-events-none">
                    <Send />
                    Publish
                  </Button>
                </span>
              }
            />
            <TooltipContent>{publishReason}</TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

function Counter({ label, value }: { label: string; value: number }) {
  return (
    <span className="hidden items-center gap-1 text-xs text-ink-3 sm:inline-flex">
      <span className="font-mono text-sm font-medium text-ink-2 tabular">
        {value}
      </span>
      {label}
    </span>
  );
}

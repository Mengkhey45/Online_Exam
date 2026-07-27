"use client";

import { toast } from "sonner";
import { Download, BarChart3, AlertCircle, RefreshCw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tag } from "@/components/common/tag";
import { cn } from "@/lib/utils";
import { useExamResults } from "../queries";
import type { ExamResults } from "../schema";

/** Released exam results (parity with the examroom sample). */
export function ResultsView({ examId }: { examId: string }) {
  const { data, isPending, isError, refetch } = useExamResults(examId);

  if (isPending) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-5 px-6 py-6" aria-busy="true">
        <Skeleton className="h-12 w-72" />
        <div className="grid grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto mt-24 flex max-w-md flex-col items-center gap-4 text-center">
        <div className="flex size-11 items-center justify-center rounded-full bg-danger-soft text-danger">
          <AlertCircle className="size-5" aria-hidden />
        </div>
        <p className="text-sm text-ink-2">Couldn’t load results.</p>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw />
          Try again
        </Button>
      </div>
    );
  }

  const passCount = data.rows.filter((r) => r.status === "pass").length;
  const avg =
    data.rows.length > 0
      ? Math.round(
          data.rows.reduce((s, r) => s + r.percentage, 0) / data.rows.length,
        )
      : 0;
  const passRate =
    data.totalStudents > 0
      ? Math.round((passCount / data.totalStudents) * 100)
      : 0;

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-6">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">
            {data.title}
          </h1>
          <p className="mt-0.5 text-sm text-ink-2">
            {data.totalStudents} students · {data.notSubmitted} not submitted ·
            pass mark {data.passMarkPct}%
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => toast.success("Results exported")}>
            <Download />
            Export results
          </Button>
          <Button onClick={() => toast("Statistics coming soon")}>
            <BarChart3 />
            Statistics
          </Button>
        </div>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total students" value={data.totalStudents} tone="accent" />
        <StatCard label={`Passed (≥${data.passMarkPct}%)`} value={passCount} tone="ok" />
        <StatCard label="Average" value={`${avg}%`} tone="ink" />
        <StatCard label="Pass rate" value={`${passRate}%`} tone="ink" />
      </div>

      <div className="overflow-x-auto rounded-xl border border-rule bg-surface">
        <Table>
          <TableHeader>
            <TableRow className="border-rule hover:bg-transparent">
              <Th className="w-14 text-right">Rank</Th>
              <Th>Student</Th>
              <Th className="text-right">Marks</Th>
              <Th className="text-right">Percentage</Th>
              <Th>Result</Th>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...data.rows]
              .sort((a, b) => a.rank - b.rank)
              .map((r) => (
                <TableRow key={r.studentRef} className="border-rule">
                  <TableCell className="text-right font-mono text-ink-2 tabular">
                    <span className="inline-flex items-center gap-1">
                      {r.rank === 1 ? (
                        <Trophy className="size-3.5 text-flag" aria-hidden />
                      ) : null}
                      {r.rank}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-ink">{r.name}</div>
                    <div className="font-mono text-xs text-ink-3 tabular">
                      {r.studentRef}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-ink-2 tabular">
                    {r.marks}/{r.outOf}
                  </TableCell>
                  <TableCell className="text-right font-mono text-ink tabular">
                    {r.percentage}%
                  </TableCell>
                  <TableCell>
                    <Tag tone={r.status === "pass" ? "ok" : "danger"}>
                      {r.status === "pass" ? "Pass" : "Fail"}
                    </Tag>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: "accent" | "ok" | "ink";
}) {
  return (
    <div className="rounded-lg border border-rule bg-surface p-4">
      <div
        className={cn(
          "font-mono text-2xl font-semibold tabular",
          tone === "accent" && "text-accent",
          tone === "ok" && "text-ok",
          tone === "ink" && "text-ink",
        )}
      >
        {value}
      </div>
      <div className="mt-0.5 text-xs text-ink-2">{label}</div>
    </div>
  );
}

function Th({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <TableHead
      className={cn(
        "h-8 text-xs font-medium uppercase tracking-wide text-ink-3",
        className,
      )}
    >
      {children}
    </TableHead>
  );
}

export type { ExamResults };

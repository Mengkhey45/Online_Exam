"use client";

import { Trophy } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type { ExamResults } from "@/modules/results";

export function ResultsTab({ results }: { results: ExamResults[] }) {
  const [classId, setClassId] = useState("all");
  const [subject, setSubject] = useState("all");

  const classes = useMemo(
    () => results.flatMap((result) => result.classes).filter((item, index, items) => items.findIndex((candidate) => candidate.id === item.id) === index),
    [results],
  );
  const subjects = useMemo(
    () => results.flatMap((result) => result.subjects).filter((item, index, items) => items.indexOf(item) === index),
    [results],
  );
  const filteredResults = results.filter((result) => subject === "all" || result.subject === subject);
  const rows = filteredResults.flatMap((result) =>
    result.rows
      .filter((row) => classId === "all" || row.classId === classId)
      .map((row) => ({ ...row, examTitle: result.title, subject: result.subject })),
  );
  const passMark = filteredResults[0]?.passMarkPct ?? 0;
  const passCount = rows.filter((row) => row.status === "pass").length;
  const average = rows.length
    ? Math.round(rows.reduce((sum, row) => sum + row.percentage, 0) / rows.length)
    : 0;
  const notSubmitted = filteredResults.reduce((sum, result) => sum + result.notSubmitted, 0);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-ink">Results</h2>
          <p className="mt-0.5 text-sm text-ink-2">
            Released grades across the organisation · {notSubmitted} not submitted
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={classId} onValueChange={(value) => setClassId(value ?? "all")}>
            <SelectTrigger className="w-40" aria-label="Filter results by class">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classes</SelectItem>
              {classes.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={subject} onValueChange={(value) => setSubject(value ?? "all")}>
            <SelectTrigger className="w-40" aria-label="Filter results by subject">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All subjects</SelectItem>
              {subjects.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Students" value={rows.length} tone="accent" />
        <StatCard label={`Passed (≥${passMark}%)`} value={passCount} tone="ok" />
        <StatCard label="Average" value={`${average}%`} tone="ink" />
        <StatCard label="Pass rate" value={`${rows.length ? Math.round((passCount / rows.length) * 100) : 0}%`} tone="ink" />
      </div>

      <div className="overflow-x-auto rounded-xl border border-rule bg-surface">
        <Table>
          <TableHeader>
            <TableRow className="border-rule hover:bg-transparent">
              <Th className="w-14 text-right">Rank</Th>
              <Th>Student</Th>
              <Th>Exam</Th>
              <Th className="text-right">Marks</Th>
              <Th className="text-right">Percentage</Th>
              <Th>Result</Th>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...rows].sort((a, b) => b.percentage - a.percentage || a.name.localeCompare(b.name)).map((row, index) => (
              <TableRow key={`${row.examTitle}-${row.studentRef}`} className="border-rule">
                <TableCell className="text-right font-mono text-ink-2 tabular">
                  <span className="inline-flex items-center gap-1">
                    {index === 0 ? <Trophy className="size-3.5 text-flag" aria-hidden /> : null}
                    {index + 1}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="font-medium text-ink">{row.name}</div>
                  <div className="font-mono text-xs text-ink-3 tabular">{row.studentRef} · {row.className}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-ink">{row.examTitle}</div>
                  <div className="text-xs text-ink-3">{row.subject}</div>
                </TableCell>
                <TableCell className="text-right font-mono text-ink-2 tabular">{row.marks}/{row.outOf}</TableCell>
                <TableCell className="text-right font-mono text-ink tabular">{row.percentage}%</TableCell>
                <TableCell><Tag tone={row.status === "pass" ? "ok" : "danger"}>{row.status === "pass" ? "Pass" : "Fail"}</Tag></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string | number; tone: "accent" | "ok" | "ink" }) {
  return (
    <div className="rounded-lg border border-rule bg-surface p-4">
      <div className={cn("font-mono text-2xl font-semibold tabular", tone === "accent" && "text-accent", tone === "ok" && "text-ok", tone === "ink" && "text-ink")}>{value}</div>
      <div className="mt-0.5 text-xs text-ink-2">{label}</div>
    </div>
  );
}

function Th({ className, children }: { className?: string; children: React.ReactNode }) {
  return <TableHead className={cn("h-8 text-xs font-medium uppercase tracking-wide text-ink-3", className)}>{children}</TableHead>;
}
"use client";

import { Flag } from "lucide-react";
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
import { STATUS_LABEL } from "../labels";
import type { MonitoredStudent } from "../schema";

/**
 * Live student table. Anonymised IDs only — never names (rule 3.5). A row opens
 * the activity drawer. Flags are ochre and phrased for review, not accusation.
 */
export function StudentTable({
  students,
  onOpen,
}: {
  students: MonitoredStudent[];
  onOpen: (attemptId: string) => void;
}) {
  if (students.length === 0) {
    return (
      <div className="rounded-xl border border-rule bg-surface px-6 py-12 text-center text-sm text-ink-3">
        No students match this filter.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-rule bg-surface">
      <Table>
        <TableHeader>
          <TableRow className="border-rule hover:bg-transparent">
            <Th>Student</Th>
            <Th>Status</Th>
            <Th className="w-48">Progress</Th>
            <Th className="text-right">Time left</Th>
            <Th className="text-right">Flags</Th>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((s) => {
            const status = STATUS_LABEL[s.status];
            return (
              <TableRow
                key={s.attemptId}
                onClick={() => onOpen(s.attemptId)}
                className="cursor-pointer border-rule"
              >
                <TableCell className="font-mono font-medium text-ink tabular">
                  {s.studentId}
                </TableCell>
                <TableCell>
                  <Tag tone={status.tone}>{status.label}</Tag>
                </TableCell>
                <TableCell>
                  <Progress answered={s.answered} total={s.total} />
                </TableCell>
                <TableCell className="text-right font-mono text-sm text-ink-2 tabular">
                  {s.status === "submitted" || s.status === "not_started"
                    ? "—"
                    : `${Math.round(s.timeLeftMs / 60_000)} min`}
                </TableCell>
                <TableCell className="text-right">
                  {s.flagCount > 0 ? (
                    <span className="inline-flex items-center gap-1 font-mono text-sm text-flag tabular">
                      <Flag className="size-3.5" aria-hidden />
                      {s.flagCount}
                    </span>
                  ) : (
                    <span className="font-mono text-sm text-ink-3 tabular">0</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function Progress({ answered, total }: { answered: number; total: number }) {
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-sunk">
        <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-12 text-right font-mono text-xs text-ink-3 tabular">
        {answered}/{total}
      </span>
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

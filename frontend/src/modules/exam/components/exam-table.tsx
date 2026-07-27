import Link from "next/link";
import { format } from "date-fns";
import { Users } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CopyButton } from "@/components/common/copy-button";
import { StatusBadge, SecurityBadge } from "./exam-badges";
import { ExamRowActions } from "./exam-row-actions";
import type { ExamSummary } from "../summary";

/**
 * The exam table inside a group card. Numerics (keys, counts, dates) are mono +
 * tabular (AGENTS §4). Entire row title links to the builder; the row itself is
 * not a link so the copy button and actions stay independently reachable.
 */
export function ExamTable({ exams }: { exams: ExamSummary[] }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-rule hover:bg-transparent">
            <Th>Exam</Th>
            <Th>Created</Th>
            <Th>Key</Th>
            <Th>Status</Th>
            <Th>Security</Th>
            <Th className="text-right">Questions</Th>
            <Th className="text-right">Entered</Th>
            <th className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {exams.map((exam) => (
            <TableRow key={exam.id} className="border-rule">
              <TableCell className="max-w-88">
                <Link
                  href={`/builder/${exam.id}`}
                  className="font-medium text-ink hover:text-accent hover:underline underline-offset-2 outline-none focus-visible:text-accent focus-visible:underline"
                >
                  {exam.title}
                </Link>
              </TableCell>
              <TableCell className="text-ink-2 tabular whitespace-nowrap">
                {format(new Date(exam.createdAt), "d MMM yyyy")}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-0.5">
                  <span className="font-mono text-xs tracking-wide text-ink-2 tabular">
                    {exam.examKey}
                  </span>
                  <CopyButton value={exam.examKey} label="Copy exam key" />
                </div>
              </TableCell>
              <TableCell>
                <StatusBadge status={exam.status} />
              </TableCell>
              <TableCell>
                <SecurityBadge level={exam.security} />
              </TableCell>
              <TableCell className="text-right font-mono text-sm text-ink-2 tabular">
                {exam.questionCount}
              </TableCell>
              <TableCell className="text-right">
                <span className="inline-flex items-center gap-1.5 font-mono text-sm text-ink-2 tabular">
                  <Users className="size-3.5 text-ink-3" aria-hidden />
                  {exam.enteredStudents}
                  <span className="text-ink-3">/{exam.totalStudents}</span>
                </span>
              </TableCell>
              <TableCell className="text-right">
                <ExamRowActions exam={exam} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
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
      className={`h-8 text-xs font-medium uppercase tracking-wide text-ink-3 ${className ?? ""}`}
    >
      {children}
    </TableHead>
  );
}

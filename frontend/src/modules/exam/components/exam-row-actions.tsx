"use client";

import Link from "next/link";
import {
  MoreHorizontal,
  Pencil,
  Settings2,
  ScanText,
  Activity,
  ClipboardCheck,
  Trophy,
  Copy,
  Archive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ExamSummary } from "../summary";

/** Per-row actions. Labels match their result and use sentence case (AGENTS §8). */
export function ExamRowActions({ exam }: { exam: ExamSummary }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${exam.title}`}
            className="text-ink-3 hover:text-ink"
          >
            <MoreHorizontal />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="min-w-48">
        <DropdownMenuItem render={<Link href={`/builder/${exam.id}`} />}>
          <Pencil />
          Edit questions
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href={`/configure/${exam.id}`} />}>
          <Settings2 />
          Configure
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href={`/import/${exam.id}`} />}>
          <ScanText />
          Import from PDF
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href={`/monitoring/${exam.id}`} />}>
          <Activity />
          Monitor
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href={`/grading/${exam.id}`} />}>
          <ClipboardCheck />
          Grade
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href={`/results/${exam.id}`} />}>
          <Trophy />
          View results
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Copy />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive">
          <Archive />
          Archive
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

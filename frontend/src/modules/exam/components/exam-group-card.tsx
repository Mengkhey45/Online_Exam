"use client";

import { useState } from "react";
import { ChevronRight, Plus, FileQuestion } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ExamTable } from "./exam-table";
import { NewExamDialog } from "./new-exam-dialog";
import type { ExamGroup } from "../summary";

/** A collapsible card per exam group, holding its table of exams (AGENTS §7). */
export function ExamGroupCard({ group }: { group: ExamGroup }) {
  const [open, setOpen] = useState(true);
  const count = group.exams.length;

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="rounded-xl border border-rule bg-surface"
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <CollapsibleTrigger
          render={
            <button
              type="button"
              className="group flex min-w-0 items-center gap-2 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              <ChevronRight
                className={cn(
                  "size-4 shrink-0 text-ink-3 transition-transform duration-150",
                  open && "rotate-90",
                )}
                aria-hidden
              />
              <span className="truncate text-sm font-semibold text-ink">
                {group.name}
              </span>
              <span className="shrink-0 font-mono text-xs text-ink-3 tabular">
                {count}
              </span>
            </button>
          }
        />
        <NewExamDialog
          groups={[{ id: group.id, name: group.name }]}
          defaultGroupId={group.id}
          trigger={
            <Button variant="outline" size="sm">
              <Plus />
              New exam
            </Button>
          }
        />
      </div>

      <CollapsibleContent>
        <div className="border-t border-rule">
          {count > 0 ? (
            <ExamTable exams={group.exams} />
          ) : (
            <EmptyGroup groupId={group.id} groupName={group.name} />
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function EmptyGroup({
  groupId,
  groupName,
}: {
  groupId: string;
  groupName: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <div className="flex size-9 items-center justify-center rounded-full bg-surface-sunk text-ink-3">
        <FileQuestion className="size-4.5" aria-hidden />
      </div>
      <div className="space-y-0.5">
        <p className="text-sm font-medium text-ink">No exams yet</p>
        <p className="text-sm text-ink-2">
          Create the first exam for {groupName}.
        </p>
      </div>
      <NewExamDialog
        groups={[{ id: groupId, name: groupName }]}
        defaultGroupId={groupId}
        trigger={
          <Button size="sm">
            <Plus />
            New exam
          </Button>
        }
      />
    </div>
  );
}

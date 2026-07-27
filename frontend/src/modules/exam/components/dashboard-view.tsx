"use client";

import { Plus, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/errors";
import { useDashboard } from "../queries";
import { ExamGroupCard } from "./exam-group-card";
import { NewExamDialog } from "./new-exam-dialog";
import { NewGroupDialog } from "./new-group-dialog";
import {
  DashboardEmpty,
  DashboardError,
  DashboardSkeleton,
} from "./dashboard-states";

/**
 * Teacher dashboard (AGENTS §7). Server data via TanStack Query; renders
 * loading, empty, and error states explicitly. Identities are never shown here
 * — this is the exam list, not a sitting.
 */
export function DashboardView() {
  const { data, isPending, isError, error, refetch } = useDashboard();
  const groups = data?.groups.map((g) => ({ id: g.id, name: g.name })) ?? [];

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-6">
      <header className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">
            Exams
          </h1>
          <p className="mt-0.5 text-sm text-ink-2">
            Build, configure, and monitor exams across your courses.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NewGroupDialog
            trigger={
              <Button variant="outline">
                <FolderPlus />
                New group
              </Button>
            }
          />
          {groups.length > 0 ? (
            <NewExamDialog
              groups={groups}
              trigger={
                <Button>
                  <Plus />
                  New exam
                </Button>
              }
            />
          ) : null}
        </div>
      </header>

      {isPending ? (
        <DashboardSkeleton />
      ) : isError ? (
        <DashboardError
          message={
            error instanceof ApiError
              ? error.message
              : "Something went wrong. Try again."
          }
          onRetry={() => refetch()}
        />
      ) : data.groups.length === 0 ? (
        <DashboardEmpty />
      ) : (
        <div className="space-y-4">
          {data.groups.map((group) => (
            <ExamGroupCard key={group.id} group={group} />
          ))}
        </div>
      )}
    </div>
  );
}

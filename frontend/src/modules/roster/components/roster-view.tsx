"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  UserPlus,
  Upload,
  ScanText,
  FolderPlus,
  Trash2,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tag } from "@/components/common/tag";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useCapabilities } from "@/lib/capabilities";
import {
  useBatches,
  useStudents,
  useRemoveStudent,
  type Batch,
} from "../directory";
import { ImportWizard } from "./import-wizard";
import { NewBatchDialog } from "./new-batch-dialog";
import { AddStudentDialog } from "./add-student-dialog";
import { ScanDialog } from "./scan-dialog";
import { ScanReview } from "./scan-review";

const ALL = "__all__";

/** Roster hub (AGENTS §6): batches, the student list, and three ways to add. */
export function RosterView() {
  const capabilities = useCapabilities();
  const batchesQuery = useBatches();
  const studentsQuery = useStudents();
  const removeStudent = useRemoveStudent();

  const [selected, setSelected] = useState<string>(ALL);
  const [importing, setImporting] = useState(false);
  const [scanImportId, setScanImportId] = useState<string | null>(null);

  const batches = batchesQuery.data?.classes ?? [];
  const selectedBatch: Batch | undefined =
    selected === ALL ? undefined : batches.find((b) => b.id === selected);

  const aiOn = capabilities.data?.ai ?? false;

  const students = useMemo(() => {
    const all = studentsQuery.data?.students ?? [];
    return selected === ALL ? all : all.filter((s) => s.classId === selected);
  }, [studentsQuery.data, selected]);

  const batchName = (id: string | null) =>
    id ? batches.find((b) => b.id === id)?.name : undefined;

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-6">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">
            Roster
          </h1>
          <p className="mt-0.5 text-sm text-ink-2">
            Students in your institution, organised by batch.
          </p>
        </div>
        <AiPill on={aiOn} />
      </header>

      {/* Batch selector + create */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Select value={selected} onValueChange={(v) => setSelected(v ?? ALL)}>
          <SelectTrigger className="w-52" aria-label="Filter by batch">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All students</SelectItem>
            {batches.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <NewBatchDialog
          onCreated={(b) => setSelected(b.id)}
          trigger={
            <Button variant="outline" size="sm">
              <FolderPlus />
              New batch
            </Button>
          }
        />

        <div className="ml-auto flex items-center gap-2">
          <AddStudentDialog
            batch={selectedBatch}
            trigger={
              <Button variant="outline" size="sm">
                <UserPlus />
                Add manually
              </Button>
            }
          />
          <Button size="sm" onClick={() => setImporting(true)}>
            <Upload />
            Import file
          </Button>
          <ScanControl
            aiOn={aiOn}
            batch={selectedBatch}
            onScanned={setScanImportId}
          />
        </div>
      </div>

      {scanImportId ? (
        <ScanReview
          importId={scanImportId}
          onDone={() => setScanImportId(null)}
        />
      ) : importing ? (
        <div className="rounded-xl border border-rule bg-surface p-4">
          <ImportWizard
            classId={selectedBatch?.id}
            batchName={selectedBatch?.name}
            onDone={() => setImporting(false)}
            onCancel={() => setImporting(false)}
          />
        </div>
      ) : studentsQuery.isPending ? (
        <div className="space-y-2" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : students.length === 0 ? (
        <EmptyRoster hasBatch={selected !== ALL} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-rule bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-rule text-left text-xs font-medium uppercase tracking-wide text-ink-3">
                <th className="px-4 py-2">Student ID</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                {selected === ALL ? <th className="px-4 py-2">Batch</th> : null}
                <th className="w-10 px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-b border-rule last:border-0">
                  <td className="px-4 py-2 font-mono text-ink-2 tabular">
                    {s.studentRef}
                  </td>
                  <td className="px-4 py-2 font-medium text-ink">{s.name}</td>
                  <td className="px-4 py-2 text-ink-2">{s.email}</td>
                  {selected === ALL ? (
                    <td className="px-4 py-2">
                      {batchName(s.classId) ? (
                        <Tag tone="neutral">{batchName(s.classId)}</Tag>
                      ) : (
                        <span className="text-ink-3">—</span>
                      )}
                    </td>
                  ) : null}
                  <td className="px-2 py-2 text-right">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove ${s.name}`}
                      className="text-ink-3 hover:text-danger"
                      disabled={removeStudent.isPending}
                      onClick={() =>
                        removeStudent.mutate(s.id, {
                          onSuccess: () => toast.success(`${s.name} removed`),
                          onError: () => toast.error("Couldn’t remove."),
                        })
                      }
                    >
                      <Trash2 />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AiPill({ on }: { on: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        on ? "bg-ok-soft text-ok" : "bg-surface-sunk text-ink-3",
      )}
      title={
        on
          ? "AI is configured — you can scan photos/PDFs of student lists."
          : "AI isn’t set up — use CSV/Excel or add students manually."
      }
    >
      <Sparkles className="size-3.5" aria-hidden />
      AI extraction: {on ? "on" : "off"}
    </span>
  );
}

function ScanControl({
  aiOn,
  batch,
  onScanned,
}: {
  aiOn: boolean;
  batch?: Batch;
  onScanned: (importId: string) => void;
}) {
  if (aiOn) {
    return (
      <ScanDialog
        batch={batch}
        onScanned={onScanned}
        trigger={
          <Button variant="outline" size="sm">
            <ScanText />
            Scan (AI)
          </Button>
        }
      />
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span tabIndex={0} className="outline-none">
            <Button
              variant="outline"
              size="sm"
              disabled
              aria-disabled
              className="pointer-events-none"
            >
              <ScanText />
              Scan (AI)
            </Button>
          </span>
        }
      />
      <TooltipContent>
        AI isn’t set up. Use CSV/Excel or add students manually.
      </TooltipContent>
    </Tooltip>
  );
}

function EmptyRoster({ hasBatch }: { hasBatch: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-rule-strong bg-surface px-6 py-16 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-accent-soft text-accent">
        <Users className="size-5" aria-hidden />
      </div>
      <p className="text-sm font-medium text-ink">
        {hasBatch ? "No students in this batch yet" : "No students yet"}
      </p>
      <p className="max-w-sm text-sm text-ink-2">
        Add students manually, or import a CSV/Excel file — extra columns are
        ignored, so only name, email, and ID are kept.
      </p>
    </div>
  );
}

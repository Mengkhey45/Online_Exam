"use client";

import { useRef, useState } from "react";
import { AlertCircle, ArrowLeft, CheckCircle2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  STAGE_FIELDS,
  type StageFieldKey,
  type StagedImport,
} from "../schema";
import { useConfirmImport, usePatchRow } from "../queries";

/**
 * Editable preview (AGENTS §7). Rows are STAGED on the server: problems here —
 * including "already in the roster" — come from the backend, which re-validates
 * on every edit. Import stays disabled until none remain. Rows are staged, not
 * live (rule 3.6).
 */
export function PreviewStep({
  staged,
  onBack,
  onImported,
}: {
  staged: StagedImport;
  onBack: () => void;
  onImported: (count: number) => void;
}) {
  const [current, setCurrent] = useState<StagedImport>(staged);
  const [problemsOnly, setProblemsOnly] = useState(false);
  const patch = usePatchRow(current.id);
  const confirm = useConfirmImport(current.id);

  // Fields typed since the last server commit, so blur only patches on change.
  const dirty = useRef<Set<string>>(new Set());

  const problemCount = current.problemCount;
  const canImport = problemCount === 0 && current.rows.length > 0;
  const visible = problemsOnly
    ? current.rows.filter((r) => Object.keys(r.problems).length > 0)
    : current.rows;

  /** Update a cell locally so typing stays smooth (no per-keystroke request). */
  function editLocal(rowId: string, key: StageFieldKey, value: string) {
    dirty.current.add(`${rowId}:${key}`);
    setCurrent((prev) => ({
      ...prev,
      rows: prev.rows.map((r) =>
        r.id === rowId ? { ...r, data: { ...r.data, [key]: value } } : r,
      ),
    }));
  }

  /** On blur, re-validate that field on the server if it actually changed. */
  async function commit(rowId: string, key: StageFieldKey, value: string) {
    if (!dirty.current.has(`${rowId}:${key}`)) return;
    dirty.current.delete(`${rowId}:${key}`);
    try {
      const updated = await patch.mutateAsync({ rowId, patch: { [key]: value } });
      setCurrent(updated);
    } catch {
      // Keep the local edit; the server copy is unchanged and will be
      // re-checked on the next edit or on confirm.
    }
  }

  async function onConfirm() {
    try {
      const res = await confirm.mutateAsync();
      onImported(res.imported);
    } catch {
      // A 409 means new problems appeared (e.g. a concurrent import); surface
      // them by keeping the user on the preview.
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm",
            problemCount > 0 ? "bg-flag-soft text-flag" : "bg-ok-soft text-ok",
          )}
        >
          {problemCount > 0 ? (
            <>
              <AlertCircle className="size-4" aria-hidden />
              {problemCount} {problemCount === 1 ? "row needs" : "rows need"} a fix
            </>
          ) : (
            <>
              <CheckCircle2 className="size-4" aria-hidden />
              All {current.rows.length} rows are ready
            </>
          )}
        </div>

        <Button
          variant={problemsOnly ? "secondary" : "outline"}
          size="sm"
          onClick={() => setProblemsOnly((v) => !v)}
          disabled={problemCount === 0}
        >
          <Filter />
          {problemsOnly ? "Showing problems" : "Problems only"}
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-rule bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-rule">
              <th className="w-10 px-2 py-2" />
              {STAGE_FIELDS.map((f) => (
                <th
                  key={f.key}
                  className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wide text-ink-3"
                >
                  {f.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => {
              const hasProblem = Object.keys(r.problems).length > 0;
              return (
                <tr
                  key={r.id}
                  className={cn(
                    "border-b border-rule last:border-0",
                    hasProblem && "bg-flag-soft/40",
                  )}
                >
                  <td className="px-2 py-1.5 text-center">
                    {hasProblem ? (
                      <AlertCircle
                        className="mx-auto size-4 text-flag"
                        aria-label="Has a problem"
                      />
                    ) : (
                      <CheckCircle2
                        className="mx-auto size-4 text-ok/70"
                        aria-label="Ready"
                      />
                    )}
                  </td>
                  {STAGE_FIELDS.map((f) => {
                    const problem = r.problems[f.key];
                    return (
                      <td key={f.key} className="px-1.5 py-1.5 align-top">
                        <Input
                          value={r.data[f.key]}
                          onChange={(e) => editLocal(r.id, f.key, e.target.value)}
                          onBlur={(e) => commit(r.id, f.key, e.target.value)}
                          aria-invalid={Boolean(problem)}
                          aria-label={f.label}
                          className={cn("h-8", f.mono && "font-mono tabular")}
                        />
                        {problem ? (
                          <p className="mt-0.5 text-xs text-danger">{problem}</p>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft />
          Back
        </Button>
        <Button
          className="ml-auto"
          disabled={!canImport || confirm.isPending || patch.isPending}
          onClick={onConfirm}
        >
          {confirm.isPending
            ? "Importing…"
            : `Import ${current.rows.length} ${
                current.rows.length === 1 ? "student" : "students"
              }`}
        </Button>
      </div>
    </div>
  );
}

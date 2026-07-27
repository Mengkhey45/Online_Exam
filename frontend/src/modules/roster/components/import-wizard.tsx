"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Upload,
  ArrowRight,
  ArrowLeft,
  FileSpreadsheet,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  TARGET_FIELDS,
  type Mapping,
  type RawRoster,
  type StageRowData,
  type StagedImport,
} from "../schema";
import { useParseUpload, useStageImport } from "../queries";
import { MappingStep } from "./mapping-step";
import { PreviewStep } from "./preview-step";

type Step = "upload" | "map" | "preview";

function guessMapping(columns: string[]): Mapping {
  const find = (re: RegExp) => {
    const i = columns.findIndex((c) => re.test(c));
    return i >= 0 ? i : null;
  };
  return {
    student_id: find(/\bid\b/i),
    name: find(/name/i),
    email: find(/e-?mail/i),
    program: find(/course|programme|program|major/i),
  };
}

/** Build the mapped rows to stage, translating column indices to data fields. */
function buildStageRows(raw: RawRoster, mapping: Mapping): StageRowData[] {
  const cell = (row: string[], id: keyof Mapping) => {
    const idx = mapping[id];
    return idx === null ? "" : (row[idx] ?? "").trim();
  };
  return raw.rows.map((row) => ({
    studentRef: cell(row, "student_id"),
    name: cell(row, "name"),
    email: cell(row, "email"),
    program: cell(row, "program"),
  }));
}

/**
 * Import a roster file (AGENTS §6/§7): upload CSV/Excel → map columns → review →
 * confirm. Rows are staged and server-validated; nothing becomes a student until
 * confirmed (rule 3.6). Imports into the given batch, if any.
 */
export function ImportWizard({
  classId,
  batchName,
  onDone,
  onCancel,
}: {
  classId?: string;
  batchName?: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<Step>("upload");
  const [raw, setRaw] = useState<RawRoster | null>(null);
  const [mapping, setMapping] = useState<Mapping>({
    student_id: null,
    name: null,
    email: null,
    program: null,
  });
  const [staged, setStaged] = useState<StagedImport | null>(null);

  const parse = useParseUpload();
  const stage = useStageImport();

  async function onFile(file: File) {
    try {
      const parsed = await parse.mutateAsync(file);
      setRaw(parsed);
      setMapping(guessMapping(parsed.columns));
      setStep("map");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn’t read that file.");
    }
  }

  async function onContinue() {
    if (!raw) return;
    try {
      const result = await stage.mutateAsync({
        filename: raw.filename,
        rows: buildStageRows(raw, mapping),
        classId,
      });
      setStaged(result);
      setStep("preview");
    } catch {
      toast.error("Couldn’t stage the import. Try again.");
    }
  }

  const requiredMapped = useMemo(
    () =>
      TARGET_FIELDS.filter((f) => f.required).every(
        (f) => mapping[f.id] !== null,
      ),
    [mapping],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">
            Import from file
            {batchName ? (
              <span className="text-ink-3"> → {batchName}</span>
            ) : null}
          </h2>
          <p className="text-xs text-ink-2">
            CSV or Excel. Rows are staged until you confirm — nothing is added
            automatically.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X />
          Close
        </Button>
      </div>

      {step === "upload" ? (
        <UploadStep onFile={onFile} pending={parse.isPending} />
      ) : null}

      {step === "map" && raw ? (
        <div className="space-y-4">
          <MappingStep raw={raw} mapping={mapping} onChange={setMapping} />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep("upload")}>
              <ArrowLeft />
              Back
            </Button>
            <Button disabled={!requiredMapped || stage.isPending} onClick={onContinue}>
              {stage.isPending ? "Checking rows…" : "Continue"}
              <ArrowRight />
            </Button>
          </div>
        </div>
      ) : null}

      {step === "preview" && staged ? (
        <PreviewStep
          staged={staged}
          onBack={() => setStep("map")}
          onImported={(count) => {
            toast.success(`${count} students imported`);
            onDone();
          }}
        />
      ) : null}
    </div>
  );
}

function UploadStep({
  onFile,
  pending,
}: {
  onFile: (f: File) => void;
  pending: boolean;
}) {
  return (
    <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-rule-strong bg-surface px-6 py-16 text-center transition-colors hover:bg-surface-sunk/40">
      <span className="flex size-11 items-center justify-center rounded-full bg-accent-soft text-accent">
        {pending ? (
          <FileSpreadsheet className="size-5" aria-hidden />
        ) : (
          <Upload className="size-5" aria-hidden />
        )}
      </span>
      <span className="space-y-1">
        <span className="block text-sm font-medium text-ink">
          {pending ? "Reading your file…" : "Upload a CSV or Excel file"}
        </span>
        <span className="block text-sm text-ink-2">
          Needs a header row. You’ll map the columns next — extra columns are
          ignored.
        </span>
      </span>
      <input
        type="file"
        accept=".csv,.tsv,.xlsx,.xls"
        className="sr-only"
        disabled={pending}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
    </label>
  );
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api/client";
import { parseRosterFile } from "./parse";
import { rosterKeys } from "./directory";
import {
  stagedImportSchema,
  type RawRoster,
  type StageRowData,
  type StagedImport,
} from "./schema";

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "1";

/** Parse an uploaded file into columns + rows — done in the browser (§6). */
export function useParseUpload() {
  return useMutation({
    mutationFn: (file: File): Promise<RawRoster> => parseRosterFile(file),
  });
}

/**
 * Stage mapped rows on the server (POST /roster/imports). The server validates
 * them — including flagging IDs already in the roster, which the client can't
 * see — and returns per-row problems. Nothing is a real student yet (rule 3.6).
 */
export function useStageImport() {
  return useMutation({
    mutationFn: async (input: {
      filename: string;
      rows: StageRowData[];
      classId?: string;
    }): Promise<StagedImport> => {
      if (USE_MOCKS) return mockStage(input.filename, input.rows);
      return api.post("/roster/imports", input, stagedImportSchema);
    },
  });
}

/** Edit one staged row; the server re-validates the batch and returns it. */
export function usePatchRow(importId: string) {
  return useMutation({
    mutationFn: async (input: {
      rowId: string;
      patch: Partial<StageRowData>;
    }): Promise<StagedImport> => {
      if (USE_MOCKS) return mockPatch(input.rowId, input.patch);
      return api.patch(
        `/roster/imports/${importId}/rows/${input.rowId}`,
        input.patch,
        stagedImportSchema,
      );
    },
  });
}

const confirmAckSchema = z.object({ imported: z.number() });

/** Promote staged rows into the roster (rule 3.6 — explicit step). */
export function useConfirmImport(importId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (USE_MOCKS) return { imported: mockImport?.rows.length ?? 0 };
      return api.post(
        `/roster/imports/${importId}/confirm`,
        {},
        confirmAckSchema,
      );
    },
    // Promoting staged rows creates students — refresh the roster list.
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: rosterKeys.students }),
  });
}

// ── Mock staging ────────────────────────────────────────────────────────────
// A module-scoped fixture so patch/confirm operate on the same staged import in
// mock mode. Mirrors the backend's validation (minus the existing-roster lookup).

let mockImport: StagedImport | null = null;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function validate(rows: StagedImport["rows"]): number {
  const counts = new Map<string, number>();
  for (const r of rows) {
    const ref = r.data.studentRef.trim();
    if (ref) counts.set(ref, (counts.get(ref) ?? 0) + 1);
  }
  let problemRows = 0;
  for (const r of rows) {
    const p: Record<string, string> = {};
    const ref = r.data.studentRef.trim();
    if (!ref) p.studentRef = "Student ID is required";
    else if ((counts.get(ref) ?? 0) > 1) p.studentRef = "Duplicate student ID";
    if (!r.data.name.trim()) p.name = "Full name is required";
    const email = r.data.email.trim();
    if (!email) p.email = "Email is required";
    else if (!EMAIL_RE.test(email)) p.email = "Not a valid email";
    r.problems = p;
    if (Object.keys(p).length > 0) problemRows++;
  }
  return problemRows;
}

async function mockStage(
  filename: string,
  rows: StageRowData[],
): Promise<StagedImport> {
  await new Promise((r) => setTimeout(r, 400));
  const staged: StagedImport = {
    id: "imp_mock",
    filename,
    status: "pending",
    problemCount: 0,
    rows: rows.map((data, i) => ({
      id: `row_${i}`,
      rowIndex: i,
      data: { ...data, program: data.program ?? "" },
      problems: {},
    })),
  };
  staged.problemCount = validate(staged.rows);
  mockImport = staged;
  return structuredClone(staged);
}

async function mockPatch(
  rowId: string,
  patch: Partial<StageRowData>,
): Promise<StagedImport> {
  await new Promise((r) => setTimeout(r, 150));
  if (!mockImport) throw new Error("No staged import");
  const row = mockImport.rows.find((r) => r.id === rowId);
  if (row) row.data = { ...row.data, ...patch };
  mockImport.problemCount = validate(mockImport.rows);
  return structuredClone(mockImport);
}

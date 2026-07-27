import { eq } from "drizzle-orm";
import { scopedDb } from "@/db/scoped";
import {
  jobs,
  rosterImports,
  rosterStaging,
  students,
} from "@/db/schema";
import type { StagedRowData } from "@/db/schema/roster";
import { newId } from "@/lib/ids";
import { badRequest, conflict, notFound } from "@/lib/errors";
import { userStorage } from "@/lib/storage";
import type { RequestContext } from "@/middleware/context";
import { validateRows } from "./roster.validate";
import type {
  PatchRowInput,
  ScanImportInput,
  StartImportInput,
} from "./roster.schema";

/** Signed upload URL for an AI roster scan (Phase 2). Uses the caller's JWT. */
export async function createScanUploadUrl(
  ctx: RequestContext,
  userJwt: string,
  filename: string,
) {
  const path = `${ctx.organizationId}/roster/${newId("imp")}/${filename}`;
  const { data, error } = await userStorage(userJwt).createSignedUploadUrl(path);
  if (error || !data) {
    throw badRequest("UPLOAD_URL_FAILED", "Couldn’t create an upload URL.");
  }
  return { path, token: data.token, signedUrl: data.signedUrl };
}

/**
 * Queue an AI roster scan (Phase 2). Creates an empty roster import in
 * "processing" and a worker job; the worker extracts rows into staging, then
 * the teacher reviews/confirms via the SAME endpoints as a CSV import (§3.6).
 */
export async function createScanImport(
  ctx: RequestContext,
  input: ScanImportInput,
) {
  const sdb = scopedDb(ctx.organizationId);
  const importId = newId("imp");

  await sdb.db.insert(rosterImports).values(
    sdb.withOrg({
      id: importId,
      classId: input.classId ?? null,
      filename: input.filename,
      status: "processing",
      createdBy: ctx.userId,
    }),
  );

  await sdb.db.insert(jobs).values(
    sdb.withOrg({
      id: newId("job"),
      type: "import-roster-pdf",
      status: "pending",
      payload: {
        rosterImportId: importId,
        sourceUrl: input.sourceUrl,
        filename: input.filename,
        prompt: input.prompt ?? "",
      },
    }),
  );

  return { importId, status: "processing" as const };
}

async function existingRefs(ctx: RequestContext): Promise<Set<string>> {
  const sdb = scopedDb(ctx.organizationId);
  const rows = await sdb.db
    .select({ ref: students.studentRef })
    .from(students)
    .where(sdb.where(students));
  return new Set(rows.map((r) => r.ref));
}

/** Start an import — rows land in staging, never in students (AGENTS §3.6). */
export async function startImport(
  ctx: RequestContext,
  input: StartImportInput,
) {
  const sdb = scopedDb(ctx.organizationId);
  const importId = newId("imp");

  await sdb.db.insert(rosterImports).values(
    sdb.withOrg({
      id: importId,
      classId: input.classId ?? null,
      filename: input.filename,
      createdBy: ctx.userId,
    }),
  );

  const staged = input.rows.map((data, i) => ({
    id: newId("std"),
    importId,
    rowIndex: i,
    data: { ...data, program: data.program } as StagedRowData,
  }));
  const problems = validateRows(staged, await existingRefs(ctx));

  await sdb.db.insert(rosterStaging).values(
    staged.map((r) =>
      sdb.withOrg({
        id: r.id,
        importId,
        rowIndex: r.rowIndex,
        data: r.data,
        problems: problems.get(r.id) ?? {},
      }),
    ),
  );

  return getImport(ctx, importId);
}

export async function getImport(ctx: RequestContext, importId: string) {
  const sdb = scopedDb(ctx.organizationId);
  const [imp] = await sdb.db
    .select()
    .from(rosterImports)
    .where(sdb.where(rosterImports, eq(rosterImports.id, importId)))
    .limit(1);
  if (!imp) throw notFound("Import not found");

  const rows = await sdb.db
    .select()
    .from(rosterStaging)
    .where(sdb.where(rosterStaging, eq(rosterStaging.importId, importId)));

  const sorted = [...rows].sort((a, b) => a.rowIndex - b.rowIndex);
  const problemCount = sorted.filter(
    (r) => Object.keys(r.problems).length > 0,
  ).length;

  return {
    id: imp.id,
    filename: imp.filename,
    status: imp.status,
    problemCount,
    rows: sorted.map((r) => ({
      id: r.id,
      rowIndex: r.rowIndex,
      data: r.data,
      problems: r.problems,
    })),
  };
}

/** Edit a staged row, then re-validate the whole batch (duplicates shift). */
export async function patchRow(
  ctx: RequestContext,
  importId: string,
  rowId: string,
  patch: PatchRowInput,
) {
  const sdb = scopedDb(ctx.organizationId);
  const [row] = await sdb.db
    .select()
    .from(rosterStaging)
    .where(sdb.where(rosterStaging, eq(rosterStaging.id, rowId)))
    .limit(1);
  if (!row || row.importId !== importId) throw notFound("Row not found");

  const updated: StagedRowData = { ...row.data, ...patch };
  await sdb.db
    .update(rosterStaging)
    .set({ data: updated })
    .where(sdb.where(rosterStaging, eq(rosterStaging.id, rowId)));

  await revalidateImport(ctx, importId);
  return getImport(ctx, importId);
}

/** Recompute problems across a batch and persist them. */
async function revalidateImport(ctx: RequestContext, importId: string) {
  const sdb = scopedDb(ctx.organizationId);
  const rows = await sdb.db
    .select()
    .from(rosterStaging)
    .where(sdb.where(rosterStaging, eq(rosterStaging.importId, importId)));

  const problems = validateRows(
    rows.map((r) => ({ id: r.id, data: r.data })),
    await existingRefs(ctx),
  );
  for (const r of rows) {
    await sdb.db
      .update(rosterStaging)
      .set({ problems: problems.get(r.id) ?? {} })
      .where(sdb.where(rosterStaging, eq(rosterStaging.id, r.id)));
  }
}

/** Promote staged rows into students (AGENTS §3.6) — only if none have problems. */
export async function confirmImport(ctx: RequestContext, importId: string) {
  const sdb = scopedDb(ctx.organizationId);
  const [imp] = await sdb.db
    .select()
    .from(rosterImports)
    .where(sdb.where(rosterImports, eq(rosterImports.id, importId)))
    .limit(1);
  if (!imp) throw notFound("Import not found");

  await revalidateImport(ctx, importId);
  const rows = await sdb.db
    .select()
    .from(rosterStaging)
    .where(sdb.where(rosterStaging, eq(rosterStaging.importId, importId)));

  const unresolved = rows.filter((r) => Object.keys(r.problems).length > 0);
  if (unresolved.length > 0) {
    throw conflict(
      "IMPORT_HAS_PROBLEMS",
      `${unresolved.length} row(s) still need fixing before import.`,
      { unresolved: unresolved.length },
    );
  }

  for (const r of rows) {
    await sdb.db.insert(students).values(
      sdb.withOrg({
        id: newId("std"),
        classId: imp.classId ?? null,
        studentRef: r.data.studentRef.trim(),
        name: r.data.name.trim(),
        email: r.data.email.trim(),
        program: r.data.program.trim() || null,
      }),
    );
  }

  await sdb.db
    .update(rosterImports)
    .set({ status: "confirmed" })
    .where(sdb.where(rosterImports, eq(rosterImports.id, importId)));

  return { imported: rows.length };
}

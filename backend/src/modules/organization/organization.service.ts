import { count, eq, inArray } from "drizzle-orm";
import { env } from "@/config/env";
import { scopedDb } from "@/db/scoped";
import { classes, exams, organizations, students, users } from "@/db/schema";
import { newId } from "@/lib/ids";
import { conflict, forbidden, notFound } from "@/lib/errors";
import type { RequestContext } from "@/middleware/context";
import type {
  AddStudentInput,
  CreateClassInput,
  PatchOrgInput,
} from "./organization.schema";

/**
 * What optional capabilities this deployment has (AGENTS §8). The frontend uses
 * `ai` to show/hide AI-only affordances and degrade gracefully when the key
 * isn't configured — never crashing.
 */
export function getCapabilities() {
  return { ai: Boolean(env.ANTHROPIC_API_KEY) };
}

/** Compact live counts for the administration landing page. */
export async function getOrganizationDashboard(ctx: RequestContext) {
  const sdb = scopedDb(ctx.organizationId);
  const [[teachers], [classCount], [studentCount], [examCount]] = await Promise.all([
    sdb.db
      .select({ value: count() })
      .from(users)
      .where(sdb.where(users, eq(users.role, "teacher"))),
    sdb.db.select({ value: count() }).from(classes).where(sdb.where(classes)),
    sdb.db.select({ value: count() }).from(students).where(sdb.where(students)),
    sdb.db.select({ value: count() }).from(exams).where(sdb.where(exams)),
  ]);

  return {
    teachers: teachers?.value ?? 0,
    classes: classCount?.value ?? 0,
    students: studentCount?.value ?? 0,
    exams: examCount?.value ?? 0,
  };
}

// A user can only ever read/write their own organisation (AGENTS §3.1).
function assertOwnOrg(ctx: RequestContext, id: string) {
  if (id !== ctx.organizationId) throw forbidden();
}

export async function getOrganization(ctx: RequestContext, id: string) {
  assertOwnOrg(ctx, id);
  const sdb = scopedDb(ctx.organizationId);
  // The organisations table keys on id (it has no organization_id column); the
  // ownership check above already scopes this to the caller's org.
  const [row] = await sdb.db
    .select()
    .from(organizations)
    .where(eq(organizations.id, id))
    .limit(1);
  if (!row) throw notFound("Organisation not found");
  return row;
}

export async function patchOrganization(
  ctx: RequestContext,
  id: string,
  input: PatchOrgInput,
) {
  assertOwnOrg(ctx, id);
  const sdb = scopedDb(ctx.organizationId);
  await sdb.db
    .update(organizations)
    .set({ name: input.name })
    .where(eq(organizations.id, id));
  return getOrganization(ctx, id);
}

export async function listTeachers(ctx: RequestContext, id: string) {
  assertOwnOrg(ctx, id);
  const sdb = scopedDb(ctx.organizationId);
  const rows = await sdb.db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .where(sdb.where(users, inArray(users.role, ["teacher", "admin"])));
  return { teachers: rows };
}

export async function listClasses(ctx: RequestContext) {
  const sdb = scopedDb(ctx.organizationId);
  const rows = await sdb.db
    .select()
    .from(classes)
    .where(sdb.where(classes));
  return { classes: rows };
}

export async function createClass(
  ctx: RequestContext,
  input: CreateClassInput,
) {
  const sdb = scopedDb(ctx.organizationId);
  const row = { id: newId("cls"), name: input.name };
  await sdb.db.insert(classes).values(sdb.withOrg(row));
  return row;
}

export async function listClassStudents(ctx: RequestContext, classId: string) {
  const sdb = scopedDb(ctx.organizationId);
  const rows = await sdb.db
    .select()
    .from(students)
    .where(sdb.where(students, eq(students.classId, classId)));
  return { students: rows };
}

/** Every student in the org (the roster). The UI filters by batch client-side. */
export async function listStudents(ctx: RequestContext) {
  const sdb = scopedDb(ctx.organizationId);
  const rows = await sdb.db
    .select()
    .from(students)
    .where(sdb.where(students));
  return { students: rows };
}

/** Add one student directly (manual entry — no file/AI). Rejects duplicate IDs. */
export async function createStudent(
  ctx: RequestContext,
  input: AddStudentInput,
) {
  const sdb = scopedDb(ctx.organizationId);
  const studentRef = input.studentRef.trim();

  const [existing] = await sdb.db
    .select({ id: students.id })
    .from(students)
    .where(sdb.where(students, eq(students.studentRef, studentRef)))
    .limit(1);
  if (existing) {
    throw conflict("STUDENT_EXISTS", "A student with that ID is already here.");
  }

  const row = {
    id: newId("std"),
    classId: input.classId ?? null,
    studentRef,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    program: input.program?.trim() || null,
  };
  await sdb.db.insert(students).values(sdb.withOrg(row));
  return row;
}

/** Remove a student from the roster (AGENTS §6). */
export async function removeStudent(ctx: RequestContext, id: string) {
  const sdb = scopedDb(ctx.organizationId);
  const [row] = await sdb.db
    .select({ id: students.id })
    .from(students)
    .where(sdb.where(students, eq(students.id, id)))
    .limit(1);
  if (!row) throw notFound("Student not found");
  await sdb.db.delete(students).where(sdb.where(students, eq(students.id, id)));
  return { removed: true };
}

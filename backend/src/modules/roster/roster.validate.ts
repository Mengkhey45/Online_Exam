import type { RowProblems, StagedRowData } from "@/db/schema/roster";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Validate staged roster rows (AGENTS §6). Duplicate student IDs within the
 * organisation are flagged for the teacher, never silently merged. Rows with
 * problems cannot be confirmed until fixed.
 */
export function validateRows(
  rows: { id: string; data: StagedRowData }[],
  existingRefs: Set<string> = new Set(),
): Map<string, RowProblems> {
  const problems = new Map<string, RowProblems>();

  // Duplicates within this batch.
  const counts = new Map<string, number>();
  for (const r of rows) {
    const ref = r.data.studentRef.trim();
    if (ref) counts.set(ref, (counts.get(ref) ?? 0) + 1);
  }

  for (const r of rows) {
    const p: RowProblems = {};
    const ref = r.data.studentRef.trim();
    if (!ref) p.studentRef = "Student ID is required";
    else if ((counts.get(ref) ?? 0) > 1) p.studentRef = "Duplicate student ID";
    else if (existingRefs.has(ref)) p.studentRef = "Already in the roster";

    if (!r.data.name.trim()) p.name = "Full name is required";

    const email = r.data.email.trim();
    if (!email) p.email = "Email is required";
    else if (!EMAIL_RE.test(email)) p.email = "Not a valid email";

    if (Object.keys(p).length > 0) problems.set(r.id, p);
  }
  return problems;
}

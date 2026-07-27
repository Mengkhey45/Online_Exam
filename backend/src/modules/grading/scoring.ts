import type { Answer, Block, Exam } from "@/schema";

/**
 * Deterministic auto-scoring (AGENTS §7). Pure functions — no DB, no HTTP — so
 * they are exhaustively testable. Everything is keyed by ID; presentation order
 * is irrelevant here (rule 3.2), which is exactly why a shuffled attempt grades
 * identically to an unshuffled one.
 *
 * Objective types (mcq, multi_select, fill_blank) are auto-scored. Short/long/
 * code/file are NEVER auto-scored — AI may suggest, a teacher always confirms.
 */

/** MCQ: full marks if the single selected option is the correct one. */
export function scoreMcq(question: Block, optionIds: string[]): number {
  if (optionIds.length !== 1) return 0;
  const chosen = question.options?.find((o) => o.id === optionIds[0]);
  return chosen?.isCorrect ? question.marks : 0;
}

/**
 * Multi-select partial credit: (correctlyChosen − incorrectlyChosen) / totalCorrect,
 * clamped to [0, 1], times marks. Selecting every option nets zero, not full.
 */
export function scoreMultiSelect(question: Block, optionIds: string[]): number {
  const options = question.options ?? [];
  const correct = new Set(options.filter((o) => o.isCorrect).map((o) => o.id));
  if (correct.size === 0) return 0;
  const selected = new Set(optionIds);

  let hits = 0;
  let misses = 0;
  for (const id of selected) {
    if (correct.has(id)) hits += 1;
    else misses += 1;
  }
  const fraction = Math.max(0, (hits - misses) / correct.size);
  return round2(fraction * question.marks);
}

/** Normalise a blank answer for comparison (whitespace, and case if allowed). */
function normalise(value: string, caseSensitive: boolean): string {
  const trimmed = value.trim().replace(/\s+/g, " ");
  return caseSensitive ? trimmed : trimmed.toLowerCase();
}

function numbersWithinTolerance(
  a: string,
  b: string,
  tolerance: number,
): boolean {
  const na = Number(a);
  const nb = Number(b);
  if (Number.isNaN(na) || Number.isNaN(nb)) return false;
  return Math.abs(na - nb) <= tolerance;
}

/**
 * Fill-in-the-blank: each blank scores independently. A blank is correct if the
 * normalised answer matches any accepted answer, or is within numeric tolerance.
 */
export function scoreFillBlank(
  question: Block,
  blankAnswers: Record<string, string>,
): number {
  let total = 0;
  for (const blank of question.blanks ?? []) {
    const raw = blankAnswers[blank.id];
    if (raw === undefined || raw.trim() === "") continue;
    const given = normalise(raw, blank.caseSensitive);

    const matched = blank.acceptedAnswers.some((accepted) => {
      if (normalise(accepted, blank.caseSensitive) === given) return true;
      if (blank.numericTolerance !== undefined) {
        return numbersWithinTolerance(raw, accepted, blank.numericTolerance);
      }
      return false;
    });
    if (matched) total += blank.marks;
  }
  return round2(total);
}

/** Whether a block type is auto-scored at all (§7). */
export function isAutoScored(type: Block["type"]): boolean {
  return type === "mcq" || type === "multi_select" || type === "fill_blank";
}

/**
 * Auto-score one answer against its question. Returns null for types a teacher
 * must grade — the caller leaves those for manual scoring.
 */
export function autoScore(question: Block, answer: Answer): number | null {
  switch (question.type) {
    case "mcq":
      return scoreMcq(question, answer.optionIds ?? []);
    case "multi_select":
      return scoreMultiSelect(question, answer.optionIds ?? []);
    case "fill_blank":
      return scoreFillBlank(question, answer.blankAnswers ?? {});
    default:
      return null;
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Auto-score a whole exam version against a student's answers, reading in the
 * version's CANONICAL section/block order and ignoring any presented order
 * (AGENTS §7). This is the property that makes a shuffled attempt grade
 * identically to an unshuffled one.
 *
 * `answersByQuestion` is keyed by question ID (rule 3.2). Manually-graded types
 * return null from autoScore and contribute 0 here — a teacher scores them
 * separately.
 */
export function autoScoreExam(
  exam: Exam,
  answersByQuestion: Map<string, Answer>,
): { total: number; perQuestion: Record<string, number> } {
  const perQuestion: Record<string, number> = {};
  let total = 0;
  for (const section of exam.sections) {
    for (const block of section.blocks) {
      const answer = answersByQuestion.get(block.id);
      if (!answer) continue;
      const score = autoScore(block, answer);
      if (score === null) continue;
      perQuestion[block.id] = score;
      total += score;
    }
  }
  return { total: round2(total), perQuestion };
}

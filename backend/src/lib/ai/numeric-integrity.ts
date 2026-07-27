import type { Block } from "@/schema";

/**
 * Numeric integrity (AGENTS §3.5 / §8). AI conversion is literal — it may fix
 * OCR artifacts and convert maths to LaTeX, but it may NOT change any number.
 * This extracts numbers from the source page and the converted block, compares
 * the multisets, and flags any difference. A flagged block cannot be
 * auto-marked reviewed.
 */
export type NumericMismatch = { source: string[]; converted: string[] };

const NUMBER_RE = /-?\d+(?:\.\d+)?/g;

/** Extract all numbers as normalised strings (e.g. "07" → "7", "9.50" → "9.5"). */
export function extractNumbers(text: string): string[] {
  const matches = text.match(NUMBER_RE) ?? [];
  return matches.map((m) => {
    const n = Number(m);
    return Number.isFinite(n) ? String(n) : m;
  });
}

function multiset(values: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const v of values) m.set(v, (m.get(v) ?? 0) + 1);
  return m;
}

function multisetsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const ma = multiset(a);
  const mb = multiset(b);
  if (ma.size !== mb.size) return false;
  for (const [k, v] of ma) if (mb.get(k) !== v) return false;
  return true;
}

/** All numbers a converted block presents (stem, options, accepted answers). */
export function blockNumbers(block: Block): string[] {
  const parts = [block.stem];
  for (const o of block.options ?? []) parts.push(o.text);
  for (const b of block.blanks ?? []) parts.push(...b.acceptedAnswers);
  return extractNumbers(parts.join(" "));
}

/**
 * Compare a converted block's numbers against its source page text. Returns a
 * mismatch (for a prominent warning) or null when they agree.
 */
export function checkNumericIntegrity(
  block: Block,
  sourceText: string,
): NumericMismatch | null {
  const source = extractNumbers(sourceText);
  const converted = blockNumbers(block);
  if (multisetsEqual(source, converted)) return null;
  return { source, converted };
}

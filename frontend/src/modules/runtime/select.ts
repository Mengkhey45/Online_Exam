import type { Answer, Block, Option, Section } from "@/modules/exam";
import type { Sitting } from "./queries";

/** Whether a question has a meaningful answer, for the rail and submit summary. */
export function isAnswered(block: Block, answer?: Answer): boolean {
  if (!answer) return false;
  switch (block.type) {
    case "mcq":
    case "multi_select":
      return (answer.optionIds?.length ?? 0) > 0;
    case "fill_blank":
      return Object.values(answer.blankAnswers ?? {}).some(
        (v) => v.trim() !== "",
      );
    case "short_answer":
    case "long_answer":
    case "code":
      return (answer.text ?? "").trim() !== "";
    case "file_upload":
      return Boolean(answer.fileUrl);
    default:
      return false;
  }
}

/** One navigable item in the student's presented sequence. */
export type PresentedItem = {
  sectionId: string;
  sectionTitle: string;
  sectionInstructions: string;
  questionId: string;
  block: Block;
  /** 1-based number among scored questions; undefined for content/passages. */
  number?: number;
};

/**
 * Build the student's navigation from attempt.presentedOrder — never from the
 * exam's canonical order (AGENTS §6). Question numbers are the presented
 * ordinals, so cell "1" is whatever this student sees first.
 */
export function buildPresentedItems(sitting: Sitting): PresentedItem[] {
  const { exam, attempt } = sitting;

  const blocksById = new Map<string, Block>();
  const sectionById = new Map<string, Section>();
  for (const s of exam.sections) {
    sectionById.set(s.id, s);
    for (const b of s.blocks) blocksById.set(b.id, b);
  }

  const items: PresentedItem[] = [];
  let n = 0;

  // Iterate sections in canonical order, but questions in presented order.
  for (const section of exam.sections) {
    const order = attempt.presentedOrder[section.id];
    if (!order) continue;
    for (const qid of order) {
      const block = blocksById.get(qid);
      if (!block) continue; // unknown id — skip rather than guess
      const scored = block.type !== "content" && block.type !== "section";
      if (scored) n += 1;
      items.push({
        sectionId: section.id,
        sectionTitle: section.title,
        sectionInstructions: section.instructions,
        questionId: qid,
        block,
        number: scored ? n : undefined,
      });
    }
  }
  return items;
}

/**
 * Options for a question in the order this student should see them
 * (attempt.presentedOptions), falling back to canonical order. Identity is by
 * option ID; position carries no meaning (rule 3.1).
 */
export function presentedOptions(
  sitting: Sitting,
  block: Block,
): Option[] {
  const canonical = block.options ?? [];
  const order = sitting.attempt.presentedOptions[block.id];
  if (!order) return canonical;
  const byId = new Map(canonical.map((o) => [o.id, o]));
  const ordered: Option[] = [];
  for (const id of order) {
    const o = byId.get(id);
    if (o) ordered.push(o);
  }
  // Include any options missing from the presented list, defensively.
  for (const o of canonical) if (!order.includes(o.id)) ordered.push(o);
  return ordered;
}

import type { Block, Exam, Section } from "@/schema";

/**
 * Generates a student's presented order (AGENTS §7). Written EXPLICITLY as
 * arrays, never as a seed — a seed can't be reproduced after the shuffle code
 * changes, and disputes surface months later. Deterministic given an injected
 * RNG, so it is testable; production passes Math.random.
 */
export type Rng = () => number;

export type PresentedLayout = {
  presentedOrder: Record<string, string[]>; // sectionId -> questionIds
  presentedOptions: Record<string, string[]>; // questionId -> optionIds
};

function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const a = arr[i]!;
    const b = arr[j]!;
    arr[i] = b;
    arr[j] = a;
  }
  return arr;
}

/** Shuffle question order while pinned blocks keep their position (§6 pinned). */
function orderQuestions(section: Section, rng: Rng): string[] {
  const ids = section.blocks.map((b) => b.id);
  if (!section.shuffleQuestions) return ids;

  const movableIdx: number[] = [];
  section.blocks.forEach((b, i) => {
    if (!b.pinned) movableIdx.push(i);
  });
  const shuffledMovable = shuffle(
    movableIdx.map((i) => section.blocks[i]!.id),
    rng,
  );

  const result = [...ids];
  movableIdx.forEach((idx, k) => {
    result[idx] = shuffledMovable[k]!;
  });
  return result;
}

/** Shuffle option order, keeping keepLast options at the end in original order. */
function orderOptions(block: Block, rng: Rng): string[] {
  const options = block.options ?? [];
  if (!block.shuffleOptions) return options.map((o) => o.id);

  const movable = options.filter((o) => !o.keepLast);
  const pinnedLast = options.filter((o) => o.keepLast);
  return [
    ...shuffle(movable.map((o) => o.id), rng),
    ...pinnedLast.map((o) => o.id),
  ];
}

export function buildPresentedLayout(
  exam: Exam,
  rng: Rng = Math.random,
): PresentedLayout {
  const presentedOrder: Record<string, string[]> = {};
  const presentedOptions: Record<string, string[]> = {};

  for (const section of exam.sections) {
    presentedOrder[section.id] = orderQuestions(section, rng);
    for (const block of section.blocks) {
      if (block.options && block.options.length > 0) {
        presentedOptions[block.id] = orderOptions(block, rng);
      }
    }
  }
  return { presentedOrder, presentedOptions };
}

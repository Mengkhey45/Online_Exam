import type { Section } from "@/modules/exam";

export const SECTION_DROP_PREFIX = "secdrop:";

type Loc = { si: number; bi: number };

function locate(sections: Section[], blockId: string): Loc | null {
  for (let si = 0; si < sections.length; si++) {
    const bi = sections[si].blocks.findIndex((b) => b.id === blockId);
    if (bi !== -1) return { si, bi };
  }
  return null;
}

/**
 * Pure reorder: returns a new sections array with `activeId` moved to where
 * `overId` sits. `overId` is either another block id or a section drop zone id
 * (`secdrop:<sectionId>`), which targets the end of an (often empty) section.
 * Returns the same reference when nothing changes.
 */
export function moveBlock(
  sections: Section[],
  activeId: string,
  overId: string,
): Section[] {
  const from = locate(sections, activeId);
  if (!from) return sections;

  let toSi: number;
  let toBi: number;

  if (overId.startsWith(SECTION_DROP_PREFIX)) {
    const sectionId = overId.slice(SECTION_DROP_PREFIX.length);
    toSi = sections.findIndex((s) => s.id === sectionId);
    if (toSi === -1) return sections;
    toBi = sections[toSi].blocks.length;
  } else {
    const to = locate(sections, overId);
    if (!to) return sections;
    toSi = to.si;
    toBi = to.bi;
  }

  if (from.si === toSi && from.bi === toBi) return sections;

  const next = sections.map((s) => ({ ...s, blocks: [...s.blocks] }));
  const [moved] = next[from.si].blocks.splice(from.bi, 1);

  // After removal, a target index in the same section shifts left by one when
  // the source sat before it.
  const insertAt =
    from.si === toSi && from.bi < toBi ? toBi - 1 : toBi;
  next[toSi].blocks.splice(insertAt, 0, moved);
  return next;
}

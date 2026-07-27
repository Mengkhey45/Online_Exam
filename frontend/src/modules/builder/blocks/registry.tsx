import type { Block, BlockType } from "@/modules/exam";
import type { BlockDef, BlockGroup } from "./def";
import { contentDef } from "./content";
import { mcqDef } from "./mcq";
import { multiSelectDef } from "./multi-select";
import { fillBlankDef } from "./fill-blank";
import { shortAnswerDef } from "./short-answer";
import { longAnswerDef } from "./long-answer";
import { codeDef } from "./code";
import { fileUploadDef } from "./file-upload";

/**
 * The block registry. Assembles every block type's definition. Adding a new
 * type means adding a file next to these and one line here (AGENTS §5.4).
 */
const DEFS = [
  contentDef,
  mcqDef,
  multiSelectDef,
  fillBlankDef,
  shortAnswerDef,
  longAnswerDef,
  codeDef,
  fileUploadDef,
] as const;

export const blockRegistry = Object.fromEntries(
  DEFS.map((d) => [d.type, d]),
) as Record<BlockDef["type"], BlockDef>;

export function getBlockDef(type: BlockType): BlockDef | undefined {
  return type === "section"
    ? undefined
    : blockRegistry[type as BlockDef["type"]];
}

/** Create a fresh block of a given type (with a client id). */
export function createBlock(type: BlockType): Block {
  const def = getBlockDef(type);
  if (!def) throw new Error(`No block definition for type "${type}"`);
  return def.create();
}

/** Palette groups, in display order (AGENTS §7: Structure / Objective / Written). */
export const PALETTE_GROUPS: { group: BlockGroup; label: string }[] = [
  { group: "structure", label: "Structure" },
  { group: "objective", label: "Objective" },
  { group: "written", label: "Written" },
];

export function defsForGroup(group: BlockGroup): BlockDef[] {
  return DEFS.filter((d) => d.group === group);
}

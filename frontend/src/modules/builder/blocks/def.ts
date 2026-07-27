import type { LucideIcon } from "lucide-react";
import type { Block, BlockType } from "@/modules/exam";

export type BlockGroup = "structure" | "objective" | "written";

export type SettingsProps = {
  block: Block;
  update: (patch: Partial<Block>) => void;
};

/**
 * One block type = one file (AGENTS §5.4). Each block file exports a BlockDef.
 * Adding a new question type touches exactly: the schema (exam/types.ts), the
 * builder renderer (here), and the runtime renderer (runtime module).
 */
export type BlockDef = {
  type: Exclude<BlockType, "section">;
  label: string;
  group: BlockGroup;
  icon: LucideIcon;
  /** Contributes to the question/marks counters when true. */
  scored: boolean;
  create: () => Block;
  /** Read preview shown inside the sheet card. */
  Body: React.FC<{ block: Block }>;
  /** Type-specific controls shown in the settings panel. */
  Settings: React.FC<SettingsProps>;
};

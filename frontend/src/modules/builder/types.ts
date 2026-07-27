import type { Block, BlockType, Section } from "@/modules/exam";

/**
 * Builder-local state. This is an editable draft of an exam held in a
 * module-scoped reducer (AGENTS §8 — no global store). Server persistence is a
 * separate save action; this state is the working copy.
 */
export type BuilderState = {
  examId: string;
  title: string;
  status: "draft" | "published" | "archived";
  sections: Section[];
  selectedBlockId: string | null;
  selectedSectionId: string | null;
  dirty: boolean;
};

export type BuilderAction =
  | { kind: "set_title"; title: string }
  | { kind: "select_block"; blockId: string | null }
  | { kind: "select_section"; sectionId: string | null }
  | { kind: "add_section" }
  | { kind: "set_sections"; sections: Section[] } // drag reorder result
  | { kind: "update_section"; sectionId: string; patch: Partial<Section> }
  | { kind: "remove_section"; sectionId: string }
  | {
      kind: "add_block";
      sectionId: string;
      blockType: BlockType;
      atIndex?: number;
    }
  | { kind: "update_block"; blockId: string; patch: Partial<Block> }
  | { kind: "remove_block"; blockId: string }
  | {
      kind: "move_block";
      blockId: string;
      toSectionId: string;
      toIndex: number;
    }
  | { kind: "toggle_reviewed"; blockId: string };

/** Live counters shown in the top bar (AGENTS §7). */
export type BuilderCounters = {
  sections: number;
  questions: number;
  marks: number;
  unreviewed: number; // AI-imported blocks not yet reviewed (blocks publish)
};

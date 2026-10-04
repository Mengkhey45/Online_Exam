"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type Dispatch,
} from "react";
import type { Block, Section } from "@/modules/exam";
import { genId } from "@/lib/utils";
import { createBlock } from "./blocks/registry";
import type {
  BuilderAction,
  BuilderCounters,
  BuilderState,
} from "./types";

function newSection(index: number): Section {
  return {
    id: genId("sec"),
    title: `Section ${index + 1}`,
    instructions: "",
    mode: "blocks",
    shuffleQuestions: false,
    blocks: [],
  };
}

function mapSection(
  state: BuilderState,
  sectionId: string,
  fn: (s: Section) => Section,
): Section[] {
  return state.sections.map((s) => (s.id === sectionId ? fn(s) : s));
}

function reducer(state: BuilderState, action: BuilderAction): BuilderState {
  if (
    state.status === "published" &&
    [
      "restore_draft",
      "set_title",
      "add_section",
      "set_sections",
      "update_section",
      "remove_section",
      "add_block",
      "update_block",
      "remove_block",
      "move_block",
      "toggle_reviewed",
    ].includes(action.kind)
  ) {
    return state;
  }

  switch (action.kind) {
    case "restore_draft":
      return {
        ...state,
        title: action.title,
        sections: action.sections,
        dirty: true,
      };

    case "set_title":
      return { ...state, title: action.title, dirty: true };

    case "select_block":
      return {
        ...state,
        selectedBlockId: action.blockId,
        selectedSectionId: null,
      };

    case "select_section":
      return {
        ...state,
        selectedSectionId: action.sectionId,
        selectedBlockId: null,
      };

    case "add_section":
      return {
        ...state,
        sections: [...state.sections, newSection(state.sections.length)],
        dirty: true,
      };

    case "add_existing_block":
      return {
        ...state,
        sections: mapSection(state, action.sectionId, (s) => ({
          ...s,
          blocks: [...s.blocks, action.block],
        })),
        selectedBlockId: action.block.id,
        selectedSectionId: null,
        dirty: true,
      };

    case "set_sections":
      return { ...state, sections: action.sections, dirty: true };

    case "update_section":
      return {
        ...state,
        sections: mapSection(state, action.sectionId, (s) => ({
          ...s,
          ...action.patch,
        })),
        dirty: true,
      };

    case "remove_section":
      return {
        ...state,
        sections: state.sections.filter((s) => s.id !== action.sectionId),
        selectedSectionId:
          state.selectedSectionId === action.sectionId
            ? null
            : state.selectedSectionId,
        dirty: true,
      };

    case "add_block": {
      const block = createBlock(action.blockType);
      return {
        ...state,
        sections: mapSection(state, action.sectionId, (s) => {
          const blocks = [...s.blocks];
          const at = action.atIndex ?? blocks.length;
          blocks.splice(at, 0, block);
          return { ...s, blocks };
        }),
        selectedBlockId: block.id,
        selectedSectionId: null,
        dirty: true,
      };
    }

    case "update_block":
      return {
        ...state,
        sections: state.sections.map((s) => ({
          ...s,
          blocks: s.blocks.map((b) =>
            b.id === action.blockId ? ({ ...b, ...action.patch } as Block) : b,
          ),
        })),
        dirty: true,
      };

    case "remove_block":
      return {
        ...state,
        sections: state.sections.map((s) => ({
          ...s,
          blocks: s.blocks.filter((b) => b.id !== action.blockId),
        })),
        selectedBlockId:
          state.selectedBlockId === action.blockId
            ? null
            : state.selectedBlockId,
        dirty: true,
      };

    case "move_block": {
      let moved: Block | undefined;
      const stripped = state.sections.map((s) => {
        const idx = s.blocks.findIndex((b) => b.id === action.blockId);
        if (idx === -1) return s;
        moved = s.blocks[idx];
        return { ...s, blocks: s.blocks.filter((b) => b.id !== action.blockId) };
      });
      if (!moved) return state;
      const withInsert = stripped.map((s) => {
        if (s.id !== action.toSectionId) return s;
        const blocks = [...s.blocks];
        const at = Math.min(Math.max(action.toIndex, 0), blocks.length);
        blocks.splice(at, 0, moved as Block);
        return { ...s, blocks };
      });
      return { ...state, sections: withInsert, dirty: true };
    }

    case "toggle_reviewed":
      return {
        ...state,
        sections: state.sections.map((s) => ({
          ...s,
          blocks: s.blocks.map((b) =>
            b.id === action.blockId
              ? ({ ...b, reviewed: !b.reviewed } as Block)
              : b,
          ),
        })),
        dirty: true,
      };

    default:
      return state;
  }
}

type BuilderContextValue = {
  state: BuilderState;
  dispatch: Dispatch<BuilderAction>;
};

const BuilderContext = createContext<BuilderContextValue | null>(null);

export function BuilderProvider({
  initial,
  children,
}: {
  initial: BuilderState;
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(reducer, initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      if (initial.status === "published") {
        sessionStorage.removeItem(`exam-builder:${initial.examId}`);
        setHydrated(true);
        return;
      }
      const raw = sessionStorage.getItem(`exam-builder:${initial.examId}`);
      if (raw) {
        const draft = JSON.parse(raw) as {
          title?: unknown;
          sections?: unknown;
        };
        if (typeof draft.title === "string" && Array.isArray(draft.sections)) {
          dispatch({
            kind: "restore_draft",
            title: draft.title,
            sections: draft.sections as Section[],
          });
        }
      }
    } catch {
      sessionStorage.removeItem(`exam-builder:${initial.examId}`);
    } finally {
      setHydrated(true);
    }
  }, [initial.examId]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(
        `exam-builder:${state.examId}`,
        JSON.stringify({ title: state.title, sections: state.sections }),
      );
    } catch {
    }
  }, [hydrated, state]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return (
    <BuilderContext.Provider value={value}>{children}</BuilderContext.Provider>
  );
}

export function useBuilder() {
  const ctx = useContext(BuilderContext);
  if (!ctx) throw new Error("useBuilder must be used within a BuilderProvider");
  return ctx;
}

/** The currently selected block, if any. */
export function useSelectedBlock(): Block | null {
  const { state } = useBuilder();
  if (!state.selectedBlockId) return null;
  for (const s of state.sections) {
    const b = s.blocks.find((x) => x.id === state.selectedBlockId);
    if (b) return b;
  }
  return null;
}

/** Live top-bar counters, derived (never stored). */
export function useCounters(): BuilderCounters {
  const { state } = useBuilder();
  return useMemo(() => {
    let questions = 0;
    let marks = 0;
    let unreviewed = 0;
    for (const s of state.sections) {
      for (const b of s.blocks) {
        if (b.type !== "content" && b.type !== "section") {
          questions += 1;
          marks += b.marks;
        }
        if (b.reviewed === false) unreviewed += 1;
      }
    }
    return { sections: state.sections.length, questions, marks, unreviewed };
  }, [state.sections]);
}

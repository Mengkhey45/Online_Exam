"use client";

import { Rows3, Plus } from "lucide-react";
import type { BlockType } from "@/modules/exam";
import { Button } from "@/components/ui/button";
import { PALETTE_GROUPS, defsForGroup } from "../blocks/registry";
import { useBuilder } from "../store";

/**
 * The left palette (AGENTS §7): block types grouped Structure / Objective /
 * Written. Clicking adds the block to the active section — the one holding the
 * selected block, or the last section.
 */
export function Palette() {
  const { state, dispatch } = useBuilder();

  function activeSectionId(): string | null {
    if (state.selectedBlockId) {
      const s = state.sections.find((sec) =>
        sec.blocks.some((b) => b.id === state.selectedBlockId),
      );
      if (s) return s.id;
    }
    return state.sections.at(-1)?.id ?? null;
  }

  function add(blockType: BlockType) {
    const sectionId = activeSectionId();
    // Exams always open with at least one section; if somehow empty, create one
    // first and let the next click place the block.
    if (!sectionId) {
      dispatch({ kind: "add_section" });
      return;
    }
    dispatch({ kind: "add_block", sectionId, blockType });
  }

  return (
    <aside className="w-62 shrink-0 overflow-y-auto border-r border-rule bg-surface">
      <div className="space-y-4 p-3">
        <div className="space-y-1.5">
          <GroupLabel>Structure</GroupLabel>
          <PaletteItem
            icon={<Rows3 className="size-4" />}
            label="Section"
            onClick={() => dispatch({ kind: "add_section" })}
          />
          {defsForGroup("structure").map((def) => (
            <PaletteItem
              key={def.type}
              icon={<def.icon className="size-4" />}
              label={def.label}
              onClick={() => add(def.type)}
            />
          ))}
        </div>

        {PALETTE_GROUPS.filter((g) => g.group !== "structure").map((g) => (
          <div key={g.group} className="space-y-1.5">
            <GroupLabel>{g.label}</GroupLabel>
            {defsForGroup(g.group).map((def) => (
              <PaletteItem
                key={def.type}
                icon={<def.icon className="size-4" />}
                label={def.label}
                onClick={() => add(def.type)}
              />
            ))}
          </div>
        ))}
      </div>
    </aside>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-1 text-xs font-medium uppercase tracking-wide text-ink-3">
      {children}
    </p>
  );
}

function PaletteItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className="group/pi w-full justify-start gap-2 border-rule bg-surface text-ink-2 hover:border-accent-line hover:text-ink"
    >
      <span className="text-ink-3 group-hover/pi:text-accent">{icon}</span>
      {label}
      <Plus className="ml-auto size-3.5 text-ink-3 opacity-0 group-hover/pi:opacity-100" />
    </Button>
  );
}

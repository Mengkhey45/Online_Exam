"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import type { Block } from "@/modules/exam";
import { Button } from "@/components/ui/button";
import { getBlockDef } from "../blocks/registry";
import { moveBlock } from "../reorder";
import { useBuilder } from "../store";
import { SectionCard } from "./section-card";

/** The centre column: sections and blocks, with drag reordering (AGENTS §7). */
export function Sheet() {
  const { state, dispatch } = useBuilder();
  const [activeBlock, setActiveBlock] = useState<Block | null>(null);

  const sensors = useSensors(
    // A small distance so a click selects but a drag reorders.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Canonical question numbering across the whole exam, skipping non-questions.
  const numbers = useMemo(() => {
    const map: Record<string, number> = {};
    let n = 0;
    for (const s of state.sections) {
      for (const b of s.blocks) {
        const def = getBlockDef(b.type);
        if (def?.scored) {
          n += 1;
          map[b.id] = n;
        }
      }
    }
    return map;
  }, [state.sections]);

  function onDragStart(e: DragStartEvent) {
    for (const s of state.sections) {
      const b = s.blocks.find((x) => x.id === e.active.id);
      if (b) {
        setActiveBlock(b);
        return;
      }
    }
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveBlock(null);
    const { active, over } = e;
    if (!over) return;
    const next = moveBlock(state.sections, String(active.id), String(over.id));
    if (next !== state.sections) {
      dispatch({ kind: "set_sections", sections: next });
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 px-6 py-6">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActiveBlock(null)}
      >
        {state.sections.map((section) => (
          <SectionCard key={section.id} section={section} numbers={numbers} />
        ))}

        <DragOverlay>
          {activeBlock ? (
            <div className="rounded-lg border border-accent bg-surface p-2.5 text-sm text-ink shadow-[var(--shadow-pop)]">
              {getBlockDef(activeBlock.type)?.label}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <Button
        variant="outline"
        onClick={() => dispatch({ kind: "add_section" })}
        className="w-full border-dashed"
      >
        <Plus />
        Add section
      </Button>
    </div>
  );
}

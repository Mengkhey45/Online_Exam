"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Shuffle, Trash2 } from "lucide-react";
import type { Section } from "@/modules/exam";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SECTION_DROP_PREFIX } from "../reorder";
import { useBuilder } from "../store";
import { BlockCard } from "./block-card";

/**
 * A section: an editable header plus its droppable list of block cards. Numbers
 * are assigned by the sheet (canonical order) and passed down.
 */
export function SectionCard({
  section,
  numbers,
}: {
  section: Section;
  numbers: Record<string, number>;
}) {
  const { dispatch } = useBuilder();
  const { setNodeRef, isOver } = useDroppable({
    id: `${SECTION_DROP_PREFIX}${section.id}`,
  });

  return (
    <section className="rounded-xl border border-rule bg-surface-sunk/40">
      <header className="flex items-center gap-2 border-b border-rule px-3 py-2">
        <Input
          value={section.title}
          onChange={(e) =>
            dispatch({
              kind: "update_section",
              sectionId: section.id,
              patch: { title: e.target.value },
            })
          }
          aria-label="Section title"
          className="h-8 max-w-xs border-transparent bg-transparent px-1.5 font-semibold text-ink hover:border-rule focus-visible:bg-surface"
        />
        <div className="ml-auto flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-ink-2">
            <Shuffle className="size-3.5 text-ink-3" aria-hidden />
            Shuffle questions
            <Switch
              size="sm"
              checked={section.shuffleQuestions}
              onCheckedChange={(shuffleQuestions) =>
                dispatch({
                  kind: "update_section",
                  sectionId: section.id,
                  patch: { shuffleQuestions },
                })
              }
            />
          </label>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove section"
                  onClick={() =>
                    dispatch({ kind: "remove_section", sectionId: section.id })
                  }
                  className="text-ink-3 hover:text-danger"
                >
                  <Trash2 />
                </Button>
              }
            />
            <TooltipContent>Remove section</TooltipContent>
          </Tooltip>
        </div>
      </header>

      <div
        ref={setNodeRef}
        className={cn(
          "space-y-2 p-3 transition-colors",
          isOver && "bg-accent-soft/40",
        )}
      >
        <SortableContext
          items={section.blocks.map((b) => b.id)}
          strategy={verticalListSortingStrategy}
        >
          {section.blocks.map((block) => (
            <BlockCard key={block.id} block={block} number={numbers[block.id]} />
          ))}
        </SortableContext>

        {section.blocks.length === 0 ? (
          <p className="rounded-md border border-dashed border-rule-strong px-3 py-6 text-center text-sm text-ink-3">
            Add a block from the palette, or drag one here.
          </p>
        ) : null}
      </div>
    </section>
  );
}

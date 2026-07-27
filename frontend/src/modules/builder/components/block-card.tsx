"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Pin } from "lucide-react";
import type { Block } from "@/modules/exam";
import { cn } from "@/lib/utils";
import { QuestionNumber } from "@/components/common/question-number";
import { Tag } from "@/components/common/tag";
import { Button } from "@/components/ui/button";
import { getBlockDef } from "../blocks/registry";
import { useBuilder } from "../store";

/** A block in the sheet: drag handle, number, type, review state, and preview. */
export function BlockCard({
  block,
  number,
}: {
  block: Block;
  number?: number;
}) {
  const { state, dispatch } = useBuilder();
  const def = getBlockDef(block.type);
  const selected = state.selectedBlockId === block.id;
  const needsReview = block.reviewed === false;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id });

  const Icon = def?.icon;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group/block rounded-lg border bg-surface",
        selected
          ? "border-accent ring-1 ring-accent"
          : "border-rule hover:border-rule-strong",
        isDragging && "opacity-50",
      )}
    >
      {/* A div, not a <button>: it contains the Remove button and drag handle,
          and a button can't nest a button (hydration error). role/tabIndex/
          onKeyDown keep it keyboard-operable. */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => dispatch({ kind: "select_block", blockId: block.id })}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            dispatch({ kind: "select_block", blockId: block.id });
          }
        }}
        className="flex w-full cursor-pointer items-start gap-2 rounded-lg p-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        aria-current={selected ? "true" : undefined}
      >
        <span
          {...attributes}
          {...listeners}
          role="button"
          tabIndex={-1}
          aria-label="Drag to reorder"
          onClick={(e) => e.stopPropagation()}
          className="mt-0.5 cursor-grab text-ink-3 hover:text-ink active:cursor-grabbing"
        >
          <GripVertical className="size-4" />
        </span>

        {number !== undefined ? (
          <QuestionNumber n={number} className="mt-0.5" />
        ) : (
          <span className="mt-0.5 flex h-6 items-center px-1 text-ink-3">
            {Icon ? <Icon className="size-4" aria-hidden /> : null}
          </span>
        )}

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-ink-3">{def?.label}</span>
            {block.pinned ? (
              <Tag tone="neutral">
                <Pin aria-hidden />
                Pinned
              </Tag>
            ) : null}
            {def?.scored ? (
              <span className="font-mono text-xs text-ink-3 tabular">
                {block.marks} {block.marks === 1 ? "mark" : "marks"}
              </span>
            ) : null}
            {block.confidence ? (
              <Tag
                tone={
                  block.confidence === "low"
                    ? "flag"
                    : block.confidence === "medium"
                      ? "neutral"
                      : "ok"
                }
              >
                {block.confidence} confidence
              </Tag>
            ) : null}
            {needsReview ? (
              <Tag tone="flag">Needs review</Tag>
            ) : null}
          </div>
          {def ? <def.Body block={block} /> : null}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Remove block"
          onClick={(e) => {
            e.stopPropagation();
            dispatch({ kind: "remove_block", blockId: block.id });
          }}
          className="text-ink-3 opacity-0 hover:text-danger group-hover/block:opacity-100 focus-visible:opacity-100"
        >
          <Trash2 />
        </Button>
      </div>
    </div>
  );
}

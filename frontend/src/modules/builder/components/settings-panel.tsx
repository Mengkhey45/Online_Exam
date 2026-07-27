"use client";

import { MousePointerClick } from "lucide-react";
import type { Block } from "@/modules/exam";
import { Checkbox } from "@/components/ui/checkbox";
import { getBlockDef } from "../blocks/registry";
import { useBuilder, useSelectedBlock } from "../store";

/** The right column. Its content switches by the selected block type (§7). */
export function SettingsPanel() {
  const block = useSelectedBlock();

  return (
    <aside className="w-80 shrink-0 overflow-y-auto border-l border-rule bg-surface">
      {block ? (
        <BlockSettings block={block} />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
          <MousePointerClick className="size-5 text-ink-3" aria-hidden />
          <p className="text-sm text-ink-2">
            Select a block to edit its content and marks.
          </p>
        </div>
      )}
    </aside>
  );
}

function BlockSettings({ block }: { block: Block }) {
  const { dispatch } = useBuilder();
  const def = getBlockDef(block.type);
  if (!def) return null;

  const update = (patch: Partial<Block>) =>
    dispatch({ kind: "update_block", blockId: block.id, patch });

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2 border-b border-rule pb-3">
        <def.icon className="size-4 text-ink-3" aria-hidden />
        <h2 className="text-sm font-semibold text-ink">{def.label}</h2>
      </div>

      {block.reviewed !== undefined ? (
        <label className="flex items-start gap-2 rounded-md bg-flag-soft p-2.5">
          <Checkbox
            checked={block.reviewed}
            onCheckedChange={() =>
              dispatch({ kind: "toggle_reviewed", blockId: block.id })
            }
            className="mt-0.5"
          />
          <span className="space-y-0.5">
            <span className="block text-sm font-medium text-ink">
              Reviewed
            </span>
            <span className="block text-xs text-ink-2">
              AI-imported. Confirm the content before the exam can publish.
            </span>
          </span>
        </label>
      ) : null}

      <def.Settings block={block} update={update} />
    </div>
  );
}

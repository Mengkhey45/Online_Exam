"use client";

import { MousePointerClick, Library } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Block } from "@/modules/exam";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { getBlockDef } from "../blocks/registry";
import { useBuilder, useSelectedBlock } from "../store";
import { useCreateBankQuestion } from "@/modules/bank";

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
  const [bankName, setBankName] = useState("");
  const saveToBank = useCreateBankQuestion();
  const def = getBlockDef(block.type);
  if (!def) return null;

  async function saveBlockToBank() {
    if (!bankName.trim()) {
      toast.error("Enter a bank name before saving to the question bank.");
      return;
    }
    try {
      await saveToBank.mutateAsync({
        bankName: bankName.trim(),
        difficulty: "medium",
        block,
      });
      toast.success("Question saved to the question bank");
    } catch {
      toast.error("Couldn’t save this question to the bank.");
    }
  }

  const update = (patch: Partial<Block>) =>
    dispatch({ kind: "update_block", blockId: block.id, patch });

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2 border-b border-rule pb-3">
        <def.icon className="size-4 text-ink-3" aria-hidden />
        <h2 className="text-sm font-semibold text-ink">{def.label}</h2>
      </div>

      <div className="space-y-2 rounded-md border border-rule bg-surface-sunk/40 p-2.5">
        <div className="flex items-center gap-2 text-xs font-medium text-ink-2">
          <Library className="size-3.5 text-ink-3" aria-hidden />
          Save reusable question
        </div>
        <Input value={bankName} onChange={(event) => setBankName(event.target.value)} placeholder="Question bank name" aria-label="Question bank name" />
        <Button variant="outline" size="sm" className="w-full" onClick={() => void saveBlockToBank()} disabled={saveToBank.isPending}>
          <Library />
          {saveToBank.isPending ? "Saving…" : "Save to question bank"}
        </Button>
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

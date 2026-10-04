"use client";

import { Rows3, Plus, Library } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/errors";
import type { BlockType } from "@/modules/exam";
import type { BankQuestion } from "@/modules/bank";
import { Button } from "@/components/ui/button";
import { PALETTE_GROUPS, defsForGroup } from "../blocks/registry";
import { useBuilder } from "../store";
import { useQuestionBank } from "@/modules/bank";
import { useCopyBankQuestion } from "../queries";

/**
 * The left palette (AGENTS §7): block types grouped Structure / Objective /
 * Written. Clicking adds the block to the active section — the one holding the
 * selected block, or the last section.
 */
export function Palette() {
  const { state, dispatch } = useBuilder();
  const bank = useQuestionBank();
  const copy = useCopyBankQuestion(state.examId);
  const [openBank, setOpenBank] = useState<string | null>(null);
  const bankGroups = useMemo(() => {
    const groups = new Map<string, BankQuestion[]>();
    for (const question of bank.data ?? []) groups.set(question.bankName, [...(groups.get(question.bankName) ?? []), question]);
    return [...groups.entries()];
  }, [bank.data]);

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

  function addFromBank(question: BankQuestion) {
    const sectionId = activeSectionId();
    if (!sectionId) return;
    copy.mutate(
      { questionId: question.id, sectionId },
      { onSuccess: ({ block }) => { dispatch({ kind: "add_existing_block", sectionId, block }); toast.success("Question added to the exam"); }, onError: (error) => toast.error(error instanceof ApiError ? error.message : "Couldn’t add that question. Try again.") },
    );
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

        <div className="space-y-1.5 border-t border-rule pt-4">
          <GroupLabel>Question bank</GroupLabel>
          {bankGroups.map(([name, questions]) => (
            <div key={name} className="space-y-1">
              <Button variant="outline" className="w-full justify-start gap-2 border-rule bg-surface text-left text-ink-2" onClick={() => setOpenBank(openBank === name ? null : name)}>
                <Library className="size-4 shrink-0 text-ink-3" />
                <span className="min-w-0 truncate">{name}</span>
                <span className="ml-auto font-mono text-xs text-ink-3">{questions.length}</span>
              </Button>
              {openBank === name ? questions.map((question) => (
                <Button key={question.id} variant="ghost" disabled={copy.isPending} onClick={() => addFromBank(question)} className="ml-2 w-[calc(100%-0.5rem)] justify-start gap-2 text-left text-xs text-ink-2">
                  <Plus className="size-3.5 shrink-0 text-ink-3" />
                  <span className="truncate">{question.stem}</span>
                </Button>
              )) : null}
            </div>
          ))}
          {!bank.isPending && !bank.data?.length ? (
            <p className="px-1 text-xs text-ink-3">No saved questions yet.</p>
          ) : null}
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

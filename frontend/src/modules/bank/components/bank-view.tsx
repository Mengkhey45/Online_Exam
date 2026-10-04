"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertCircle, Library, Plus, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tag, type Tone } from "@/components/common/tag";
import { MathText } from "@/lib/math/katex";
import type { Block, BlockType } from "@/modules/exam";
import { createBlock, getBlockDef } from "@/modules/builder/blocks/registry";
import { useCreateBankQuestion, useDeleteBank, useDeleteBankQuestion, useQuestionBank, useRenameBank, useUpdateBankQuestion } from "../queries";
import type { BankQuestion, Difficulty } from "../schema";

const DIFFICULTY: Record<Difficulty, { label: string; tone: Tone }> = {
  easy: { label: "Easy", tone: "ok" },
  medium: { label: "Medium", tone: "neutral" },
  hard: { label: "Hard", tone: "flag" },
};
const TYPES: Exclude<BlockType, "section">[] = ["mcq", "multi_select", "fill_blank", "short_answer", "long_answer", "code", "file_upload", "content"];

export function BankView() {
  const { data, isPending, isError, refetch } = useQuestionBank();
  const [query, setQuery] = useState("");
  const [newBankOpen, setNewBankOpen] = useState(false);
  const [activeBank, setActiveBank] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!data) return [];
    return value ? data.filter((q) => q.stem.toLowerCase().includes(value) || q.bankName.toLowerCase().includes(value)) : data;
  }, [data, query]);
  const grouped = useMemo(() => {
    const map = new Map<string, BankQuestion[]>();
    for (const question of filtered) map.set(question.bankName, [...(map.get(question.bankName) ?? []), question]);
    return [...map.entries()];
  }, [filtered]);

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-6">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">Question bank</h1>
          <p className="mt-0.5 text-sm text-ink-2">Create named banks, then add reusable questions inside each one.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative"><Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search banks…" className="w-56 pl-8" aria-label="Search question banks" /></div>
          <Button onClick={() => setNewBankOpen((open) => !open)}><Plus />New question bank</Button>
        </div>
      </header>

      {newBankOpen ? <BankEditor onCreated={(name) => { setNewBankOpen(false); setActiveBank(name); }} /> : null}
      {isPending ? <Loading /> : isError ? <ErrorState onRetry={() => refetch()} /> : grouped.length === 0 && !activeBank ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-rule-strong bg-surface px-6 py-16 text-center"><Library className="size-5 text-accent" aria-hidden /><p className="text-sm font-medium text-ink">No questions added</p><p className="max-w-sm text-sm text-ink-2">Create a question bank, then add questions to it.</p></div>
      ) : (
        <div className="space-y-4">
          {activeBank && !grouped.some(([name]) => name === activeBank) ? <BankGroup bankName={activeBank} questions={[]} expanded onToggle={() => setActiveBank(null)} /> : null}
          {grouped.map(([bankName, questions]) => <BankGroup key={bankName} bankName={bankName} questions={questions} expanded={activeBank === bankName} onToggle={() => setActiveBank(activeBank === bankName ? null : bankName)} />)}
        </div>
      )}
    </div>
  );
}

function BankGroup({ bankName, questions, expanded, onToggle }: { bankName: string; questions: BankQuestion[]; expanded: boolean; onToggle: () => void }) {
  const rename = useRenameBank();
  const remove = useDeleteBank();
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [nextName, setNextName] = useState(bankName);
  function renameBank() {
    if (!nextName.trim() || nextName.trim() === bankName) return;
    rename.mutate({ oldName: bankName, name: nextName.trim() }, { onSuccess: () => setRenameOpen(false) });
  }
  function deleteBank() {
    remove.mutate(bankName, { onSuccess: () => setDeleteOpen(false) });
  }
  return <section className="rounded-xl border border-rule bg-surface"><header className="flex items-center justify-between gap-3 px-4 py-3"><button type="button" onClick={onToggle} className="min-w-0 text-left"><h2 className="truncate text-sm font-semibold text-ink">{bankName}</h2><p className="mt-0.5 text-xs text-ink-3">{questions.length} questions</p></button><div className="flex items-center gap-2"><Button size="sm" variant="ghost" onClick={() => { setNextName(bankName); setRenameOpen(true); }}>Rename</Button><Button size="sm" variant="ghost" onClick={() => setDeleteOpen(true)}>Delete</Button><Button size="sm" variant="outline" onClick={onToggle}><Plus />Add question</Button></div></header>{expanded ? <div className="border-t border-rule p-3"><QuestionEditor bankName={bankName} onCreated={onToggle} /></div> : null}<ul className="divide-y divide-rule border-t border-rule">{questions.map((question) => <QuestionRow key={question.id} question={question} />)}</ul><Dialog open={renameOpen} onOpenChange={setRenameOpen}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>Rename question bank</DialogTitle><DialogDescription>This changes the bank name for all questions inside it.</DialogDescription></DialogHeader><Input value={nextName} onChange={(event) => setNextName(event.target.value)} aria-label="New question bank name" autoFocus /><DialogFooter><Button variant="outline" onClick={() => setRenameOpen(false)}>Cancel</Button><Button onClick={renameBank} disabled={!nextName.trim() || rename.isPending}>{rename.isPending ? "Saving…" : "Save name"}</Button></DialogFooter></DialogContent></Dialog><Dialog open={deleteOpen} onOpenChange={setDeleteOpen}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>Delete question bank?</DialogTitle><DialogDescription>This permanently deletes “{bankName}” and all questions inside it. Questions already copied into exams will remain unchanged.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button><Button variant="destructive" onClick={deleteBank} disabled={remove.isPending}>{remove.isPending ? "Deleting…" : "Delete bank"}</Button></DialogFooter></DialogContent></Dialog></section>;
}

function BankEditor({ onCreated }: { onCreated: (name: string) => void }) {
  const [name, setName] = useState("");
  return <div className="mb-5 rounded-xl border border-accent-line bg-accent-soft/30 p-4"><div className="flex gap-2"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Deep Learning" aria-label="Question bank name" /><Button disabled={!name.trim()} onClick={() => onCreated(name.trim())}>Create bank</Button></div><p className="mt-2 text-xs text-ink-2">The bank name is used as the subject grouping for its questions.</p></div>;
}

function QuestionEditor({ bankName, question, onCreated }: { bankName: string; question?: BankQuestion; onCreated: () => void }) {
  const create = useCreateBankQuestion();
  const update = useUpdateBankQuestion();
  const initialType: Exclude<BlockType, "section"> = question && question.type !== "section" ? question.type : "mcq";
  const [type, setType] = useState<Exclude<BlockType, "section">>(initialType);
  const [difficulty, setDifficulty] = useState<Difficulty>(question?.difficulty ?? "medium");
  const [block, setBlock] = useState<Block>(() => question && question.type !== "section" ? question : createBlock("mcq"));
  const def = getBlockDef(block.type);
  async function submit() {
    try { if (question) { await update.mutateAsync({ id: question.id, difficulty, block }); toast.success("Question updated"); } else { await create.mutateAsync({ bankName, difficulty, block }); toast.success("Question added"); } onCreated(); } catch { toast.error("Couldn’t save the question. Try again."); }
  }
  function changeType(value: Exclude<BlockType, "section">) { setType(value); setBlock(createBlock(value)); }
  return <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><label className="space-y-1 text-xs text-ink-2">Question type<select disabled={Boolean(question)} value={type} onChange={(e) => changeType(e.target.value as typeof type)} className="mt-1 h-8 w-full rounded-lg border border-rule-strong bg-surface px-2 text-sm text-ink">{TYPES.map((item) => <option key={item} value={item}>{item.replace("_", " ")}</option>)}</select></label><label className="space-y-1 text-xs text-ink-2">Difficulty<select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)} className="mt-1 h-8 w-full rounded-lg border border-rule-strong bg-surface px-2 text-sm text-ink"><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label></div>{def ? <def.Settings block={block} update={(patch) => setBlock((current) => ({ ...current, ...patch }))} /> : null}<Button onClick={() => void submit()} disabled={create.isPending || update.isPending}>{create.isPending || update.isPending ? "Saving…" : question ? "Save changes" : "Add question to bank"}</Button></div>;
}

function QuestionRow({ question }: { question: BankQuestion }) {
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const remove = useDeleteBankQuestion();
  const diff = DIFFICULTY[question.difficulty];
  if (editing) return <li className="p-3.5"><QuestionEditor bankName={question.bankName} question={question} onCreated={() => setEditing(false)} /></li>;
  return <li className="p-3.5"><div className="flex items-start justify-between gap-3"><MathText className="block font-serif text-ink">{question.stem}</MathText><div className="flex shrink-0 gap-1"><Button size="sm" variant="ghost" onClick={() => setEditing(true)}>Edit</Button><Button size="sm" variant="ghost" onClick={() => setDeleteOpen(true)} disabled={remove.isPending}>Delete</Button></div></div><div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-3"><Tag tone="neutral">{question.type.replace("_", " ")}</Tag><Tag tone={diff.tone}>{diff.label}</Tag><span className="font-mono tabular">{question.marks} marks</span><span className="text-ink-3">·</span><span className="font-mono tabular">used in {question.usedCount} exams</span></div><Dialog open={deleteOpen} onOpenChange={setDeleteOpen}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>Delete question?</DialogTitle><DialogDescription>This permanently removes the question from the bank. Questions already copied into exams will remain unchanged.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button><Button variant="destructive" onClick={() => remove.mutate(question.id, { onSuccess: () => setDeleteOpen(false) })} disabled={remove.isPending}>{remove.isPending ? "Deleting…" : "Delete question"}</Button></DialogFooter></DialogContent></Dialog></li>;
}
function Loading() { return <div className="space-y-2" aria-busy="true">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>; }
function ErrorState({ onRetry }: { onRetry: () => void }) { return <div role="alert" className="flex flex-col items-center gap-3 rounded-xl border border-danger/30 bg-danger-soft px-6 py-12 text-center"><AlertCircle className="size-5 text-danger" aria-hidden /><p className="text-sm text-ink-2">Couldn’t load the question bank.</p><Button variant="outline" onClick={onRetry}><RefreshCw />Try again</Button></div>; }

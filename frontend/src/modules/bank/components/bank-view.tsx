"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Search, Filter, AlertCircle, RefreshCw, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tag, type Tone } from "@/components/common/tag";
import { MathText } from "@/lib/math/katex";
import { useQuestionBank } from "../queries";
import type { BankQuestion, Difficulty } from "../schema";

const DIFFICULTY: Record<Difficulty, { label: string; tone: Tone }> = {
  easy: { label: "Easy", tone: "ok" },
  medium: { label: "Medium", tone: "neutral" },
  hard: { label: "Hard", tone: "flag" },
};

/** Question bank (parity with the examroom sample): reusable question templates. */
export function BankView() {
  const { data, isPending, isError, refetch } = useQuestionBank();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!data) return [];
    if (!q) return data;
    return data.filter(
      (item) =>
        item.text.toLowerCase().includes(q) ||
        item.subject.toLowerCase().includes(q),
    );
  }, [data, query]);

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-6">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">
            Question bank
          </h1>
          <p className="mt-0.5 text-sm text-ink-2">
            Reusable questions. Adding one to an exam copies its content — editing
            it here never changes an exam that already used it.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-3"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search questions…"
              className="w-56 pl-8"
              aria-label="Search questions"
            />
          </div>
          <Button variant="outline" onClick={() => toast("Filters coming soon")}>
            <Filter />
            Filter
          </Button>
          <Button onClick={() => toast("New question — opens the editor")}>
            <Plus />
            New question
          </Button>
        </div>
      </header>

      {isPending ? (
        <div className="space-y-2" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : isError ? (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 rounded-xl border border-danger/30 bg-danger-soft px-6 py-12 text-center"
        >
          <AlertCircle className="size-5 text-danger" aria-hidden />
          <p className="text-sm text-ink-2">Couldn’t load the question bank.</p>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw />
            Try again
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-rule-strong bg-surface px-6 py-16 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-accent-soft text-accent">
            <Library className="size-5" aria-hidden />
          </div>
          <p className="text-sm font-medium text-ink">
            {query ? "No matching questions" : "No questions yet"}
          </p>
          <p className="max-w-sm text-sm text-ink-2">
            {query
              ? "Try a different search."
              : "Add reusable questions here, then drop them into any exam."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((q) => (
            <QuestionRow key={q.id} question={q} />
          ))}
        </ul>
      )}
    </div>
  );
}

function QuestionRow({ question }: { question: BankQuestion }) {
  const diff = DIFFICULTY[question.difficulty];
  return (
    <li className="rounded-lg border border-rule bg-surface p-3.5 hover:border-rule-strong">
      <MathText className="block font-serif text-ink">{question.text}</MathText>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-3">
        <Tag tone="neutral">{question.type.replace("_", " ")}</Tag>
        <Tag tone="accent">{question.subject}</Tag>
        <Tag tone={diff.tone}>{diff.label}</Tag>
        <span className="font-mono tabular">
          {question.marks} {question.marks === 1 ? "mark" : "marks"}
        </span>
        <span className="text-ink-3">·</span>
        <span className="font-mono tabular">
          used in {question.usedCount}{" "}
          {question.usedCount === 1 ? "exam" : "exams"}
        </span>
      </div>
    </li>
  );
}

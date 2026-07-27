"use client";

import { Circle, Square, Upload } from "lucide-react";
import { MathText } from "@/lib/math/katex";
import { QuestionNumber } from "@/components/common/question-number";
import { cn } from "@/lib/utils";
import type { Block, Section } from "@/modules/exam";

/**
 * Read-only preview of an exam as a student would see it (AGENTS §7). Renders
 * the current builder state — including unsaved edits — with no answering,
 * timer, or lockout. Correct answers are NOT shown: this is the student's view.
 */
export function ExamPreview({
  title,
  sections,
}: {
  title: string;
  sections: Section[];
}) {
  const hasQuestions = sections.some((s) => s.blocks.length > 0);
  let questionNumber = 0;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 px-1 py-2">
      <header className="border-b border-rule pb-4">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-3">
          Preview
        </p>
        <h1 className="mt-1 font-serif text-2xl text-ink">{title}</h1>
      </header>

      {!hasQuestions ? (
        <p className="py-10 text-center text-sm text-ink-3">
          Add questions to see them here.
        </p>
      ) : (
        sections.map((section) => (
          <section key={section.id} className="space-y-5">
            <div className="space-y-1">
              <h2 className="font-serif text-lg font-medium text-ink">
                {section.title}
              </h2>
              {section.instructions ? (
                <p className="text-sm text-ink-2">{section.instructions}</p>
              ) : null}
            </div>

            {section.blocks.map((block) => {
              const isContent =
                block.type === "content" || block.type === "section";
              if (!isContent) questionNumber += 1;
              return (
                <PreviewBlock
                  key={block.id}
                  block={block}
                  number={isContent ? undefined : questionNumber}
                />
              );
            })}
          </section>
        ))
      )}
    </div>
  );
}

function PreviewBlock({
  block,
  number,
}: {
  block: Block;
  number?: number;
}) {
  if (block.type === "content" || block.type === "section") {
    return (
      <div className="rounded-lg border border-rule bg-surface-sunk/40 p-5">
        <MathText className="font-serif leading-relaxed text-ink-2">
          {block.stem}
        </MathText>
      </div>
    );
  }

  // Fill-in-the-blank: show the {{blankId}} placeholders as blanks.
  const stem =
    block.type === "fill_blank"
      ? block.stem.replace(/\{\{[^}]+\}\}/g, "______")
      : block.stem;

  return (
    <article className="flex items-start gap-3">
      {number !== undefined ? (
        <QuestionNumber n={number} className="mt-0.5" />
      ) : null}
      <div className="min-w-0 flex-1 space-y-3">
        <div className="space-y-1">
          <MathText className="font-serif leading-relaxed text-ink">
            {stem}
          </MathText>
          {block.marks > 0 ? (
            <p className="font-mono text-xs text-ink-3 tabular">
              {block.marks} {block.marks === 1 ? "mark" : "marks"}
            </p>
          ) : null}
        </div>
        <AnswerArea block={block} />
      </div>
    </article>
  );
}

/** A non-interactive stand-in for where the student would answer. */
function AnswerArea({ block }: { block: Block }) {
  switch (block.type) {
    case "mcq":
    case "multi_select": {
      const Glyph = block.type === "mcq" ? Circle : Square;
      return (
        <ul className="space-y-1.5">
          {(block.options ?? []).map((o) => (
            <li
              key={o.id}
              className="flex items-start gap-2 rounded-md border border-rule bg-surface px-3 py-2"
            >
              <Glyph className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden />
              <MathText className="font-serif text-ink-2">{o.text}</MathText>
            </li>
          ))}
        </ul>
      );
    }
    case "short_answer":
      return <AnswerBox className="h-10" hint="Short answer" />;
    case "long_answer":
      return <AnswerBox className="h-24" hint="Written answer" />;
    case "code":
      return (
        <div className="rounded-md border border-rule bg-surface-sunk/60 p-3">
          <p className="font-mono text-xs text-ink-3">
            {block.language ? `${block.language} — ` : ""}code answer
          </p>
        </div>
      );
    case "file_upload":
      return (
        <div className="flex items-center gap-2 rounded-md border border-dashed border-rule-strong bg-surface px-3 py-3 text-sm text-ink-3">
          <Upload className="size-4" aria-hidden />
          Student uploads a file
        </div>
      );
    default:
      return null;
  }
}

function AnswerBox({ className, hint }: { className?: string; hint: string }) {
  return (
    <div
      className={cn(
        "flex items-start rounded-md border border-rule bg-surface px-3 py-2 text-sm text-ink-3",
        className,
      )}
    >
      {hint}
    </div>
  );
}

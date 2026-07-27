"use client";

import { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";

/**
 * KaTeX wrapper. Exam stems and options may contain inline LaTeX delimited by
 * `$…$` (AGENTS §6). This splits a string into text and math runs and renders
 * the math; invalid LaTeX is shown literally rather than throwing.
 */

type Token = { type: "text" | "math"; value: string };

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  const re = /\$([^$]+)\$/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(input)) !== null) {
    if (m.index > last) {
      tokens.push({ type: "text", value: input.slice(last, m.index) });
    }
    tokens.push({ type: "math", value: m[1] });
    last = m.index + m[0].length;
  }
  if (last < input.length) {
    tokens.push({ type: "text", value: input.slice(last) });
  }
  return tokens;
}

function renderMath(tex: string): string {
  try {
    return katex.renderToString(tex, {
      throwOnError: false,
      displayMode: false,
      output: "html",
    });
  } catch {
    return "";
  }
}

/**
 * Renders a string that may contain `$…$` inline math. Set `blankPlaceholder`
 * to also swap `{{blankId}}` tokens for a visible slot (used by fill-blank
 * previews). The runtime replaces blanks with real inputs instead.
 */
export function MathText({
  children,
  className,
  blankPlaceholder = false,
}: {
  children: string;
  className?: string;
  blankPlaceholder?: boolean;
}) {
  const nodes = useMemo(() => {
    const source = blankPlaceholder
      ? children.replace(/\{\{[^}]+\}\}/g, "$__BLANK__$")
      : children;
    return tokenize(source);
  }, [children, blankPlaceholder]);

  return (
    <span className={className}>
      {nodes.map((t, i) => {
        if (t.type === "text") return <span key={i}>{t.value}</span>;
        if (blankPlaceholder && t.value === "__BLANK__") {
          return (
            <span
              key={i}
              className="mx-0.5 inline-block min-w-16 border-b-2 border-dashed border-ink-3 align-baseline"
              aria-label="blank"
            />
          );
        }
        return (
          <span
            key={i}
            className={cn("katex-inline")}
            // KaTeX output is trusted (we generated it from the stem).
            dangerouslySetInnerHTML={{ __html: renderMath(t.value) }}
          />
        );
      })}
    </span>
  );
}

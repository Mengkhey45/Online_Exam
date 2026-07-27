"use client";

import { Fragment } from "react";
import { MathText } from "@/lib/math/katex";
import { Input } from "@/components/ui/input";
import type { RuntimeRenderer } from "./types";

/**
 * Fill in the blank. The stem is split on `{{blankId}}` tokens; each becomes an
 * inline input. Answers are stored per blank ID in answer.blankAnswers.
 */
export const FillBlankRuntime: RuntimeRenderer = ({ block, answer, onChange }) => {
  const values = answer?.blankAnswers ?? {};
  const parts = block.stem.split(/(\{\{[^}]+\}\})/g);

  function setBlank(id: string, value: string) {
    onChange({ blankAnswers: { ...values, [id]: value } });
  }

  return (
    <p className="font-serif text-lg leading-relaxed text-ink">
      {parts.map((part, i) => {
        const m = part.match(/^\{\{([^}]+)\}\}$/);
        if (m) {
          const id = m[1];
          return (
            <Input
              key={i}
              value={values[id] ?? ""}
              onChange={(e) => setBlank(id, e.target.value)}
              aria-label={`Blank ${id}`}
              className="mx-1 inline-block h-8 w-40 align-baseline font-serif"
            />
          );
        }
        return (
          <Fragment key={i}>
            <MathText>{part}</MathText>
          </Fragment>
        );
      })}
    </p>
  );
};

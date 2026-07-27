"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tag } from "@/components/common/tag";
import {
  TARGET_FIELDS,
  type Mapping,
  type RawRoster,
} from "../schema";

const NONE = "__none__";

/** Map source columns to roster fields (AGENTS §7). Required fields must map. */
export function MappingStep({
  raw,
  mapping,
  onChange,
}: {
  raw: RawRoster;
  mapping: Mapping;
  onChange: (m: Mapping) => void;
}) {
  return (
    <div className="rounded-xl border border-rule bg-surface p-4">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-sm font-semibold text-ink">Map columns</h2>
        <Tag tone="neutral">{raw.filename}</Tag>
      </div>

      <div className="space-y-2">
        {TARGET_FIELDS.map((f) => {
          const current = mapping[f.id];
          return (
            <div
              key={f.id}
              className="grid grid-cols-2 items-center gap-3 rounded-md border border-rule px-3 py-2"
            >
              <div className="text-sm">
                <span className="font-medium text-ink">{f.label}</span>
                {f.required ? (
                  <span className="ml-1.5 text-xs text-ink-3">required</span>
                ) : (
                  <span className="ml-1.5 text-xs text-ink-3">optional</span>
                )}
              </div>
              <Select
                value={current === null ? NONE : String(current)}
                onValueChange={(v) =>
                  onChange({
                    ...mapping,
                    [f.id]: v === NONE ? null : Number(v),
                  })
                }
              >
                <SelectTrigger
                  className="w-full"
                  aria-invalid={f.required && current === null}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>— Not mapped —</SelectItem>
                  {raw.columns.map((c, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>
    </div>
  );
}

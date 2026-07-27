"use client";

import { Controller, useFormContext } from "react-hook-form";
import { AlertCircle } from "lucide-react";
import type { ExamConfig } from "../../schema";
import { Switch } from "@/components/ui/switch";
import { ConfigSection, ToggleField } from "../config-fields";

/**
 * Answer methods (AGENTS §7). Disabling every method is blocked with inline
 * validation — a schema refine surfaces the error here.
 */
export function WorkspaceTab() {
  const {
    control,
    watch,
    formState: { errors },
  } = useFormContext<ExamConfig>();
  const methods = watch("workspace.methods");

  // The refine attaches its message to workspace.methods.
  const methodsError = errors.workspace?.methods?.message as string | undefined;
  const noneEnabled = !methods.some((m) => m.enabled);

  return (
    <ConfigSection
      title="How students answer"
      description="Turn on the input methods this exam needs."
    >
      {noneEnabled || methodsError ? (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger"
        >
          <AlertCircle className="size-4 shrink-0" aria-hidden />
          {methodsError ?? "Enable at least one way for students to answer."}
        </div>
      ) : null}

      <div className="space-y-2">
        {methods.map((m, i) => (
          <ToggleField key={m.id} label={m.label} description={m.description}>
            <Controller
              control={control}
              name={`workspace.methods.${i}.enabled`}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  aria-label={`Enable ${m.label}`}
                  aria-invalid={noneEnabled}
                />
              )}
            />
          </ToggleField>
        ))}
      </div>
    </ConfigSection>
  );
}

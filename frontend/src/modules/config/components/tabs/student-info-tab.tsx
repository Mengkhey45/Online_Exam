"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Lock } from "lucide-react";
import type { ExamConfig } from "../../schema";
import { Switch } from "@/components/ui/switch";
import { ConfigSection, ToggleField } from "../config-fields";

/** Toggle list of student details to collect on entry (AGENTS §7). */
export function StudentInfoTab() {
  const { control, watch } = useFormContext<ExamConfig>();
  const fields = watch("studentInfo.fields");

  return (
    <ConfigSection
      title="Information to collect"
      description="Choose what students confirm before starting. Student ID is always collected."
    >
      <div className="space-y-2">
        {fields.map((f, i) => (
          <ToggleField
            key={f.id}
            label={f.label}
            disabled={f.locked}
            description={f.locked ? "Always collected" : undefined}
          >
            {f.locked ? (
              <Lock className="size-4 text-ink-3" aria-label="Required" />
            ) : (
              <Controller
                control={control}
                name={`studentInfo.fields.${i}.collect`}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    aria-label={`Collect ${f.label}`}
                  />
                )}
              />
            )}
          </ToggleField>
        ))}
      </div>
    </ConfigSection>
  );
}

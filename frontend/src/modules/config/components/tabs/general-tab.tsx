"use client";

import { Controller, useFormContext } from "react-hook-form";
import { EyeOff } from "lucide-react";
import type { ExamConfig } from "../../schema";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfigSection, Field } from "../config-fields";

const ACCESS_OPTIONS = [
  { value: "open", label: "Open — anyone with the key" },
  { value: "closed", label: "Closed — invited students only" },
  { value: "discoverable", label: "Discoverable — listed to students" },
  { value: "scheduled", label: "Scheduled — opens at a set time" },
] as const;

export function GeneralTab() {
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = useFormContext<ExamConfig>();

  const access = watch("general.access");

  return (
    <div className="space-y-8">
      <ConfigSection title="Timing and grading">
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Duration (minutes)"
            htmlFor="duration"
            error={errors.general?.durationMinutes?.message}
          >
            <Input
              id="duration"
              type="number"
              min={1}
              className="font-mono tabular"
              {...register("general.durationMinutes", { valueAsNumber: true })}
            />
          </Field>
          <Field
            label="Pass mark (%)"
            htmlFor="passmark"
            hint="Enforced by the server, not the browser."
            error={errors.general?.passMarkPct?.message}
          >
            <Input
              id="passmark"
              type="number"
              min={0}
              max={100}
              className="font-mono tabular"
              {...register("general.passMarkPct", { valueAsNumber: true })}
            />
          </Field>
        </div>
      </ConfigSection>

      <ConfigSection title="Access">
        <Field label="Who can enter" error={errors.general?.access?.message}>
          <Controller
            control={control}
            name="general.access"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCESS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        {access === "scheduled" ? (
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Opens"
              htmlFor="start"
              error={errors.general?.scheduledStart?.message}
            >
              <Input
                id="start"
                type="datetime-local"
                className="font-mono"
                {...register("general.scheduledStart")}
              />
            </Field>
            <Field label="Closes" htmlFor="end">
              <Input
                id="end"
                type="datetime-local"
                className="font-mono"
                {...register("general.scheduledEnd")}
              />
            </Field>
          </div>
        ) : null}
      </ConfigSection>

      {/* Read-only reminder — student identities are anonymised (rule 3.5). */}
      <div className="flex items-start gap-2.5 rounded-lg border border-rule bg-surface-sunk/60 px-3 py-2.5">
        <EyeOff className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden />
        <p className="text-sm text-ink-2">
          During an in-progress exam and until results are released, teacher
          screens show <span className="font-medium text-ink">student IDs only</span>,
          never names. This can’t be turned off.
        </p>
      </div>
    </div>
  );
}

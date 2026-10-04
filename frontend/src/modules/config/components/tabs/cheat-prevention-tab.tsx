"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Shield, ShieldCheck, ShieldAlert, Check } from "lucide-react";
import type { ExamConfig } from "../../schema";
import type { SecurityLevel } from "@/modules/exam";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { ConfigSection, Field, ToggleField } from "../config-fields";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const LEVELS: {
  value: SecurityLevel;
  label: string;
  blurb: string;
  Icon: typeof Shield;
}[] = [
  { value: "low", label: "Low", blurb: "Shuffling only. Best for practice.", Icon: Shield },
  { value: "medium", label: "Medium", blurb: "Fullscreen and tab-switch checks.", Icon: ShieldCheck },
  { value: "high", label: "High", blurb: "Strict lockdown for invigilated exams.", Icon: ShieldAlert },
];

export function CheatPreventionTab() {
  const { control, watch } = useFormContext<ExamConfig>();
  const level = watch("cheatPrevention.level");

  return (
    <div className="space-y-8">
      <ConfigSection
        title="Security level"
        description="Higher levels add more restrictions for students. Flags are always for a teacher to review, never automatic penalties."
      >
        <Controller
          control={control}
          name="cheatPrevention.level"
          render={({ field }) => (
            <div
              role="radiogroup"
              aria-label="Security level"
              className="grid grid-cols-3 gap-3"
            >
              {LEVELS.map((l) => {
                const selected = field.value === l.value;
                return (
                  <button
                    key={l.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => field.onChange(l.value)}
                    className={cn(
                      "relative flex flex-col gap-1.5 rounded-lg border p-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent/50",
                      selected
                        ? "border-accent bg-accent-soft"
                        : "border-rule bg-surface hover:border-rule-strong",
                    )}
                  >
                    {selected ? (
                      <Check className="absolute right-2 top-2 size-4 text-accent" aria-hidden />
                    ) : null}
                    <l.Icon
                      className={cn("size-5", selected ? "text-accent" : "text-ink-3")}
                      aria-hidden
                    />
                    <span className="text-sm font-medium text-ink">{l.label}</span>
                    <span className="text-xs text-ink-2">{l.blurb}</span>
                  </button>
                );
              })}
            </div>
          )}
        />
      </ConfigSection>

      {/* Only the selected level's sub-settings are shown (AGENTS §7). */}
      {level === "low" ? <LowSettings /> : null}
      {level === "medium" ? <MediumSettings /> : null}
      {level === "high" ? <HighSettings /> : null}
    </div>
  );
}

function SwitchField({
  name,
  label,
  description,
  disabled = false,
  disabledReason,
}: {
  name: string;
  label: string;
  description?: string;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const { control } = useFormContext<ExamConfig>();
  const field = (
    <ToggleField label={label} description={description}>
      <Controller
        control={control}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        name={name as any}
        render={({ field: controllerField }) => (
          <Switch
            checked={Boolean(controllerField.value)}
            onCheckedChange={controllerField.onChange}
            aria-label={label}
            disabled={disabled}
          />
        )}
      />
    </ToggleField>
  );

  if (!disabled || !disabledReason) return field;
  return (
    <Tooltip>
      <TooltipTrigger render={<span className="block" tabIndex={0} />}>
        {field}
      </TooltipTrigger>
      <TooltipContent>{disabledReason}</TooltipContent>
    </Tooltip>
  );
}

function LowSettings() {
  return (
    <ConfigSection title="Low — settings">
      <div className="space-y-2">
        <SwitchField name="cheatPrevention.low.shuffleQuestions" label="Shuffle questions" description="Present sections in a random order per student." />
        <SwitchField name="cheatPrevention.low.shuffleOptions" label="Shuffle options" description="Randomise answer options per student." />
      </div>
    </ConfigSection>
  );
}

function MediumSettings() {
  const { register } = useFormContext<ExamConfig>();
  return (
    <ConfigSection title="Medium — settings">
      <div className="space-y-2">
        <SwitchField name="cheatPrevention.medium.requireFullscreen" label="Require fullscreen" description="Ask students to enter fullscreen to start." />
        <SwitchField name="cheatPrevention.medium.warnOnTabSwitch" label="Note tab switches" description="Record when a student leaves the exam tab, for review." />
      </div>
      <Field
        label="Pause after this many tab switches"
        htmlFor="lockAfter"
        hint="The student writes a note and resumes; nothing is scored automatically."
      >
        <Input
          id="lockAfter"
          type="number"
          min={1}
          max={10}
          className="w-24 font-mono tabular"
          {...register("cheatPrevention.medium.lockAfterSwitches", { valueAsNumber: true })}
        />
      </Field>
    </ConfigSection>
  );
}

function HighSettings() {
  return (
    <ConfigSection title="High — settings">
      <div className="space-y-2">
        <SwitchField name="cheatPrevention.high.requireFullscreen" label="Lock to fullscreen" description="Leaving fullscreen pauses the exam." />
        <SwitchField name="cheatPrevention.high.blockCopyPaste" label="Block copy and paste" />
        <SwitchField
          name="cheatPrevention.high.singleDevice"
          label="Single device only"
          description="Prevent opening the exam on a second device."
          disabled
          disabledReason="Single-device enforcement is coming soon."
        />
        <SwitchField
          name="cheatPrevention.high.requireCamera"
          label="Require camera"
          description="Students share their camera for the sitting."
          disabled
          disabledReason="Live camera monitoring is coming soon."
        />
      </div>
    </ConfigSection>
  );
}

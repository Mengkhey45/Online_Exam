"use client";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

/** A titled section within a tab. */
export function ConfigSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="space-y-0.5">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        {description ? (
          <p className="text-sm text-ink-2">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

/** A labelled field with optional hint and inline error. */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-xs font-medium text-ink-2">
        {label}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-ink-3">{hint}</p>
      ) : null}
    </div>
  );
}

/** An inline toggle row used across the config tabs. */
export function ToggleField({
  label,
  description,
  disabled,
  children,
}: {
  label: string;
  description?: string;
  disabled?: boolean;
  children: React.ReactNode; // the Switch/Checkbox control
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-md border border-rule bg-surface px-3 py-2.5",
        disabled && "opacity-70",
      )}
    >
      <div className="space-y-0.5">
        <p className="text-sm text-ink">{label}</p>
        {description ? (
          <p className="text-xs text-ink-3">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

"use client";

import { Check, HardDriveDownload, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SaveState } from "../types";

/**
 * The save indicator (AGENTS §3.2). Exactly three states, never more. Offline
 * is reassuring, not alarming — answers are safe on the device — so it uses the
 * ochre flag tone, not red.
 */
const CONFIG: Record<
  SaveState,
  { label: string; Icon: typeof Check; className: string; spin?: boolean }
> = {
  saved: { label: "Saved", Icon: Check, className: "text-ok" },
  saving: { label: "Saving…", Icon: RefreshCw, className: "text-ink-3", spin: true },
  offline: {
    label: "Offline — answers stored on this device",
    Icon: HardDriveDownload,
    className: "text-flag",
  },
};

export function SaveIndicator({ state }: { state: SaveState }) {
  const { label, Icon, className, spin } = CONFIG[state];
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 text-xs font-medium", className)}
      role="status"
      aria-live="polite"
    >
      <Icon className={cn("size-3.5", spin && "motion-safe:animate-spin")} aria-hidden />
      {label}
    </span>
  );
}

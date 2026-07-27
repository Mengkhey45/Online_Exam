import type { ProctoringEvent } from "@/modules/exam";
import type { Tone } from "@/components/common/tag";
import type { AttemptStatus } from "./schema";

/**
 * Neutral, descriptive language everywhere (AGENTS §3.4). We say what happened —
 * "left the exam window", "worth a look" — never "cheating", "violation", or
 * "suspicious". Flag states use the ochre flag tone, never red.
 */
export const STATUS_LABEL: Record<AttemptStatus, { label: string; tone: Tone }> = {
  not_started: { label: "Not started", tone: "neutral" },
  in_progress: { label: "In progress", tone: "accent" },
  submitted: { label: "Submitted", tone: "ok" },
  locked: { label: "Paused", tone: "flag" },
  disconnected: { label: "Disconnected", tone: "flag" },
};

export function eventLabel(e: ProctoringEvent): string {
  switch (e.type) {
    case "blur":
      return "Left the exam window";
    case "fullscreen_exit":
      return "Exited fullscreen";
    case "paste":
      return e.charCount
        ? `Pasted text (${e.charCount} characters)`
        : "Pasted text";
    case "burst":
      return "Fast typing burst";
    case "share_stop":
      return "Stopped screen share";
    case "disconnect":
      return "Lost connection";
    default:
      return "Activity";
  }
}

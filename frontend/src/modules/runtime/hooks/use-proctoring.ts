"use client";

import { useEffect, useRef } from "react";
import type { ProctoringEvent } from "@/modules/exam";
import { postProctoringEvents } from "../queries";

type EventType = ProctoringEvent["type"];
type Extra = { durationMs?: number; charCount?: number };

const FLUSH_INTERVAL_MS = 10_000;

/**
 * Proctoring telemetry producer (AGENTS §7). Watches for leaving the exam
 * surface and batches events to the server, which stores them as evidence for
 * the teacher's monitoring view. This never blocks the student or changes a
 * score — it only records (rule 3.4). Runs only for medium/high security.
 *
 * Refs only, no state: telemetry is fire-and-forget and must never trigger a
 * re-render of the exam the student is sitting.
 */
export function useProctoring(attemptId: string, enabled: boolean): void {
  const queue = useRef<ProctoringEvent[]>([]);
  const blurStart = useRef<number | null>(null);
  const wasFullscreen = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const enqueue = (type: EventType, extra?: Extra) => {
      queue.current.push({
        id: crypto.randomUUID(),
        type,
        at: new Date().toISOString(),
        ...extra,
      });
    };

    const flush = async () => {
      if (queue.current.length === 0) return;
      const batch = queue.current;
      queue.current = [];
      try {
        await postProctoringEvents(attemptId, batch);
      } catch {
        // Re-queue oldest-first so nothing is lost across a transient failure.
        queue.current = [...batch, ...queue.current];
      }
    };

    // Focus leaves the window — record how long until it returns. The server
    // discards blurs under 2000ms (IME switches, notifications), so brief
    // glances aren't treated as behaviour.
    const onBlur = () => {
      blurStart.current = Date.now();
    };
    const onFocus = () => {
      if (blurStart.current !== null) {
        enqueue("blur", { durationMs: Date.now() - blurStart.current });
        blurStart.current = null;
      }
    };

    // Leaving fullscreen (only when we were actually in it).
    const onFullscreenChange = () => {
      const isFullscreen = document.fullscreenElement !== null;
      if (wasFullscreen.current && !isFullscreen) enqueue("fullscreen_exit");
      wasFullscreen.current = isFullscreen;
    };

    const onPaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData("text") ?? "";
      enqueue("paste", { charCount: text.length });
    };

    // Send what we have before the tab is backgrounded or closed.
    const onVisibility = () => {
      if (document.visibilityState === "hidden") void flush();
    };

    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("paste", onPaste, true);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onVisibility);
    const interval = window.setInterval(() => void flush(), FLUSH_INTERVAL_MS);

    return () => {
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("paste", onPaste, true);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onVisibility);
      window.clearInterval(interval);
      void flush();
    };
  }, [attemptId, enabled]);
}

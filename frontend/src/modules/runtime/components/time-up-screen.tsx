"use client";

import { useEffect, useRef, useState } from "react";
import { Clock, RefreshCw } from "lucide-react";
import { submitAttempt } from "../queries";
import { useRuntime } from "../store";

const RETRY_MS = 5_000;
/** After this many failed answer syncs, submit anyway so the attempt closes. */
const MAX_FLUSH_TRIES = 3;

/**
 * Shown the moment the timer reaches 00:00 (AGENTS §7). Answering stops, the
 * last answers are sent, and the exam is submitted — retrying quietly until it
 * lands, so a student who is offline at the deadline is submitted on reconnect.
 */
export function TimeUpScreen({
  attemptId,
  onSubmitted,
}: {
  attemptId: string;
  onSubmitted: () => void;
}) {
  const { flushNow } = useRuntime();
  const [waiting, setWaiting] = useState(false);
  const done = useRef(false);

  useEffect(() => {
    let alive = true;
    let flushTries = 0;

    async function run() {
      while (alive && !done.current) {
        const synced = await flushNow();
        flushTries += 1;
        if (synced || flushTries >= MAX_FLUSH_TRIES) {
          try {
            await submitAttempt(attemptId);
            done.current = true;
            if (alive) onSubmitted();
            return;
          } catch {
            // Offline or server unreachable — keep trying.
          }
        }
        if (!alive) return;
        setWaiting(true);
        await new Promise((r) => setTimeout(r, RETRY_MS));
      }
    }
    void run();
    return () => {
      alive = false;
    };
  }, [attemptId, flushNow, onSubmitted]);

  return (
    <main className="flex min-h-svh items-center justify-center bg-paper px-6 py-10">
      <section
        role="alertdialog"
        aria-live="assertive"
        className="w-full max-w-md space-y-5 rounded-lg border border-rule bg-surface p-8 text-center"
      >
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-flag-soft text-flag">
          <Clock className="size-5" aria-hidden />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-ink">Time is up</h1>
          <p className="text-sm leading-6 text-ink-2">
            Answering has stopped. Your answers are being submitted.
          </p>
        </div>
        <p className="flex items-center justify-center gap-2 text-sm text-ink-2">
          <RefreshCw className="size-4 motion-safe:animate-spin" aria-hidden />
          {waiting
            ? "Waiting for a connection. Keep this page open — your answers are stored on this device."
            : "Submitting…"}
        </p>
      </section>
    </main>
  );
}

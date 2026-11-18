"use client";

import { Maximize2, PauseCircle, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import type { SecurityLevel } from "@/modules/exam";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/** Require a real browser gesture before entering a supervised exam. */
export function FullscreenGate({
  security,
  onExit,
  locked = false,
  onSendNote,
  children,
}: {
  security: SecurityLevel;
  onExit?: () => void;
  locked?: boolean;
  /** When set, the paused screen lets the student explain what happened. */
  onSendNote?: (note: string) => Promise<void>;
  children: React.ReactNode;
}) {
  const required = security === "medium" || security === "high";
  const [entered, setEntered] = useState(() =>
    typeof document !== "undefined" && document.fullscreenElement !== null,
  );
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState(false);
  const [started, setStarted] = useState(false);
  const [exitBlocked, setExitBlocked] = useState(false);

  useEffect(() => {
    if (!required) return;
    const onFullscreenChange = () => {
      const isFullscreen = document.fullscreenElement !== null;
      setEntered(isFullscreen);
      if (isFullscreen) setStarted(true);
      else if (started && security === "high") {
        setExitBlocked(true);
        onExit?.();
      }
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, [required, onExit, started, security]);

  const blocked = locked || exitBlocked;

  if (blocked) return <PausedScreen onSendNote={onSendNote} />;

  if (
    !required ||
    (security === "medium" && started) ||
    (security === "high" && !blocked && entered)
  ) {
    return <>{children}</>;
  }

  async function enterFullscreen() {
    setRequesting(true);
    setError(false);
    try {
      await document.documentElement.requestFullscreen();
      setEntered(true);
      setStarted(true);
    } catch {
      setError(true);
    } finally {
      setRequesting(false);
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-paper px-6 py-10">
      <section className="w-full max-w-md space-y-5 rounded-lg border border-rule bg-surface p-8 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-accent-soft text-accent">
          <Maximize2 className="size-5" aria-hidden />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-ink">Enter fullscreen to begin</h1>
          <p className="text-sm leading-6 text-ink-2">
            This exam requires fullscreen mode before you can start answering.
          </p>
        </div>
        {error ? (
          <p className="text-sm text-danger" role="alert">
            Fullscreen permission was not granted. Use the button to try again.
          </p>
        ) : null}
        <Button className="w-full" onClick={enterFullscreen} disabled={requesting}>
          {requesting ? <RefreshCw className="motion-safe:animate-spin" /> : <Maximize2 />}
          {requesting ? "Entering fullscreen…" : "Enter fullscreen"}
        </Button>
      </section>
    </main>
  );
}

/**
 * High-security pause, waiting for the teacher (AGENTS §7). Neutral language —
 * a pause, not an accusation (rule 3.4). The optional note goes to the
 * teacher's unlock queue.
 */
function PausedScreen({ onSendNote }: { onSendNote?: (note: string) => Promise<void> }) {
  const [note, setNote] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed">("idle");

  async function send() {
    if (!onSendNote || !note.trim()) return;
    setState("sending");
    try {
      await onSendNote(note);
      setState("sent");
    } catch {
      setState("failed");
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-paper px-6 py-10">
      <section className="w-full max-w-md space-y-5 rounded-lg border border-rule bg-surface p-8">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-full bg-flag-soft text-flag">
            <PauseCircle className="size-5" aria-hidden />
          </span>
          <div>
            <h1 className="text-base font-semibold text-ink">Your exam is paused</h1>
            <p className="text-sm text-ink-2">Your teacher must unlock it before you can continue.</p>
          </div>
        </div>
        <p className="rounded-md bg-surface-sunk px-3 py-2 text-sm text-ink-2">
          Your answers are saved. The timer keeps running while paused. This page
          continues automatically once you’re unlocked.
        </p>
        {onSendNote ? (
          <div className="space-y-2">
            <Label htmlFor="pause-note" className="text-sm text-ink-2">
              Add a note for your teacher (optional)
            </Label>
            <Textarea
              id="pause-note"
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                if (state !== "sending") setState("idle");
              }}
              rows={3}
              maxLength={1000}
              placeholder="e.g. my browser switched apps"
            />
            {state === "failed" ? (
              <p role="alert" className="text-sm text-danger">Couldn’t send your note. Check your connection and try again.</p>
            ) : null}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => void send()}
              disabled={!note.trim() || state === "sending" || state === "sent"}
            >
              {state === "sending" ? "Sending…" : state === "sent" ? "Note sent" : "Send note"}
            </Button>
          </div>
        ) : null}
      </section>
    </main>
  );
}
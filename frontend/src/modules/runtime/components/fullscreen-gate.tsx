"use client";

import { Maximize2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import type { SecurityLevel } from "@/modules/exam";
import { Button } from "@/components/ui/button";

/** Require a real browser gesture before entering a supervised exam. */
export function FullscreenGate({
  security,
  onExit,
  locked = false,
  children,
}: {
  security: SecurityLevel;
  onExit?: () => void;
  locked?: boolean;
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
  }, [required, onExit, started]);

  const blocked = locked || exitBlocked;

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
          <h1 className="text-xl font-semibold text-ink">
            {blocked ? "Exam paused" : "Enter fullscreen to begin"}
          </h1>
          <p className="text-sm leading-6 text-ink-2">
            {blocked
              ? "Your teacher must unlock the exam before you can continue."
              : "This exam requires fullscreen mode before you can start answering."}
          </p>
        </div>
        {error && !blocked ? (
          <p className="text-sm text-danger" role="alert">
            Fullscreen permission was not granted. Use the button to try again.
          </p>
        ) : null}
        {!blocked ? (
          <Button className="w-full" onClick={enterFullscreen} disabled={requesting}>
            {requesting ? <RefreshCw className="motion-safe:animate-spin" /> : <Maximize2 />}
            {requesting ? "Entering fullscreen…" : "Enter fullscreen"}
          </Button>
        ) : null}
      </section>
    </main>
  );
}
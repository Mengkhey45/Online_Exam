"use client";

import { useCallback, useEffect, useState } from "react";
import { lockAttempt } from "../queries";

export type Lockout = { reason: string };

/**
 * Medium-security lockout detection (AGENTS §7). Watches for leaving the exam
 * window. Language stays neutral and descriptive — this is a pause and a note,
 * never an accusation (rule 3.4).
 */
export function useLockout(
  enabled: boolean,
  attemptId: string,
  serverLocked: boolean,
  persistLock = false,
) {
  const [lock, setLock] = useState<Lockout | null>(null);

  const lockNow = useCallback(
    (reason: string) => {
      setLock((current) => current ?? { reason });
      if (persistLock) void lockAttempt(attemptId, reason).catch(() => undefined);
    },
    [attemptId, persistLock],
  );

  useEffect(() => {
    if (!enabled) return;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        lockNow("You switched away from the exam tab.");
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [enabled, lockNow]);

  useEffect(() => {
    if (!persistLock) return;
    if (!serverLocked) setLock(null);
    else setLock((current) => current ?? { reason: "The exam is paused while your teacher reviews the activity." });
  }, [persistLock, serverLocked]);

  return { lock, lockNow, clear: () => setLock(null) };
}

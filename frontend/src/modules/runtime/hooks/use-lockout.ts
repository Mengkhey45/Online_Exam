"use client";

import { useEffect, useState } from "react";

export type Lockout = { reason: string };

/**
 * Medium-security lockout detection (AGENTS §7). Watches for leaving the exam
 * window. Language stays neutral and descriptive — this is a pause and a note,
 * never an accusation (rule 3.4).
 */
export function useLockout(enabled: boolean) {
  const [lock, setLock] = useState<Lockout | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        setLock((l) => l ?? { reason: "You switched away from the exam tab." });
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [enabled]);

  return { lock, clear: () => setLock(null) };
}

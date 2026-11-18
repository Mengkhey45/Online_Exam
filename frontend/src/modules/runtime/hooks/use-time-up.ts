"use client";

import { useEffect, useState } from "react";

/**
 * True once the attempt's deadline has passed. Unlike useCountdown it does not
 * tick every second — it schedules one timer for the deadline, so the exam
 * tree isn't re-rendered each second just to watch for time-up.
 */
export function useTimeUp(expiresAtIso: string): boolean {
  const expiry = new Date(expiresAtIso).getTime();
  const [timeUp, setTimeUp] = useState(() => Date.now() >= expiry);

  useEffect(() => {
    const remaining = expiry - Date.now();
    if (remaining <= 0) return; // already true from the initial state
    // setTimeout caps at ~24.8 days; exams are far shorter, but re-check anyway.
    const t = setTimeout(
      () => setTimeUp(Date.now() >= expiry),
      Math.min(remaining, 2 ** 31 - 1),
    );
    return () => clearTimeout(t);
  }, [expiry]);

  return timeUp;
}

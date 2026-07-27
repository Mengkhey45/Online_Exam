"use client";

import { useEffect, useState } from "react";

export type Countdown = {
  totalMs: number;
  label: string; // HH:MM:SS or MM:SS
  urgency: "normal" | "amber" | "red"; // amber < 10 min, red < 2 min (§7)
  expired: boolean;
};

function format(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

/** Ticks once a second toward an ISO expiry, with urgency thresholds. */
export function useCountdown(expiresAtIso: string): Countdown {
  const expiry = new Date(expiresAtIso).getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const totalMs = Math.max(0, expiry - now);
  const mins = totalMs / 60_000;
  const urgency = totalMs <= 2 * 60_000 ? "red" : mins < 10 ? "amber" : "normal";

  return { totalMs, label: format(totalMs), urgency, expired: totalMs <= 0 };
}

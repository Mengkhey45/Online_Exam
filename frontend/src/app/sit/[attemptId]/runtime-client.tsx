"use client";

import dynamic from "next/dynamic";

// The student runtime is never server-rendered (AGENTS §8): it owns local
// IndexedDB state and must run only in the browser.
const RuntimeView = dynamic(
  () => import("@/modules/runtime").then((m) => m.RuntimeView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-svh items-center justify-center bg-paper text-sm text-ink-3">
        Loading your exam…
      </div>
    ),
  },
);

export function RuntimeClient({ attemptId }: { attemptId: string }) {
  // The sitting authorises itself with the attempt token, attached per-request
  // by the runtime queries (AGENTS §7) — not via the global Supabase token the
  // AuthProvider keeps, which the attempt-only routes would reject.
  return <RuntimeView attemptId={attemptId} />;
}

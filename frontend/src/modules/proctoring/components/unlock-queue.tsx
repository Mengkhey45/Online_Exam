"use client";

import { formatDistanceToNow } from "date-fns";
import { Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/common/tag";
import type { UnlockRequest } from "../schema";

/**
 * Unlock queue (AGENTS §7). Each entry explains what happened in neutral terms
 * and offers one-click unlock. Unlocking only resumes the student — it never
 * records anything against them (rule 3.4).
 */
export function UnlockQueue({
  requests,
  onUnlock,
  unlockingId,
}: {
  requests: UnlockRequest[];
  onUnlock: (attemptId: string) => void;
  unlockingId?: string;
}) {
  if (requests.length === 0) {
    return (
      <div className="rounded-xl border border-rule bg-surface p-4">
        <h2 className="text-sm font-semibold text-ink">Unlock queue</h2>
        <p className="mt-1 text-sm text-ink-3">
          No one is waiting. Paused students appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-flag/30 bg-surface p-4">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-sm font-semibold text-ink">Unlock queue</h2>
        <Tag tone="flag">{requests.length} waiting</Tag>
      </div>
      <ul className="space-y-2">
        {requests.map((r) => (
          <li
            key={r.attemptId}
            className="rounded-lg border border-rule bg-surface-sunk/40 p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-sm font-medium text-ink tabular">
                {r.studentId}
              </span>
              <span className="text-xs text-ink-3">
                {formatDistanceToNow(new Date(r.at), { addSuffix: true })}
              </span>
            </div>
            <p className="mt-1 text-sm text-ink-2">{r.reason}</p>
            {r.note ? (
              <p className="mt-1 rounded-md bg-surface px-2 py-1 text-xs text-ink-2">
                “{r.note}”
              </p>
            ) : null}
            <Button
              size="sm"
              className="mt-2 w-full"
              onClick={() => onUnlock(r.attemptId)}
              disabled={unlockingId === r.attemptId}
            >
              <Unlock />
              {unlockingId === r.attemptId ? "Unlocking…" : "Unlock and resume"}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

"use client";

import { UserPlus, AlertCircle, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tag } from "@/components/common/tag";
import { useAuth } from "@/lib/auth/auth-provider";
import { useTeam } from "../queries";
import { InviteDialog } from "./invite-dialog";
import { RemoveMemberDialog } from "./remove-member-dialog";

/** Team management (AGENTS §6): who's in the org, and invite colleagues. */
export function TeamView() {
  const { data, isPending, isError, refetch } = useTeam();
  const { email: myEmail } = useAuth();

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-6">
      <header className="mb-5 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">Team</h1>
          <p className="mt-0.5 text-sm text-ink-2">
            Teachers and admins in your institution. Invited people join when
            they first sign in with that email.
          </p>
        </div>
        <InviteDialog
          trigger={
            <Button>
              <UserPlus />
              Invite
            </Button>
          }
        />
      </header>

      {isPending ? (
        <div className="space-y-2" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : isError ? (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 rounded-xl border border-danger/30 bg-danger-soft px-6 py-12 text-center"
        >
          <AlertCircle className="size-5 text-danger" aria-hidden />
          <p className="text-sm text-ink-2">Couldn’t load your team.</p>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw />
            Try again
          </Button>
        </div>
      ) : (
        <ul className="divide-y divide-rule overflow-hidden rounded-xl border border-rule bg-surface">
          {data.members.map((m) => {
            const isSelf =
              myEmail !== null &&
              m.email.toLowerCase() === myEmail.toLowerCase();
            return (
              <li key={m.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-sunk font-mono text-xs font-medium text-ink-2">
                  {initials(m.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink">
                    {m.name}
                  </div>
                  <div className="truncate text-xs text-ink-3">{m.email}</div>
                </div>
                <Tag tone="neutral">{m.role}</Tag>
                <Tag tone={m.status === "active" ? "ok" : "flag"}>
                  {m.status === "active" ? "Active" : "Pending"}
                </Tag>
                {isSelf ? (
                  <Tag tone="accent">You</Tag>
                ) : (
                  <RemoveMemberDialog
                    member={m}
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remove ${m.name}`}
                        className="text-ink-3 hover:text-danger"
                      >
                        <Trash2 />
                      </Button>
                    }
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

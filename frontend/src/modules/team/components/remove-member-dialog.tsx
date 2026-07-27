"use client";

import { useState, type ReactElement } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ApiError } from "@/lib/api/errors";
import { useRemoveMember } from "../queries";
import type { Member } from "../schema";

/**
 * Confirm before removing a member (AGENTS §8 — destructive actions confirm).
 * Wording differs for a pending invite vs an active member. Server enforces the
 * real guardrails (self / last-admin / teacher-can't-remove-admin).
 */
export function RemoveMemberDialog({
  member,
  trigger,
}: {
  member: Member;
  trigger: ReactElement;
}) {
  const remove = useRemoveMember();
  const [open, setOpen] = useState(false);
  const pending = member.status === "pending";

  async function confirm() {
    try {
      await remove.mutateAsync(member.id);
      setOpen(false);
      toast.success(pending ? "Invite revoked" : `${member.name} removed`);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Couldn’t remove that member.",
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {pending ? "Revoke invite?" : `Remove ${member.name}?`}
          </DialogTitle>
          <DialogDescription>
            {pending
              ? `${member.name} won’t be able to join with ${member.email}. You can invite them again later.`
              : `${member.name} will lose access immediately. Their exams and past work stay, but they can’t sign in until re-invited.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <Button
            variant="destructive"
            disabled={remove.isPending}
            onClick={confirm}
          >
            {remove.isPending
              ? "Removing…"
              : pending
                ? "Revoke invite"
                : "Remove"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

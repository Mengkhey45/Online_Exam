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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/api/errors";
import { useInviteTeacher } from "../queries";

type Role = "teacher" | "admin";

/**
 * Invite a colleague (AGENTS §6). No email is sent — they become a pending
 * member and are linked automatically the first time they sign in with Google
 * using this address. Share the app link with them directly.
 */
export function InviteDialog({ trigger }: { trigger: ReactElement }) {
  const invite = useInviteTeacher();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("teacher");

  const canSubmit = name.trim().length > 0 && email.trim().length > 0;

  async function submit() {
    if (!canSubmit) return;
    try {
      await invite.mutateAsync({ name: name.trim(), email: email.trim(), role });
      setOpen(false);
      setName("");
      setEmail("");
      setRole("teacher");
      toast.success("Invite created — they can sign in with that email.");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Couldn’t create the invite.",
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite a colleague</DialogTitle>
          <DialogDescription>
            They’ll join when they first sign in with Google using this email. No
            email is sent — share the app link with them.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="invite-name">Name</Label>
            <Input
              id="invite-name"
              value={name}
              autoFocus
              placeholder="e.g. Sophea Chan"
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              placeholder="name@school.edu"
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void submit();
                }
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invite-role">Role</Label>
            <Select
              value={role}
              onValueChange={(v) => setRole((v as Role) ?? "teacher")}
            >
              <SelectTrigger id="invite-role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <Button disabled={!canSubmit || invite.isPending} onClick={submit}>
            {invite.isPending ? "Inviting…" : "Send invite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

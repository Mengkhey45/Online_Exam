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
import { useCreateGroup } from "../queries";

/** Create an exam group (a course/cohort card on the dashboard, AGENTS §7). */
export function NewGroupDialog({ trigger }: { trigger: ReactElement }) {
  const create = useCreateGroup();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const canSubmit = name.trim().length > 0;

  async function submit() {
    if (!canSubmit) return;
    try {
      await create.mutateAsync({ name: name.trim() });
      setOpen(false);
      setName("");
      toast.success("Group created");
    } catch {
      toast.error("Couldn’t create the group. Try again.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New exam group</DialogTitle>
          <DialogDescription>
            Group exams by course or cohort. You can add exams to it next.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5 py-2">
          <Label htmlFor="new-group-name">Name</Label>
          <Input
            id="new-group-name"
            value={name}
            autoFocus
            placeholder="e.g. CS201 — Spring"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void submit();
              }
            }}
          />
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <Button disabled={!canSubmit || create.isPending} onClick={submit}>
            {create.isPending ? "Creating…" : "Create group"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

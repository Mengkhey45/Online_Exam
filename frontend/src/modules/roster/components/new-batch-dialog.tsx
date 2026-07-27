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
import { useCreateBatch, type Batch } from "../directory";

/** Create a batch/cohort (backend "class") to organise students (AGENTS §6). */
export function NewBatchDialog({
  trigger,
  onCreated,
}: {
  trigger: ReactElement;
  onCreated?: (batch: Batch) => void;
}) {
  const create = useCreateBatch();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  async function submit() {
    if (name.trim().length === 0) return;
    try {
      const batch = await create.mutateAsync(name.trim());
      setOpen(false);
      setName("");
      toast.success("Batch created");
      onCreated?.(batch);
    } catch {
      toast.error("Couldn’t create the batch. Try again.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New batch</DialogTitle>
          <DialogDescription>
            A batch groups students by cohort or intake (e.g. “Batch 11”). You
            add students to it next.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5 py-2">
          <Label htmlFor="batch-name">Name</Label>
          <Input
            id="batch-name"
            value={name}
            autoFocus
            placeholder="e.g. Batch 11"
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
          <Button
            disabled={name.trim().length === 0 || create.isPending}
            onClick={submit}
          >
            {create.isPending ? "Creating…" : "Create batch"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

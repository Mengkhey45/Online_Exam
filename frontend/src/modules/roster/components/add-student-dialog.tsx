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
import { ApiError } from "@/lib/api/errors";
import { useAddStudent, type Batch } from "../directory";

/**
 * Add one student by hand (AGENTS §6) — no file, no AI. Goes straight into the
 * roster (and the current batch, if one is selected).
 */
export function AddStudentDialog({
  batch,
  trigger,
}: {
  batch?: Batch;
  trigger: ReactElement;
}) {
  const add = useAddStudent();
  const [open, setOpen] = useState(false);
  const [studentRef, setStudentRef] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const canSubmit =
    studentRef.trim() && name.trim() && email.trim();

  async function submit() {
    if (!canSubmit) return;
    try {
      await add.mutateAsync({
        classId: batch?.id,
        studentRef: studentRef.trim(),
        name: name.trim(),
        email: email.trim(),
      });
      setOpen(false);
      setStudentRef("");
      setName("");
      setEmail("");
      toast.success("Student added");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Couldn’t add the student.",
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add student</DialogTitle>
          <DialogDescription>
            {batch
              ? `Adds one student to ${batch.name}.`
              : "Adds one student to the roster."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="student-id">Student ID</Label>
            <Input
              id="student-id"
              value={studentRef}
              autoFocus
              placeholder="e.g. 11-001"
              onChange={(e) => setStudentRef(e.target.value)}
              className="font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="student-name">Full name</Label>
            <Input
              id="student-name"
              value={name}
              placeholder="e.g. Dara Sok"
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="student-email">Email</Label>
            <Input
              id="student-email"
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
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <Button disabled={!canSubmit || add.isPending} onClick={submit}>
            {add.isPending ? "Adding…" : "Add student"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

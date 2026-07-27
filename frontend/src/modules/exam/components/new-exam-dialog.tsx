"use client";

import { useState, type ReactElement } from "react";
import { useRouter } from "next/navigation";
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
import { useCreateExam } from "../queries";

/**
 * Create a draft exam, then open the builder (AGENTS §7). When a group is fixed
 * (the "New exam" inside a group card) the group picker is hidden.
 */
export function NewExamDialog({
  groups,
  defaultGroupId,
  trigger,
}: {
  groups: { id: string; name: string }[];
  defaultGroupId?: string;
  trigger: ReactElement;
}) {
  const router = useRouter();
  const create = useCreateExam();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [groupId, setGroupId] = useState(defaultGroupId ?? groups[0]?.id ?? "");

  const canSubmit = title.trim().length > 0 && groupId.length > 0;

  async function submit() {
    if (!canSubmit) return;
    try {
      const { id } = await create.mutateAsync({ groupId, title: title.trim() });
      setOpen(false);
      setTitle("");
      router.push(`/builder/${id}`);
    } catch {
      toast.error("Couldn’t create the exam. Try again.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New exam</DialogTitle>
          <DialogDescription>
            Give it a title and pick a group. You’ll add questions next.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="new-exam-title">Title</Label>
            <Input
              id="new-exam-title"
              value={title}
              autoFocus
              placeholder="e.g. Algorithms — Final"
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void submit();
                }
              }}
            />
          </div>

          {!defaultGroupId && groups.length > 0 ? (
            <div className="space-y-1.5">
              <Label htmlFor="new-exam-group">Group</Label>
              <Select
                value={groupId}
                onValueChange={(v) => setGroupId(v ?? "")}
              >
                <SelectTrigger id="new-exam-group" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <Button disabled={!canSubmit || create.isPending} onClick={submit}>
            {create.isPending ? "Creating…" : "Create & open"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

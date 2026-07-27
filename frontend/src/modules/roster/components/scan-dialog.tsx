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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/errors";
import { useRosterScan } from "../scan";
import type { Batch } from "../directory";

/**
 * Scan a photo/scan/PDF of a student list with AI (Phase 2). The prompt lets the
 * teacher say what to keep. Extracted rows go to the review step — nothing is
 * added without confirming (rule 3.6). Only shown when AI is available.
 */
export function ScanDialog({
  batch,
  trigger,
  onScanned,
}: {
  batch?: Batch;
  trigger: ReactElement;
  onScanned: (importId: string) => void;
}) {
  const scan = useRosterScan();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");

  async function submit() {
    if (!file) return;
    try {
      const { importId } = await scan.mutateAsync({
        file,
        prompt,
        classId: batch?.id,
      });
      setOpen(false);
      setFile(null);
      setPrompt("");
      onScanned(importId);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Couldn’t start the scan.",
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan a student list</DialogTitle>
          <DialogDescription>
            Upload a photo, scan, or PDF of a list. AI reads it into rows you’ll
            review before adding{batch ? ` to ${batch.name}` : ""}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="scan-file">File</Label>
            <input
              id="scan-file"
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-ink-2 file:mr-3 file:rounded-md file:border file:border-rule file:bg-surface file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ink hover:file:bg-surface-sunk"
            />
            {file ? (
              <p className="text-xs text-ink-3">{file.name}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="scan-prompt">
              Instructions <span className="text-ink-3">(optional)</span>
            </Label>
            <Textarea
              id="scan-prompt"
              value={prompt}
              rows={3}
              placeholder="e.g. Only take name, email, and student ID — ignore the marks column."
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <Button disabled={!file || scan.isPending} onClick={submit}>
            {scan.isPending ? "Uploading…" : "Scan with AI"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

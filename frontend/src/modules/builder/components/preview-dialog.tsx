"use client";

import { useState, type ReactElement } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useBuilder } from "../store";
import { ExamPreview } from "./exam-preview";

/** Opens a read-only preview of the current builder state (AGENTS §7). */
export function PreviewDialog({ trigger }: { trigger: ReactElement }) {
  const { state } = useBuilder();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>Preview: {state.title}</DialogTitle>
          <DialogDescription>
            A read-only view of the exam as a student sees it.
          </DialogDescription>
        </DialogHeader>
        <ExamPreview title={state.title} sections={state.sections} />
      </DialogContent>
    </Dialog>
  );
}

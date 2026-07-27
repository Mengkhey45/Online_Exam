"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Copies a short value (an exam key, an ID) to the clipboard with a brief
 * confirmation. Keyboard reachable with a visible focus ring (AGENTS §8).
 */
export function CopyButton({
  value,
  label = "Copy",
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      toast.error("Couldn’t copy. Select the text and copy manually.");
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={copy}
            aria-label={`${label} ${value}`}
            className={cn("text-ink-3 hover:text-ink", className)}
          >
            {copied ? (
              <Check className="text-ok" />
            ) : (
              <Copy />
            )}
          </Button>
        }
      />
      <TooltipContent>{copied ? "Copied" : label}</TooltipContent>
    </Tooltip>
  );
}

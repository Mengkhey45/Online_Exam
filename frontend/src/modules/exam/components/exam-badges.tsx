import {
  CircleDot,
  FileEdit,
  Archive,
  ShieldCheck,
  Shield,
  ShieldAlert,
  LockOpen,
  Lock,
  CalendarClock,
  Compass,
} from "lucide-react";
import { Tag, type Tone } from "@/components/common/tag";
import type { ExamStatus, ExamAccess, SecurityLevel } from "../types";

/**
 * Status, access, and security badges. Each pairs an icon with a word so the
 * meaning never rests on colour alone (AGENTS §8). Security uses ochre/flag for
 * "high" — attention, not alarm; red stays reserved for real errors.
 */

const STATUS: Record<
  ExamStatus,
  { label: string; tone: Tone; Icon: typeof CircleDot }
> = {
  draft: { label: "Draft", tone: "neutral", Icon: FileEdit },
  published: { label: "Published", tone: "ok", Icon: CircleDot },
  archived: { label: "Archived", tone: "neutral", Icon: Archive },
};

export function StatusBadge({ status }: { status: ExamStatus }) {
  const { label, tone, Icon } = STATUS[status];
  return (
    <Tag tone={tone}>
      <Icon aria-hidden />
      {label}
    </Tag>
  );
}

const ACCESS: Record<
  ExamAccess,
  { label: string; tone: Tone; Icon: typeof LockOpen }
> = {
  open: { label: "Open", tone: "accent", Icon: LockOpen },
  closed: { label: "Closed", tone: "neutral", Icon: Lock },
  discoverable: { label: "Discoverable", tone: "accent", Icon: Compass },
  scheduled: { label: "Scheduled", tone: "flag", Icon: CalendarClock },
};

export function AccessBadge({ access }: { access: ExamAccess }) {
  const { label, tone, Icon } = ACCESS[access];
  return (
    <Tag tone={tone}>
      <Icon aria-hidden />
      {label}
    </Tag>
  );
}

const SECURITY: Record<
  SecurityLevel,
  { label: string; tone: Tone; Icon: typeof Shield }
> = {
  low: { label: "Low security", tone: "neutral", Icon: Shield },
  medium: { label: "Medium security", tone: "accent", Icon: ShieldCheck },
  high: { label: "High security", tone: "flag", Icon: ShieldAlert },
};

export function SecurityBadge({ level }: { level: SecurityLevel }) {
  const { label, tone, Icon } = SECURITY[level];
  return (
    <Tag tone={tone}>
      <Icon aria-hidden />
      {label}
    </Tag>
  );
}

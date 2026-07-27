"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  KeyRound,
  ArrowRight,
  ArrowLeft,
  Maximize2,
  Clock,
  ShieldCheck,
  Building2,
} from "lucide-react";
import { ApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useLookupExam, useStartAttempt } from "../queries";
import type { EntryExam } from "../schema";

type Step = "key" | "confirm" | "summary";

/** Student entry (AGENTS §7): key → confirm details → start. Centred, no nav. */
export function EntryView() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("key");
  const [exam, setExam] = useState<EntryExam | null>(null);
  const [details, setDetails] = useState<Record<string, string>>({});

  const lookup = useLookupExam();
  const start = useStartAttempt();

  async function onFindExam(key: string) {
    try {
      const found = await lookup.mutateAsync(key);
      setExam(found);
      setDetails(
        Object.fromEntries(found.fields.map((f) => [f.id, f.prefilled ?? ""])),
      );
      setStep("confirm");
    } catch {
      // The inline message on the key step handles this; nothing to do here.
    }
  }

  async function onStart() {
    if (!exam) return;
    try {
      const attemptId = await start.mutateAsync({ examId: exam.examId, details });
      router.push(`/sit/${attemptId}`);
    } catch (e) {
      toast.error(
        e instanceof ApiError ? e.message : "Couldn’t start the exam. Try again.",
      );
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-paper px-4 py-10">
      <div className="w-full max-w-[480px]">
        <div className="mb-6 flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-sm bg-accent font-mono text-sm font-semibold text-white">
            E
          </span>
          <span className="text-sm font-semibold tracking-tight text-ink">
            Examroom
          </span>
        </div>

        <Stepper step={step} />

        <div className="mt-5 rounded-xl border border-rule bg-surface p-6">
          {step === "key" ? (
            <KeyStep
              onSubmit={onFindExam}
              pending={lookup.isPending}
              error={
                lookup.isError
                  ? lookup.error instanceof ApiError
                    ? lookup.error.message
                    : "Couldn’t find that exam."
                  : undefined
              }
            />
          ) : null}

          {step === "confirm" && exam ? (
            <ConfirmStep
              exam={exam}
              details={details}
              onChange={setDetails}
              onBack={() => setStep("key")}
              onNext={() => setStep("summary")}
            />
          ) : null}

          {step === "summary" && exam ? (
            <SummaryStep
              exam={exam}
              onBack={() => setStep("confirm")}
              onStart={onStart}
              pending={start.isPending}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: "key", label: "Exam key" },
    { id: "confirm", label: "Your details" },
    { id: "summary", label: "Start" },
  ];
  const activeIndex = steps.findIndex((s) => s.id === step);
  return (
    <ol className="flex items-center gap-2">
      {steps.map((s, i) => (
        <li key={s.id} className="flex flex-1 items-center gap-2">
          <span
            className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded-full font-mono text-xs tabular",
              i <= activeIndex
                ? "bg-accent text-white"
                : "bg-surface-sunk text-ink-3",
            )}
          >
            {i + 1}
          </span>
          <span
            className={cn(
              "text-xs font-medium",
              i === activeIndex ? "text-ink" : "text-ink-3",
            )}
          >
            {s.label}
          </span>
          {i < steps.length - 1 ? (
            <span className="h-px flex-1 bg-rule" />
          ) : null}
        </li>
      ))}
    </ol>
  );
}

function KeyStep({
  onSubmit,
  pending,
  error,
}: {
  onSubmit: (key: string) => void;
  pending: boolean;
  error?: string;
}) {
  const [key, setKey] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (key.trim()) onSubmit(key);
      }}
      className="space-y-4"
    >
      <div className="space-y-1">
        <h1 className="text-base font-semibold text-ink">Enter your exam</h1>
        <p className="text-sm text-ink-2">
          Type the key your teacher shared, or sign in with your institution.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="key" className="text-xs font-medium text-ink-2">
          Exam key
        </Label>
        <Input
          id="key"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="e.g. ALGO-7F3K"
          autoComplete="off"
          autoCapitalize="characters"
          className="font-mono tracking-wide"
          aria-invalid={Boolean(error)}
        />
        {error ? (
          <p className="text-xs text-danger" role="alert">
            {error}
          </p>
        ) : (
          <p className="text-xs text-ink-3">Try ALGO-7F3K in this demo.</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={pending || !key.trim()}>
        <KeyRound />
        {pending ? "Finding exam…" : "Continue"}
        {!pending ? <ArrowRight /> : null}
      </Button>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-rule" />
        <span className="text-xs text-ink-3">or</span>
        <span className="h-px flex-1 bg-rule" />
      </div>

      <Button type="button" variant="outline" className="w-full" disabled>
        <Building2 />
        Sign in with your institution
      </Button>
    </form>
  );
}

function ConfirmStep({
  exam,
  details,
  onChange,
  onBack,
  onNext,
}: {
  exam: EntryExam;
  details: Record<string, string>;
  onChange: (d: Record<string, string>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const missing = exam.fields.some(
    (f) => f.required && !details[f.id]?.trim(),
  );
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!missing) onNext();
      }}
      className="space-y-4"
    >
      <div className="space-y-1">
        <h1 className="text-base font-semibold text-ink">Confirm your details</h1>
        <p className="text-sm text-ink-2">
          {exam.title} · {exam.institution}
        </p>
      </div>

      {exam.fields.map((f) => (
        <div key={f.id} className="space-y-1.5">
          <Label htmlFor={f.id} className="text-xs font-medium text-ink-2">
            {f.label}
            {f.required ? "" : " (optional)"}
          </Label>
          <Input
            id={f.id}
            type={f.type}
            value={details[f.id] ?? ""}
            onChange={(e) => onChange({ ...details, [f.id]: e.target.value })}
          />
        </div>
      ))}

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft />
          Back
        </Button>
        <Button type="submit" className="flex-1" disabled={missing}>
          Continue
          <ArrowRight />
        </Button>
      </div>
    </form>
  );
}

function SummaryStep({
  exam,
  onBack,
  onStart,
  pending,
}: {
  exam: EntryExam;
  onBack: () => void;
  onStart: () => void;
  pending: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-base font-semibold text-ink">Ready to start</h1>
        <p className="text-sm text-ink-2">{exam.title}</p>
      </div>

      <dl className="space-y-2 rounded-lg bg-surface-sunk/60 p-3 text-sm">
        <SummaryRow Icon={Clock} label="Duration">
          <span className="font-mono tabular">{exam.durationMinutes} min</span>
        </SummaryRow>
        <SummaryRow Icon={ArrowRight} label="Questions">
          <span className="font-mono tabular">{exam.questionCount}</span>
        </SummaryRow>
        <SummaryRow Icon={ShieldCheck} label="Marks">
          <span className="font-mono tabular">{exam.totalMarks}</span>
        </SummaryRow>
      </dl>

      <div className="flex items-start gap-2.5 rounded-lg border border-flag/30 bg-flag-soft px-3 py-2.5">
        <Maximize2 className="mt-0.5 size-4 shrink-0 text-flag" aria-hidden />
        <p className="text-sm text-ink-2">
          When you start, the{" "}
          <span className="font-medium text-ink">timer begins</span> and the exam
          opens in <span className="font-medium text-ink">fullscreen</span>. Your
          answers save automatically as you go.
        </p>
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft />
          Back
        </Button>
        <Button className="flex-1" onClick={onStart} disabled={pending}>
          {pending ? "Starting…" : "Start exam"}
        </Button>
      </div>
    </div>
  );
}

function SummaryRow({
  Icon,
  label,
  children,
}: {
  Icon: typeof Clock;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="flex items-center gap-2 text-ink-2">
        <Icon className="size-4 text-ink-3" aria-hidden />
        {label}
      </dt>
      <dd className="text-ink">{children}</dd>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/auth-provider";
import { forgotPasswordSchema, type ForgotPasswordInput } from "../schema";

export function ForgotPasswordForm() {
  const { sendPasswordReset } = useAuth();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });
  const { formState: { errors, isSubmitting }, register, handleSubmit, setError } = form;

  async function submit(input: ForgotPasswordInput) {
    const error = await sendPasswordReset(input.email);
    if (error) {
      setError("root", { message: error });
      return;
    }
    setSentTo(input.email);
  }

  if (sentTo) {
    return (
      <div className="space-y-3 text-sm text-ink-2">
        <p>If an account exists for <span className="font-medium text-ink">{sentTo}</span>, a reset link is on its way. Also check spam or junk mail.</p>
        <p>Signed up with Google? The link lets you add a password to that account too.</p>
        <Link className="font-medium text-accent hover:underline" href="/login">Back to sign in</Link>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(submit)} noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="forgot-email">Email</Label>
        <Input id="forgot-email" type="email" autoComplete="email" {...register("email")} />
        {errors.email?.message ? <p className="text-xs text-danger">{errors.email.message}</p> : null}
      </div>
      {errors.root?.message ? <p role="alert" className="text-sm text-danger">{errors.root.message}</p> : null}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Sending…" : "Send reset link"}
      </Button>
      <p className="text-center text-sm text-ink-2"><Link className="font-medium text-accent hover:underline" href="/login">Back to sign in</Link></p>
    </form>
  );
}

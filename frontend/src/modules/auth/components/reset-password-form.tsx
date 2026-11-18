"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/auth-provider";
import { resetPasswordSchema, type ResetPasswordInput } from "../schema";

/**
 * Landing page for the Supabase recovery link. The Supabase client picks the
 * recovery session up from the URL automatically (detectSessionInUrl), so by
 * the time auth finishes loading there is a session to update.
 */
export function ResetPasswordForm() {
  const router = useRouter();
  const { session, profile, needsOrganization, loading, updatePassword } = useAuth();
  const [done, setDone] = useState(false);
  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirm: "" },
  });
  const { formState: { errors, isSubmitting }, register, handleSubmit, setError } = form;

  async function submit(input: ResetPasswordInput) {
    const error = await updatePassword(input.password);
    if (error) {
      setError("root", { message: error });
      return;
    }
    setDone(true);
  }

  function continueToApp() {
    if (profile) router.replace(profile.role === "admin" ? "/admin/dashboard" : "/dashboard");
    else if (needsOrganization) router.replace("/register/setup");
    else router.replace("/login");
  }

  if (loading) {
    return <div className="flex items-center gap-2 text-sm text-ink-2"><Loader2 className="size-4 animate-spin" aria-hidden />Checking your reset link…</div>;
  }

  if (!session) {
    return (
      <div className="space-y-3 text-sm text-ink-2">
        <p role="alert" className="text-danger">This reset link is invalid or has expired.</p>
        <Link className="font-medium text-accent hover:underline" href="/forgot-password">Request a new link</Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-4 text-sm text-ink-2">
        <p>Password updated. You can now sign in with your email and this password.</p>
        <Button className="w-full" onClick={continueToApp}>Continue</Button>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(submit)} noValidate>
      <p className="text-sm text-ink-2">Choose a new password for <span className="font-medium text-ink">{session.user.email}</span>.</p>
      <div className="space-y-1.5">
        <Label htmlFor="reset-password">New password</Label>
        <Input id="reset-password" type="password" autoComplete="new-password" {...register("password")} />
        {errors.password?.message ? <p className="text-xs text-danger">{errors.password.message}</p> : null}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="reset-confirm">Confirm new password</Label>
        <Input id="reset-confirm" type="password" autoComplete="new-password" {...register("confirm")} />
        {errors.confirm?.message ? <p className="text-xs text-danger">{errors.confirm.message}</p> : null}
      </div>
      {errors.root?.message ? <p role="alert" className="text-sm text-danger">{errors.root.message}</p> : null}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : "Save new password"}
      </Button>
    </form>
  );
}

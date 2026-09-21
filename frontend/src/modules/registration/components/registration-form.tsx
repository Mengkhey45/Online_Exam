"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase/client";
import { registrationInputSchema, type RegistrationInput } from "../schema";
import { provisionOrganization } from "../queries";

export function RegistrationForm() {
  const router = useRouter();
  const form = useForm<RegistrationInput>({
    resolver: zodResolver(registrationInputSchema),
    defaultValues: { organizationName: "", adminName: "", email: "", password: "" },
  });
  const { formState: { errors, isSubmitting }, register, handleSubmit, setError } = form;

  async function submit(input: RegistrationInput) {
    const redirectTo = `${window.location.origin}/register/complete`;
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          full_name: input.adminName,
          organization_name: input.organizationName,
        },
      },
    });
    if (error) {
      setError("root", { message: error.message });
      return;
    }
    if (!data.session) {
      router.push(`/register/complete?email=${encodeURIComponent(input.email)}`);
      return;
    }
    try {
      await provisionOrganization(input, data.session.access_token);
      window.location.assign("/admin/dashboard");
    } catch (cause) {
      setError("root", { message: cause instanceof Error ? cause.message : "Couldn’t create the organization." });
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(submit)} noValidate>
      <Field htmlFor="organization-name" label="Organization name" error={errors.organizationName?.message}>
        <Input id="organization-name" autoComplete="organization" {...register("organizationName")} />
      </Field>
      <Field htmlFor="admin-name" label="Your full name" error={errors.adminName?.message}>
        <Input id="admin-name" autoComplete="name" {...register("adminName")} />
      </Field>
      <Field htmlFor="admin-email" label="Work email" error={errors.email?.message}>
        <Input id="admin-email" type="email" autoComplete="email" {...register("email")} />
      </Field>
      <Field htmlFor="admin-password" label="Password" error={errors.password?.message}>
        <Input id="admin-password" type="password" autoComplete="new-password" {...register("password")} />
      </Field>
      {errors.root?.message ? <p role="alert" className="text-sm text-danger">{errors.root.message}</p> : null}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating organization…" : "Create organization"}
      </Button>
      <p className="text-center text-sm text-ink-2">Already have an account? <Link className="font-medium text-accent hover:underline" href="/login">Sign in</Link></p>
    </form>
  );
}

function Field({ children, error, htmlFor, label }: { children: React.ReactNode; error?: string; htmlFor: string; label: string }) {
  return <div className="space-y-1.5"><Label htmlFor={htmlFor}>{label}</Label>{children}{error ? <p className="text-xs text-danger">{error}</p> : null}</div>;
}

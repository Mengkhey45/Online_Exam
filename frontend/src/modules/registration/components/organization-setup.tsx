"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/auth-provider";
import { organizationSetupSchema, type OrganizationSetupInput } from "../schema";
import { provisionOrganization } from "../queries";

/**
 * For an account that is signed in (Google, or an email whose registration
 * metadata was lost) but has no organization yet: create one and become its
 * admin. Uses the same verified-session endpoint as email registration.
 */
export function OrganizationSetup() {
  const router = useRouter();
  const { session, profile, loading, email, refreshProfile, signOut } = useAuth();

  const meta = session?.user.user_metadata ?? {};
  const suggestedName =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    "";
  const suggestedOrganization =
    typeof meta.organization_name === "string" ? meta.organization_name : "";

  const form = useForm<OrganizationSetupInput>({
    resolver: zodResolver(organizationSetupSchema),
    values: { organizationName: suggestedOrganization, adminName: suggestedName },
    resetOptions: { keepDirtyValues: true },
  });
  const { formState: { errors, isSubmitting }, register, handleSubmit, setError } = form;

  useEffect(() => {
    if (loading) return;
    if (!session) router.replace("/login");
    else if (profile) router.replace(profile.role === "admin" ? "/admin/dashboard" : "/dashboard");
  }, [loading, session, profile, router]);

  async function submit(input: OrganizationSetupInput) {
    if (!session) return;
    try {
      await provisionOrganization(input, session.access_token);
      await refreshProfile();
      router.replace("/admin/dashboard");
    } catch (cause) {
      setError("root", { message: cause instanceof Error ? cause.message : "Couldn’t create the organization." });
    }
  }

  if (loading || !session || profile) {
    return <div className="flex items-center gap-2 text-sm text-ink-2"><Loader2 className="size-4 animate-spin" aria-hidden />Loading your account…</div>;
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-ink-2">
        You’re signed in as <span className="font-medium text-ink">{email}</span>, but this account isn’t part of an organization yet.
        Create one to become its administrator.
      </p>
      <form className="space-y-4" onSubmit={handleSubmit(submit)} noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="setup-organization">Organization name</Label>
          <Input id="setup-organization" autoComplete="organization" {...register("organizationName")} />
          {errors.organizationName?.message ? <p className="text-xs text-danger">{errors.organizationName.message}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="setup-name">Your full name</Label>
          <Input id="setup-name" autoComplete="name" {...register("adminName")} />
          {errors.adminName?.message ? <p className="text-xs text-danger">{errors.adminName.message}</p> : null}
        </div>
        {errors.root?.message ? <p role="alert" className="text-sm text-danger">{errors.root.message}</p> : null}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating organization…" : "Create organization"}
        </Button>
      </form>
      <p className="text-sm text-ink-3">
        Joining an existing school instead? Ask its administrator to invite <span className="font-medium text-ink-2">{email}</span>, then sign in again.
      </p>
      <Button variant="outline" className="w-full" onClick={() => void signOut()}>
        Sign out
      </Button>
    </div>
  );
}

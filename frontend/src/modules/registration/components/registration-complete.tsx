"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-provider";
import { provisionOrganization } from "../queries";

export function RegistrationComplete() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const [message, setMessage] = useState<string | null>(null);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");
  const email = searchParams.get("email");
  const code = searchParams.get("code");

  useEffect(() => {
    async function provision() {
      // If there's a PKCE code in the URL, exchange it for a session.
      // Otherwise, use the existing session (e.g. user was already signed in).
      const sessionResult = code
        ? await supabase.auth.exchangeCodeForSession(code)
        : await supabase.auth.getSession();
      if (sessionResult.error) {
        setMessage(sessionResult.error.message);
        return;
      }
      const session = sessionResult.data.session;
      if (!session) {
        if (!email) setMessage("Your confirmation session was not found. Sign in to finish creating your organization.");
        return;
      }
      const metadata = session.user.user_metadata;
      const organizationName = typeof metadata.organization_name === "string" ? metadata.organization_name : "";
      const adminName = typeof metadata.full_name === "string" ? metadata.full_name : "";
      if (!organizationName || !adminName) {
        setMessage("We couldn't recover your registration details. Please register again.");
        return;
      }
      try {
        await provisionOrganization({ organizationName, adminName }, session.access_token);
        // Refresh the AuthProvider profile now that the org row exists,
        // then navigate to the dashboard without a full page reload race.
        await refreshProfile();
        router.replace("/admin/dashboard");
      } catch (cause) {
        setMessage(cause instanceof Error ? cause.message : "Couldn't create the organization.");
      }
    }
    void provision();
  }, [code, email, refreshProfile, router]);

  async function resendConfirmation() {
    if (!email) return;
    setResendState("sending");
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/register/complete` },
    });
    if (error) {
      setMessage(error.message);
      setResendState("idle");
      return;
    }
    setResendState("sent");
  }

  if (message) return <p role="alert" className="text-sm text-danger">{message}</p>;
  if (email) return <div className="space-y-4 text-sm text-ink-2"><p>Check <span className="font-medium text-ink">{email}</span> and confirm your email. We’ll finish creating your organization when you return here.</p><p>Also check spam or junk mail. The message is sent by Supabase Auth.</p><Button variant="outline" onClick={() => void resendConfirmation()} disabled={resendState !== "idle"}>{resendState === "sending" ? "Sending…" : resendState === "sent" ? "Email sent" : "Resend confirmation email"}</Button></div>;
  return <div className="flex items-center gap-2 text-sm text-ink-2"><Loader2 className="size-4 animate-spin" aria-hidden />Finishing your organization setup…</div>;
}

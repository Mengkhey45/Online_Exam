"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/auth-provider";

export default function LoginPage() {
  const { session, profile, loading, signInWithGoogle, signInWithPassword, signOut } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signInError, setSignInError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  async function submitPasswordSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSigningIn(true);
    setSignInError(null);
    const error = await signInWithPassword(email, password);
    setSignInError(error);
    setSigningIn(false);
  }

  // Already signed in → go to the app.
  useEffect(() => {
    if (!loading && profile) {
      router.replace(profile.role === "admin" ? "/admin/dashboard" : "/dashboard");
    }
  }, [loading, profile, router]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm rounded-xl border border-rule bg-surface p-8">
        <div className="mb-6 flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-sm bg-accent font-mono text-sm font-semibold text-white">
            E
          </span>
          <span className="text-sm font-semibold tracking-tight text-ink">
            Examroom
          </span>
        </div>

        <h1 className="text-lg font-semibold text-ink">Sign in</h1>
        <p className="mt-1 text-sm text-ink-2">Use your organization account to continue.</p>

        <form className="mt-6 space-y-4" onSubmit={(event) => void submitPasswordSignIn(event)}>
          <div className="space-y-1.5">
            <Label htmlFor="login-email">Email</Label>
            <Input id="login-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="login-password">Password</Label>
            <Input id="login-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </div>
          {signInError ? <p role="alert" className="text-sm text-danger">{signInError}</p> : null}
          <Button className="w-full" type="submit" disabled={loading || signingIn}>
            {signingIn ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <Button
          className="mt-3 w-full"
          onClick={() => void signInWithGoogle()}
          disabled={loading}
        >
          Continue with Google
        </Button>
        {!loading && session && !profile ? (
          <div role="alert" className="mt-4 text-sm text-danger">
            This account is signed in but does not have access to an organization.
            <Button variant="link" className="h-auto px-1" onClick={() => void signOut()}>
              Sign out
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

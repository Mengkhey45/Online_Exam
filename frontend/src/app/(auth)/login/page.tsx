"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-provider";

export default function LoginPage() {
  const { session, loading, signInWithGoogle } = useAuth();
  const router = useRouter();

  // Already signed in → go to the app.
  useEffect(() => {
    if (!loading && session) router.replace("/dashboard");
  }, [loading, session, router]);

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
        <p className="mt-1 text-sm text-ink-2">
          Use your institution Google account to continue.
        </p>

        <Button
          className="mt-6 w-full"
          onClick={() => void signInWithGoogle()}
          disabled={loading}
        >
          Continue with Google
        </Button>
      </div>
    </div>
  );
}

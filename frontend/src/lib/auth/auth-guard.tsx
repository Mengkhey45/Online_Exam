"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "./auth-provider";

/** Gates a subtree behind a signed-in session; bounces to /login otherwise. */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) router.replace("/login");
  }, [loading, session, router]);

  if (loading || !session) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-paper">
        <Loader2 className="size-5 animate-spin text-ink-3" aria-label="Loading" />
      </div>
    );
  }
  return <>{children}</>;
}

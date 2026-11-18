"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "./auth-provider";

/** Gates a subtree behind a signed-in session; bounces to /login otherwise. */
export function AuthGuard({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: Array<"admin" | "teacher" | "student">;
}) {
  const { session, profile, needsOrganization, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) router.replace("/login");
    if (!loading && session && !profile) {
      router.replace(needsOrganization ? "/register/setup" : "/login");
    }
    if (!loading && profile && roles && !roles.includes(profile.role)) {
      router.replace(profile.role === "admin" ? "/admin/dashboard" : "/dashboard");
    }
  }, [loading, session, profile, needsOrganization, roles, router]);

  if (loading || !session || !profile || (roles && !roles.includes(profile.role))) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-paper">
        <Loader2 className="size-5 animate-spin text-ink-3" aria-label="Loading" />
      </div>
    );
  }
  return <>{children}</>;
}

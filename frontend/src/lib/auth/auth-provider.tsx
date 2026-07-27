"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { setApiAccessToken } from "@/lib/api/client";

type AuthValue = {
  session: Session | null;
  loading: boolean;
  email: string | null;
  name: string;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load any persisted session (and one just parsed from the OAuth redirect).
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setApiAccessToken(data.session?.access_token ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setApiAccessToken(next?.access_token ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthValue>(() => {
    const meta = session?.user.user_metadata ?? {};
    const name =
      (typeof meta.full_name === "string" && meta.full_name) ||
      (typeof meta.name === "string" && meta.name) ||
      session?.user.email ||
      "Signed in";
    return {
      session,
      loading,
      email: session?.user.email ?? null,
      name,
      async signInWithGoogle() {
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: `${window.location.origin}/dashboard` },
        });
      },
      async signOut() {
        await supabase.auth.signOut();
      },
    };
  }, [session, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

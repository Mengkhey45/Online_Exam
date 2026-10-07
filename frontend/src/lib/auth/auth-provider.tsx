"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { z } from "zod";
import { supabase } from "@/lib/supabase/client";
import { api, setApiAccessToken } from "@/lib/api/client";

const profileSchema = z.object({
  userId: z.string(),
  organizationId: z.string(),
  organizationName: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(["admin", "teacher", "student"]),
});

type Profile = z.infer<typeof profileSchema>;

type AuthValue = {
  session: Session | null;
  loading: boolean;
  email: string | null;
  name: string;
  profile: Profile | null;
  /** Re-fetch /auth/me with the current token. Call this after self-provisioning. */
  refreshProfile: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  async function fetchProfile(): Promise<Profile | null> {
    try {
      return await api.get("/auth/me", profileSchema);
    } catch {
      return null;
    }
  }

  useEffect(() => {
    // Detect whether we're on the registration-complete page. When we are, the
    // page itself handles provisioning and will call refreshProfile() when done.
    // Skip automatic /auth/me fetches on SIGNED_IN until then to avoid a 401
    // race where onAuthStateChange fires before the org row is created.
    function isProvisioningPage(): boolean {
      return typeof window !== "undefined" &&
        window.location.pathname.startsWith("/register/complete");
    }

    async function applySession(
      next: Session | null,
      event?: AuthChangeEvent,
    ) {
      setSession(next);
      setApiAccessToken(next?.access_token ?? null);
      if (!next) {
        setProfile(null);
        setLoading(false);
        return;
      }
      // If we're on the provisioning page and this is a fresh sign-in event,
      // skip the /auth/me call — the RegistrationComplete component will call
      // refreshProfile() after it creates the org row.
      if (event === "SIGNED_IN" && isProvisioningPage()) {
        setLoading(false);
        return;
      }
      const p = await fetchProfile();
      setProfile(p);
      setLoading(false);
    }

    void supabase.auth.getSession().then(({ data }) =>
      applySession(data.session)
    );

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setLoading(true);
      void applySession(next, event);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token ?? null;
    setApiAccessToken(token);
    if (!token) {
      setProfile(null);
      return;
    }
    const p = await fetchProfile();
    setProfile(p);
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
      profile,
      refreshProfile,
      async signInWithGoogle() {
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: `${window.location.origin}/dashboard` },
        });
      },
      async signInWithPassword(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return error?.message ?? null;
      },
      async signOut() {
        await supabase.auth.signOut();
      },
    };
  }, [session, profile, loading, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

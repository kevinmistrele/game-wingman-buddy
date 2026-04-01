import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  needsOnboarding: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  completeOnboarding: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  needsOnboarding: false,
  signOut: async () => {},
  refreshProfile: async () => {},
  completeOnboarding: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    setProfile(data);
    return data;
  };

  const checkOnboarding = (u: User, p: Profile | null) => {
    // Google users get auto-generated usernames (from email prefix)
    // Check if profile needs setup: username is email prefix or riot_id is missing
    const isOAuth = u.app_metadata?.provider === "google";
    const emailPrefix = u.email?.split("@")[0] ?? "";
    const usernameIsDefault = p?.username === emailPrefix;
    
    if (isOAuth && p && usernameIsDefault) {
      setNeedsOnboarding(true);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const p = await fetchProfile(user.id);
      if (p) setProfile(p);
    }
  };

  const completeOnboarding = async () => {
    setNeedsOnboarding(false);
    if (user) await fetchProfile(user.id);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(async () => {
            const p = await fetchProfile(session.user.id);
            checkOnboarding(session.user, p);
          }, 0);
        } else {
          setProfile(null);
          setNeedsOnboarding(false);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const p = await fetchProfile(session.user.id);
        checkOnboarding(session.user, p);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setNeedsOnboarding(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, needsOnboarding, signOut, refreshProfile, completeOnboarding }}>
      {children}
    </AuthContext.Provider>
  );
};

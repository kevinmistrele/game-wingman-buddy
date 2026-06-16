import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import ConfirmModal from "@/components/ConfirmModal";
import { toast } from "sonner";

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

const SESSION_KEY = "mg_session_id";
const getLocalSessionId = () => localStorage.getItem(SESSION_KEY);
const setLocalSessionId = (id: string) => localStorage.setItem(SESSION_KEY, id);
const clearLocalSessionId = () => localStorage.removeItem(SESSION_KEY);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [pendingTakeover, setPendingTakeover] = useState<{ userId: string } | null>(null);
  const claimedFor = useRef<string | null>(null);
  const claiming = useRef(false);

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
    const isOAuth = u.app_metadata?.provider === "google";
    if (!isOAuth || !p) return;
    const emailPrefix = u.email?.split("@")[0] ?? "";
    const usernameIsDefault = p.username === emailPrefix;
    const hasCompletedSetup = !!p.riot_id || !usernameIsDefault;
    if (!hasCompletedSetup) setNeedsOnboarding(true);
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

  // Claim or detect conflicting session
  const claimSession = async (userId: string) => {
    if (claimedFor.current === userId) return;
    if (claiming.current) return;
    claiming.current = true;
    try {
      const localId = getLocalSessionId();
      const { data: p } = await supabase
        .from("profiles")
        .select("active_session_id")
        .eq("user_id", userId)
        .single();

      if (!p) return;

      const remoteId = p.active_session_id ?? null;

      // Already our session → fine
      if (remoteId && localId && remoteId === localId) {
        claimedFor.current = userId;
        return;
      }

      // No remote session OR no local session (fresh browser) → claim immediately
      if (!remoteId || !localId) {
        const newId = crypto.randomUUID();
        setLocalSessionId(newId);
        await supabase
          .from("profiles")
          .update({ active_session_id: newId, session_started_at: new Date().toISOString() })
          .eq("user_id", userId);
        claimedFor.current = userId;
        return;
      }

      // Both exist but differ → genuinely conflicting session → ask user
      setPendingTakeover({ userId });
    } finally {
      claiming.current = false;
    }
  };

  const confirmTakeover = async () => {
    if (!pendingTakeover) return;
    const newId = crypto.randomUUID();
    setLocalSessionId(newId);
    await supabase
      .from("profiles")
      .update({ active_session_id: newId, session_started_at: new Date().toISOString() })
      .eq("user_id", pendingTakeover.userId);
    claimedFor.current = pendingTakeover.userId;
    setPendingTakeover(null);
    toast.success("Conectado. A outra sessão foi desconectada.");
  };

  const cancelTakeover = async () => {
    setPendingTakeover(null);
    clearLocalSessionId();
    await supabase.auth.signOut();
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(async () => {
            const p = await fetchProfile(session.user.id);
            checkOnboarding(session.user, p);
            await claimSession(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setNeedsOnboarding(false);
          claimedFor.current = null;
          if (event === "SIGNED_OUT") clearLocalSessionId();
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
        await claimSession(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Realtime: detect when another device takes over our account
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`session-watch-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const newId = (payload.new as { active_session_id?: string })?.active_session_id;
          const localId = getLocalSessionId();
          if (newId && localId && newId !== localId && claimedFor.current === user.id) {
            toast.error("Sua conta foi acessada em outro dispositivo. Você foi desconectado.");
            clearLocalSessionId();
            claimedFor.current = null;
            supabase.auth.signOut();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const signOut = async () => {
    if (user) {
      await supabase
        .from("profiles")
        .update({ active_session_id: null })
        .eq("user_id", user.id);
    }
    clearLocalSessionId();
    claimedFor.current = null;
    claiming.current = false;
    await supabase.auth.signOut();
    setProfile(null);
    setNeedsOnboarding(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, needsOnboarding, signOut, refreshProfile, completeOnboarding }}>
      {children}
      <ConfirmModal
        open={!!pendingTakeover}
        onClose={cancelTakeover}
        onConfirm={confirmTakeover}
        title="Conta ativa em outro dispositivo"
        description="Já existe uma sessão ativa nesta conta em outro dispositivo. Se continuar, a outra sessão será desconectada imediatamente. Deseja continuar?"
        confirmLabel="Continuar e desconectar a outra"
        cancelLabel="Cancelar"
        destructive
      />
    </AuthContext.Provider>
  );
};

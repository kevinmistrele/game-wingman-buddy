import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface OnlineStatusContextType {
  isOnline: (userId: string) => boolean;
}

const OnlineStatusContext = createContext<OnlineStatusContextType>({
  isOnline: () => false,
});

export function useOnlineStatus() {
  return useContext(OnlineStatusContext);
}

interface PresenceState {
  user_id: string;
  online_at: string;
}

export function OnlineStatusProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!userId) {
      setOnlineUserIds(new Set());
      return;
    }

    const channel = supabase.channel("online-users", {
      config: { presence: { key: userId } },
    });

    channelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresenceState>();
        const ids = new Set<string>(
          Object.values(state)
            .flat()
            .map(p => p.user_id)
            .filter(Boolean)
        );
        setOnlineUserIds(ids);
      })
      .on("presence", { event: "join" }, ({ newPresences }) => {
        setOnlineUserIds(prev => {
          const next = new Set(prev);
          const presences = newPresences as unknown as PresenceState[];
          presences.forEach((presence) => { if (presence.user_id) next.add(presence.user_id); });
          return next;
        });
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        setOnlineUserIds(prev => {
          const next = new Set(prev);
          const presences = leftPresences as unknown as PresenceState[];
          presences.forEach((presence) => { if (presence.user_id) next.delete(presence.user_id); });
          return next;
        });
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ user_id: userId, online_at: new Date().toISOString() });
        }
      });

    return () => {
      channel.untrack().then(() => supabase.removeChannel(channel));
      channelRef.current = null;
    };
  }, [userId]);

  function isOnline(userId: string): boolean {
    return onlineUserIds.has(userId);
  }

  return (
    <OnlineStatusContext.Provider value={{ isOnline }}>
      {children}
    </OnlineStatusContext.Provider>
  );
}

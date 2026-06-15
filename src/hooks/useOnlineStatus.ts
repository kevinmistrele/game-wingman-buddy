import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Atualiza last_seen no DB apenas na sessão inicial e a cada 5 minutos.
 * O status online em tempo real é gerenciado pelo OnlineStatusContext via Presence.
 *
 * last_seen continua útil para exibir "visto às X" quando o usuário está offline.
 */
export function useOnlineStatus() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const updateLastSeen = () =>
      supabase.from("profiles").update({ last_seen: new Date().toISOString() }).eq("user_id", user.id);

    updateLastSeen();
    // 5 minutos em vez de 60s — o Presence já cobre o status em tempo real
    const interval = setInterval(updateLastSeen, 5 * 60_000);
    return () => clearInterval(interval);
  }, [user]);
}

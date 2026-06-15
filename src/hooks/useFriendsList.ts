import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { FriendWithProfile } from "@/types/chat";
import type { FriendRow } from "@/types/supabase-rpc";

// Adapta o retorno flat do RPC para FriendWithProfile
function rowToFriendWithProfile(row: FriendRow): FriendWithProfile {
  return {
    id: row.id,
    user1_id: row.user1_id,
    user2_id: row.user2_id,
    created_at: row.created_at,
    profile: {
      user_id: row.friend_user_id,
      id: row.friend_user_id,
      username: row.username,
      avatar_url: row.avatar_url,
      riot_id: row.riot_id,
      last_seen: row.last_seen,
      discord_username: row.discord_username,
      discord_id: null,
      preferred_role: row.preferred_role,
      preferred_duo_role: null,
      preferred_game: "lol",
      rank: null,
      rank_tier: row.rank_tier,
      rank_division: row.rank_division,
      rank_source: row.rank_source,
      active_session_id: null,
      session_started_at: null,
      created_at: row.created_at,
      updated_at: row.created_at,
    },
  };
}

export function useFriendsList(onFriendshipsChanged?: () => void) {
  const { user } = useAuth();
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);

  // ─── 1 query via RPC — resolve N+1 ─────────────────────────────────────────
  const fetchFriends = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase.rpc("get_my_friends");
    if (error || !data) return;

    setFriends((data as FriendRow[]).map(rowToFriendWithProfile));
  }, [user]);

  useEffect(() => { fetchFriends(); }, [fetchFriends]);

  // Realtime: mudanças de amizade
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("friendships-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "friendships" }, () => {
        fetchFriends();
        onFriendshipsChanged?.();
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "friendships" }, () => {
        fetchFriends();
        onFriendshipsChanged?.();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchFriends, onFriendshipsChanged]);

  function removeFriendFromState(friendshipId: string) {
    setFriends(prev => prev.filter(f => f.id !== friendshipId));
  }

  function removeFriendsByUserId(otherUserId: string) {
    setFriends(prev => prev.filter(f => {
      const other = f.user1_id === user?.id ? f.user2_id : f.user1_id;
      return other !== otherUserId;
    }));
  }

  return { friends, fetchFriends, removeFriendFromState, removeFriendsByUserId };
}

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRiotProfile } from "@/hooks/useRiotMatches";
import { canMatch } from "@/lib/eloUtils";
import type { Tables } from "@/integrations/supabase/types";
import type { QueueMode } from "@/lib/eloUtils";

type Match = Tables<"matches">;

interface MatchedPlayerInfo {
  profile: Tables<"profiles">;
  rank: { tier: string; rank: string; lp: number; winRate: number } | null;
  rankSource?: "riot" | "manual";
}

export const useMatchmaking = (game: "lol" | "valorant") => {
  const { user, profile } = useAuth();
  const [status, setStatus] = useState<"idle" | "searching" | "found">("idle");
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [matchedPlayer, setMatchedPlayer] = useState<MatchedPlayerInfo | null>(null);
  const [queueEntryId, setQueueEntryId] = useState<string | null>(null);
  const [queueCounts, setQueueCounts] = useState<Record<string, number>>({});
  const [otherAccepted, setOtherAccepted] = useState(false);
  const selectedModeRef = useRef<QueueMode>("normal");

  // Fetch own rank from Riot API
  const { data: riotData } = useRiotProfile(game, profile?.riot_id, "br1", 1);
  const riotRank = riotData?.game === "lol" && riotData.summoner?.ranked
    ? riotData.summoner.ranked.find(r => r.queueType === "RANKED_SOLO_5x5")
      ?? riotData.summoner.ranked.find(r => r.queueType === "RANKED_FLEX_SR")
      ?? null
    : null;

  // Fallback to manual rank from profile
  const manualTier = (profile as any)?.rank_tier as string | null;
  const manualDivision = (profile as any)?.rank_division as string | null;
  const manualRank = manualTier ? { tier: manualTier, rank: manualDivision ?? "IV", lp: 0, winRate: 0 } : null;

  // Effective rank: API > manual
  const myRank = riotRank ?? manualRank;
  const myRankSource: "riot" | "manual" | null = riotRank ? "riot" : manualRank ? "manual" : null;

  // Fetch queue counts periodically
  useEffect(() => {
    const fetchCounts = async () => {
      const { data } = await supabase
        .from("matchmaking_queue")
        .select("mode")
        .eq("game", game)
        .eq("status", "waiting");
      if (data) {
        const counts: Record<string, number> = {};
        data.forEach(entry => {
          const mode = (entry as any).mode ?? "normal";
          counts[mode] = (counts[mode] ?? 0) + 1;
        });
        setQueueCounts(counts);
      }
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 5000);
    return () => clearInterval(interval);
  }, [game]);

  // Helper to resolve a user's rank (API first, then manual fallback)
  const resolveOpponentRank = async (otherProfile: Tables<"profiles">): Promise<{ rank: MatchedPlayerInfo["rank"]; source: "riot" | "manual" | null }> => {
    // Try Riot API first
    if (otherProfile.riot_id) {
      try {
        const projectUrl = import.meta.env.VITE_SUPABASE_URL;
        const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(
          `${projectUrl}/functions/v1/riot-matches?action=profile&game=lol&riotId=${encodeURIComponent(otherProfile.riot_id)}&region=br1&count=1`,
          { headers: { Authorization: `Bearer ${session?.access_token ?? ""}`, apikey: apiKey } }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.summoner?.ranked) {
            const soloQ = data.summoner.ranked.find((r: any) => r.queueType === "RANKED_SOLO_5x5");
            const flexQ = data.summoner.ranked.find((r: any) => r.queueType === "RANKED_FLEX_SR");
            const rank = soloQ ?? flexQ ?? null;
            if (rank) return { rank, source: "riot" };
          }
        }
      } catch { /* fall through to manual */ }
    }

    // Fallback to manual rank
    const oppTier = (otherProfile as any)?.rank_tier as string | null;
    const oppDiv = (otherProfile as any)?.rank_division as string | null;
    if (oppTier) {
      return { rank: { tier: oppTier, rank: oppDiv ?? "IV", lp: 0, winRate: 0 }, source: "manual" };
    }

    return { rank: null, source: null };
  };

  // Listen for match changes in real-time
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("matches-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches" },
        async (payload) => {
          const match = payload.new as Match;
          if (!match || (match.user1_id !== user.id && match.user2_id !== user.id)) return;

          setCurrentMatch(match);

          if (match.status === "pending") {
            setStatus("found");
            const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
            const isUser1 = match.user1_id === user.id;
            const otherStatus = isUser1 ? match.user2_status : match.user1_status;
            setOtherAccepted(otherStatus === "accepted");

            const { data: otherProfile } = await supabase
              .from("profiles").select("*").eq("user_id", otherUserId).single();

            if (otherProfile) {
              const { rank, source } = await resolveOpponentRank(otherProfile);
              setMatchedPlayer({ profile: otherProfile, rank, rankSource: source ?? undefined });
            }
          } else if (match.status === "accepted") {
            setStatus("idle");
          } else if (match.status === "declined" || match.status === "expired") {
            setStatus("idle");
            setCurrentMatch(null);
            setMatchedPlayer(null);
            setOtherAccepted(false);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    if (!currentMatch || !user || status !== "found") return;
    const isUser1 = currentMatch.user1_id === user.id;
    const otherStatus = isUser1 ? currentMatch.user2_status : currentMatch.user1_status;
    setOtherAccepted(otherStatus === "accepted");
  }, [currentMatch, user, status]);

  const joinQueue = useCallback(async (mode: QueueMode) => {
    if (!user) return;
    selectedModeRef.current = mode;

    const isRanked = mode === "solo_duo" || mode === "flex";
    if (isRanked && !myRank) {
      throw new Error("Você precisa ter um rank para entrar em filas ranqueadas.");
    }

    if (mode === "solo_duo" && myRank) {
      const highTiers = ["MASTER", "GRANDMASTER", "CHALLENGER"];
      if (highTiers.includes(myRank.tier)) {
        throw new Error("Mestre, Grão-Mestre e Desafiante não podem jogar Solo/Duo.");
      }
    }

    const { data, error } = await supabase
      .from("matchmaking_queue")
      .insert({ user_id: user.id, game, status: "waiting", mode } as any)
      .select()
      .single();

    if (error) throw error;
    setQueueEntryId(data.id);
    setStatus("searching");

    const { data: waitingPlayers } = await supabase
      .from("matchmaking_queue")
      .select("*")
      .eq("game", game)
      .eq("status", "waiting")
      .neq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(20);

    if (!waitingPlayers) return;

    const sameModeWaiting = waitingPlayers.filter((p: any) => (p.mode ?? "normal") === mode);

    for (const opponent of sameModeWaiting) {
      if (isRanked) {
        try {
          const { data: oppProfile } = await supabase
            .from("profiles").select("*").eq("user_id", opponent.user_id).single();

          if (!oppProfile) continue;

          const { rank: oppRank } = await resolveOpponentRank(oppProfile);
          if (!oppRank) continue;
          if (!canMatch(mode, myRank, { tier: oppRank.tier, rank: oppRank.rank })) continue;
        } catch {
          continue;
        }
      }

      const { data: match, error: matchError } = await supabase
        .from("matches")
        .insert({ user1_id: opponent.user_id, user2_id: user.id, game })
        .select()
        .single();

      if (!matchError && match) {
        await supabase
          .from("matchmaking_queue")
          .update({ status: "matched" })
          .in("id", [data.id, opponent.id]);
        break;
      }
    }
  }, [user, game, myRank]);

  const cancelQueue = useCallback(async () => {
    if (queueEntryId) {
      await supabase.from("matchmaking_queue").update({ status: "cancelled" }).eq("id", queueEntryId);
    }
    setStatus("idle");
    setQueueEntryId(null);
  }, [queueEntryId]);

  const respondToMatch = useCallback(
    async (accepted: boolean) => {
      if (!currentMatch || !user) return;

      const isUser1 = currentMatch.user1_id === user.id;
      const statusField = isUser1 ? "user1_status" : "user2_status";
      const updateData: any = { [statusField]: accepted ? "accepted" : "declined" };

      if (!accepted) {
        updateData.status = "declined";
      } else {
        const otherStatus = isUser1 ? currentMatch.user2_status : currentMatch.user1_status;
        if (otherStatus === "accepted") {
          updateData.status = "accepted";
        }
      }

      await supabase.from("matches").update(updateData).eq("id", currentMatch.id);

      if (updateData.status === "accepted") {
        const [id1, id2] = [currentMatch.user1_id, currentMatch.user2_id].sort();
        await supabase.from("conversations").insert({ user1_id: id1, user2_id: id2, match_id: currentMatch.id });
        await supabase.from("friendships").insert({ user1_id: id1, user2_id: id2 });
      }

      if (!accepted) {
        setStatus("idle");
        setCurrentMatch(null);
        setMatchedPlayer(null);
        setOtherAccepted(false);
      }
    },
    [currentMatch, user]
  );

  return {
    status,
    currentMatch,
    matchedPlayer,
    myRank,
    myRankSource,
    queueCounts,
    otherAccepted,
    joinQueue,
    cancelQueue,
    respondToMatch,
  };
};

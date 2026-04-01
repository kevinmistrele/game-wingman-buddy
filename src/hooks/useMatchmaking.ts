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
  const myRank = riotData?.game === "lol" && riotData.summoner?.ranked
    ? riotData.summoner.ranked.find(r => r.queueType === "RANKED_SOLO_5x5")
      ?? riotData.summoner.ranked.find(r => r.queueType === "RANKED_FLEX_SR")
      ?? null
    : null;

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

            // Check if other user already accepted
            const isUser1 = match.user1_id === user.id;
            const otherStatus = isUser1 ? match.user2_status : match.user1_status;
            setOtherAccepted(otherStatus === "accepted");

            // Fetch matched user's profile and rank
            const { data: otherProfile } = await supabase
              .from("profiles")
              .select("*")
              .eq("user_id", otherUserId)
              .single();

            if (otherProfile) {
              // Try to get rank from Riot API via edge function
              let rank = null;
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
                      rank = soloQ ?? flexQ ?? null;
                    }
                  }
                } catch { /* ignore */ }
              }
              setMatchedPlayer({ profile: otherProfile, rank });
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

  // Watch for other player accepting while we're in "found" state
  useEffect(() => {
    if (!currentMatch || !user || status !== "found") return;
    const isUser1 = currentMatch.user1_id === user.id;
    const otherStatus = isUser1 ? currentMatch.user2_status : currentMatch.user1_status;
    setOtherAccepted(otherStatus === "accepted");
  }, [currentMatch, user, status]);

  const joinQueue = useCallback(async (mode: QueueMode) => {
    if (!user) return;
    selectedModeRef.current = mode;

    // Ranked modes require rank
    const isRanked = mode === "solo_duo" || mode === "flex";
    if (isRanked && !myRank) {
      throw new Error("Você precisa ter um rank para entrar em filas ranqueadas.");
    }

    // Master+ cannot Solo/Duo
    if (mode === "solo_duo" && myRank) {
      const highTiers = ["MASTER", "GRANDMASTER", "CHALLENGER"];
      if (highTiers.includes(myRank.tier)) {
        throw new Error("Mestre, Grão-Mestre e Desafiante não podem jogar Solo/Duo.");
      }
    }

    // Insert into queue
    const { data, error } = await supabase
      .from("matchmaking_queue")
      .insert({ user_id: user.id, game, status: "waiting", mode } as any)
      .select()
      .single();

    if (error) throw error;
    setQueueEntryId(data.id);
    setStatus("searching");

    // Try to find a match
    const { data: waitingPlayers } = await supabase
      .from("matchmaking_queue")
      .select("*")
      .eq("game", game)
      .eq("status", "waiting")
      .neq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(20);

    if (!waitingPlayers) return;

    // Filter by same mode
    const sameModeWaiting = waitingPlayers.filter((p: any) => (p.mode ?? "normal") === mode);

    // For ranked modes, we need to check elo compatibility
    for (const opponent of sameModeWaiting) {
      if (isRanked) {
        // Fetch opponent's rank
        try {
          const { data: oppProfile } = await supabase
            .from("profiles")
            .select("riot_id")
            .eq("user_id", opponent.user_id)
            .single();

          if (!oppProfile?.riot_id) continue;

          const projectUrl = import.meta.env.VITE_SUPABASE_URL;
          const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
          const { data: { session } } = await supabase.auth.getSession();
          const res = await fetch(
            `${projectUrl}/functions/v1/riot-matches?action=profile&game=lol&riotId=${encodeURIComponent(oppProfile.riot_id)}&region=br1&count=1`,
            { headers: { Authorization: `Bearer ${session?.access_token ?? ""}`, apikey: apiKey } }
          );

          if (!res.ok) continue;
          const riotRes = await res.json();
          const oppRanked = riotRes.summoner?.ranked?.find((r: any) => r.queueType === "RANKED_SOLO_5x5")
            ?? riotRes.summoner?.ranked?.find((r: any) => r.queueType === "RANKED_FLEX_SR");

          if (!oppRanked) continue;
          if (!canMatch(mode, myRank, { tier: oppRanked.tier, rank: oppRanked.rank })) continue;
        } catch {
          continue;
        }
      }

      // Found a compatible opponent - create match
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
      await supabase
        .from("matchmaking_queue")
        .update({ status: "cancelled" })
        .eq("id", queueEntryId);
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
    queueCounts,
    otherAccepted,
    joinQueue,
    cancelQueue,
    respondToMatch,
  };
};

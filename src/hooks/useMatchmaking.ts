import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRiotProfile } from "@/hooks/useRiotMatches";
import { canMatch, areRolesCompatible } from "@/lib/eloUtils";
import { playMatchFoundSound, playMatchAcceptedSound } from "@/lib/soundUtils";
import type { Tables } from "@/integrations/supabase/types";
import type { QueueMode, Role } from "@/lib/eloUtils";

type Match = Tables<"matches">;

interface MatchedPlayerInfo {
  profile: Tables<"profiles">;
  rank: { tier: string; rank: string; lp: number; winRate: number } | null;
  rankSource?: "riot" | "manual";
  myRole?: string | null;
}

const QUEUE_ACTIVE_WINDOW_MS = 2 * 60 * 1000; // 2 minutes

export const useMatchmaking = () => {
  const game = "lol";
  const { user, profile } = useAuth();
  const [status, setStatus] = useState<"idle" | "searching" | "found">("idle");
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [matchedPlayer, setMatchedPlayer] = useState<MatchedPlayerInfo | null>(null);
  const [queueEntryId, setQueueEntryId] = useState<string | null>(null);
  const [queueCounts, setQueueCounts] = useState<Record<string, number>>({});
  const [otherAccepted, setOtherAccepted] = useState(false);
  const [acceptedConvoId, setAcceptedConvoId] = useState<string | null>(null);
  const [searchPhase, setSearchPhase] = useState<"strict" | "expanded">("strict");
  const selectedModeRef = useRef<QueueMode>("normal");
  const selectedRolesRef = useRef<{ myRole: Role | null; desiredDuoRole: Role | null }>({ myRole: null, desiredDuoRole: null });
  const queueEntryIdRef = useRef<string | null>(null);

  // Keep ref in sync for use in beforeunload
  useEffect(() => {
    queueEntryIdRef.current = queueEntryId;
  }, [queueEntryId]);

  const { data: riotData } = useRiotProfile("lol", profile?.riot_id, "br1", 1);
  const riotRank = riotData?.game === "lol" && riotData.summoner?.ranked
    ? riotData.summoner.ranked.find(r => r.queueType === "RANKED_SOLO_5x5")
      ?? riotData.summoner.ranked.find(r => r.queueType === "RANKED_FLEX_SR")
      ?? null
    : null;

  const manualTier = (profile as any)?.rank_tier as string | null;
  const manualDivision = (profile as any)?.rank_division as string | null;
  const manualRank = manualTier ? { tier: manualTier, rank: manualDivision ?? "IV", lp: 0, winRate: 0 } : null;

  const myRank = riotRank ?? manualRank;
  const myRankSource: "riot" | "manual" | null = riotRank ? "riot" : manualRank ? "manual" : null;

  // Search phase timer: reset to strict on search start, expand after 30s
  useEffect(() => {
    if (status !== "searching") return;
    setSearchPhase("strict");
    const timer = setTimeout(() => setSearchPhase("expanded"), 30000);
    return () => clearTimeout(timer);
  }, [status]);

  // Re-attempt matching when phase changes to expanded
  useEffect(() => {
    if (searchPhase !== "expanded" || status !== "searching" || !queueEntryId || !user) return;
    // Re-run matching logic with expanded phase
    attemptMatch();
  }, [searchPhase]);

  // Auto-cancel queue on page unload or component unmount
  useEffect(() => {
    const handleBeforeUnload = () => {
      const entryId = queueEntryIdRef.current;
      if (entryId) {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/matchmaking_queue?id=eq.${entryId}`;
        const body = JSON.stringify({ status: "cancelled" });
        navigator.sendBeacon(
          url,
          new Blob([body], { type: "application/json" })
        );
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      const entryId = queueEntryIdRef.current;
      if (entryId) {
        supabase.from("matchmaking_queue").update({ status: "cancelled" }).eq("id", entryId).then();
      }
    };
  }, []);

  // Fetch queue counts with 2-minute active window
  useEffect(() => {
    const fetchCounts = async () => {
      const cutoff = new Date(Date.now() - QUEUE_ACTIVE_WINDOW_MS).toISOString();
      const { data } = await supabase
        .from("matchmaking_queue").select("mode").eq("game", game).eq("status", "waiting").gte("created_at", cutoff);
      if (data) {
        const counts: Record<string, number> = {};
        data.forEach(entry => { const mode = (entry as any).mode ?? "normal"; counts[mode] = (counts[mode] ?? 0) + 1; });
        setQueueCounts(counts);
      }
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 5000);
    return () => clearInterval(interval);
  }, [game]);

  const resolveOpponentRank = async (otherProfile: Tables<"profiles">): Promise<{ rank: MatchedPlayerInfo["rank"]; source: "riot" | "manual" | null }> => {
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
      } catch { /* fall through */ }
    }

    const oppTier = (otherProfile as any)?.rank_tier as string | null;
    const oppDiv = (otherProfile as any)?.rank_division as string | null;
    if (oppTier) return { rank: { tier: oppTier, rank: oppDiv ?? "IV", lp: 0, winRate: 0 }, source: "manual" };
    return { rank: null, source: null };
  };

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`matches-realtime-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" },
        async (payload) => {
          const match = (payload.new ?? payload.old) as Match;
          console.log("[realtime:matches]", payload.eventType, match?.id, match?.status);
          if (!match || (match.user1_id !== user.id && match.user2_id !== user.id)) return;
          setCurrentMatch(match);

          if (match.status === "pending") {
            setStatus("found");
            playMatchFoundSound();
            const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
            const isUser1 = match.user1_id === user.id;
            const otherStatus = isUser1 ? match.user2_status : match.user1_status;
            setOtherAccepted(otherStatus === "accepted");
            if (otherStatus === "accepted") playMatchAcceptedSound();

            const { data: otherProfile } = await supabase.from("profiles").select("*").eq("user_id", otherUserId).single();
            if (otherProfile) {
              const { rank, source } = await resolveOpponentRank(otherProfile);
              // Fetch opponent's queue entry to get their role
              const { data: oppQueueEntry } = await supabase
                .from("matchmaking_queue").select("my_role").eq("user_id", otherUserId).eq("status", "matched").order("created_at", { ascending: false }).limit(1).single();
              setMatchedPlayer({
                profile: otherProfile,
                rank,
                rankSource: source ?? undefined,
                myRole: (oppQueueEntry as any)?.my_role ?? null,
              });
            }
          } else if (match.status === "accepted") {
            const [id1, id2] = [match.user1_id, match.user2_id].sort();
            // Retry up to 3 times with delay to handle race condition
            let convoId: string | null = null;
            for (let attempt = 0; attempt < 3; attempt++) {
              const { data: existingConvo } = await supabase
                .from("conversations").select("id, hidden_by").eq("user1_id", id1).eq("user2_id", id2).limit(1).single();
              if (existingConvo) {
                const hiddenBy: string[] = existingConvo.hidden_by ?? [];
                if (user && hiddenBy.includes(user.id)) {
                  const newHidden = hiddenBy.filter((uid: string) => uid !== user.id);
                  await supabase.from("conversations").update({ hidden_by: newHidden }).eq("id", existingConvo.id);
                }
                convoId = existingConvo.id;
                break;
              }
              if (attempt < 2) await new Promise(r => setTimeout(r, 500));
            }
            // If still not found, create it as fallback
            if (!convoId) {
              const { data: newConvo } = await supabase
                .from("conversations").insert({ user1_id: id1, user2_id: id2, match_id: match.id }).select().single();
              if (newConvo) convoId = newConvo.id;
            }
            if (convoId) setAcceptedConvoId(convoId);
            setStatus("idle");
          } else if (match.status === "declined" || match.status === "expired") {
            setStatus("idle"); setCurrentMatch(null); setMatchedPlayer(null); setOtherAccepted(false);
          }
        }
      ).subscribe((status) => {
        console.log("[realtime:matches] subscription status:", status);
      });
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Polling fallback: when a match is "found", poll DB every 2s to detect bothAccepted
  // in case the realtime UPDATE event is missed by this client.
  useEffect(() => {
    if (status !== "found" || !currentMatch || !user) return;
    const matchId = currentMatch.id;
    const interval = setInterval(async () => {
      const { data: fresh } = await supabase
        .from("matches").select("*").eq("id", matchId).single();
      if (!fresh) return;
      const isUser1 = fresh.user1_id === user.id;
      const otherStatus = isUser1 ? fresh.user2_status : fresh.user1_status;
      const myStatus = isUser1 ? fresh.user1_status : fresh.user2_status;
      setOtherAccepted(otherStatus === "accepted");
      // If both accepted but we haven't navigated yet, trigger conversation lookup
      if (fresh.status === "accepted" && myStatus === "accepted" && otherStatus === "accepted" && !acceptedConvoId) {
        const [id1, id2] = [fresh.user1_id, fresh.user2_id].sort();
        const { data: convo } = await supabase
          .from("conversations").select("id, hidden_by").eq("user1_id", id1).eq("user2_id", id2).limit(1).single();
        if (convo) {
          const hiddenBy: string[] = convo.hidden_by ?? [];
          if (hiddenBy.includes(user.id)) {
            await supabase.from("conversations").update({
              hidden_by: hiddenBy.filter((u: string) => u !== user.id),
            }).eq("id", convo.id);
          }
          console.log("[matchmaking:poll] both accepted, navigating to convo", convo.id);
          setAcceptedConvoId(convo.id);
          setStatus("idle");
        }
      }
      // If match was declined/expired by other player, reset
      if (fresh.status === "declined" || fresh.status === "expired") {
        setStatus("idle"); setCurrentMatch(null); setMatchedPlayer(null); setOtherAccepted(false);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [status, currentMatch, user, acceptedConvoId]);

  useEffect(() => {
    if (!currentMatch || !user || status !== "found") return;
    const isUser1 = currentMatch.user1_id === user.id;
    const otherStatus = isUser1 ? currentMatch.user2_status : currentMatch.user1_status;
    setOtherAccepted(otherStatus === "accepted");
  }, [currentMatch, user, status]);

  const attemptMatch = useCallback(async () => {
    if (!user || !queueEntryIdRef.current) return;
    const mode = selectedModeRef.current;
    const isRanked = mode === "solo_duo" || mode === "flex";
    const { myRole, desiredDuoRole } = selectedRolesRef.current;

    const excludedUserIds = new Set<string>();
    const { data: friendships } = await supabase
      .from("friendships").select("user1_id, user2_id").or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
    const { data: blockedUsers } = await supabase
      .from("blocked_users").select("blocker_id, blocked_id")
      .or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`);

    friendships?.forEach((f) => { excludedUserIds.add(f.user1_id === user.id ? f.user2_id : f.user1_id); });
    blockedUsers?.forEach((b) => { excludedUserIds.add(b.blocker_id === user.id ? b.blocked_id : b.blocker_id); });

    const cutoff = new Date(Date.now() - QUEUE_ACTIVE_WINDOW_MS).toISOString();
    const { data: waitingPlayers } = await supabase
      .from("matchmaking_queue").select("*").eq("game", game).eq("status", "waiting")
      .neq("user_id", user.id).gte("created_at", cutoff)
      .order("created_at", { ascending: true }).limit(20);

    if (!waitingPlayers) return;

    const sameModeWaiting = waitingPlayers
      .filter((p: any) => (p.mode ?? "normal") === mode)
      .filter((p) => !excludedUserIds.has(p.user_id));

    for (const opponent of sameModeWaiting) {
      const { data: freshEntry } = await supabase
        .from("matchmaking_queue").select("status").eq("id", opponent.id).single();
      if (!freshEntry || freshEntry.status !== "waiting") continue;

      if (isRanked) {
        try {
          const { data: oppProfile } = await supabase.from("profiles").select("*").eq("user_id", opponent.user_id).single();
          if (!oppProfile) continue;
          const { rank: oppRank } = await resolveOpponentRank(oppProfile);
          if (!oppRank) continue;

          // 1. Rank compatibility is always required
          if (!canMatch(mode, myRank, { tier: oppRank.tier, rank: oppRank.rank })) continue;

          // 2. In strict phase, check role compatibility
          if (searchPhase === "strict") {
            const oppMyRole = (opponent as any).my_role as string | null;
            const oppDesiredRole = (opponent as any).desired_duo_role as string | null;
            if (!areRolesCompatible(myRole, desiredDuoRole, oppMyRole, oppDesiredRole)) continue;
          }
          // In expanded phase, roles are ignored — only rank matters
        } catch { continue; }
      }

      const { data: match, error: matchError } = await supabase
        .from("matches").insert({ user1_id: opponent.user_id, user2_id: user.id, game }).select().single();
      if (!matchError && match) {
        await supabase.from("matchmaking_queue").update({ status: "matched" }).in("id", [queueEntryIdRef.current!, opponent.id]);
        break;
      }
    }
  }, [user, game, myRank, searchPhase]);

  const joinQueue = useCallback(async (mode: QueueMode, myRole?: Role | null, desiredDuoRole?: Role | null) => {
    if (!user) return;
    selectedModeRef.current = mode;

    const isRanked = mode === "solo_duo" || mode === "flex";
    if (isRanked && !myRank) throw new Error("Você precisa ter um rank para entrar em filas ranqueadas.");

    if (mode === "solo_duo" && myRank) {
      const highTiers = ["MASTER", "GRANDMASTER", "CHALLENGER"];
      if (highTiers.includes(myRank.tier)) throw new Error("Mestre, Grão-Mestre e Desafiante não podem jogar Solo/Duo.");
    }

    // Force null roles for non-ranked modes
    const roleToSave = isRanked ? (myRole ?? null) : null;
    const desiredToSave = isRanked ? (desiredDuoRole ?? null) : null;
    selectedRolesRef.current = { myRole: roleToSave, desiredDuoRole: desiredToSave };

    const { data, error } = await supabase
      .from("matchmaking_queue").insert({
        user_id: user.id, game, status: "waiting", mode,
        my_role: roleToSave, desired_duo_role: desiredToSave,
      } as any).select().single();
    if (error) throw error;
    setQueueEntryId(data.id);
    setStatus("searching");

    // Initial match attempt happens via attemptMatch triggered by status change
    // But we call it directly for immediate matching
    setTimeout(() => attemptMatch(), 100);
  }, [user, game, myRank, attemptMatch]);

  const cancelQueue = useCallback(async () => {
    if (queueEntryId) await supabase.from("matchmaking_queue").update({ status: "cancelled" }).eq("id", queueEntryId);
    setStatus("idle"); setQueueEntryId(null);
  }, [queueEntryId]);

  const respondToMatch = useCallback(async (accepted: boolean) => {
    if (!currentMatch || !user) return;
    const isUser1 = currentMatch.user1_id === user.id;
    const statusField = isUser1 ? "user1_status" : "user2_status";

    if (!accepted) {
      await supabase.from("matches").update({ [statusField]: "declined", status: "declined" } as any).eq("id", currentMatch.id);
      setStatus("idle"); setCurrentMatch(null); setMatchedPlayer(null); setOtherAccepted(false);
      return null;
    }

    await supabase.from("matches").update({ [statusField]: "accepted" } as any).eq("id", currentMatch.id);

    const { data: freshMatch } = await supabase
      .from("matches")
      .select("*")
      .eq("id", currentMatch.id)
      .single();

    if (!freshMatch) return null;

    setCurrentMatch(freshMatch as Match);
    const freshOtherStatus = isUser1 ? freshMatch.user2_status : freshMatch.user1_status;
    setOtherAccepted(freshOtherStatus === "accepted");

    const bothAccepted = freshMatch.user1_status === "accepted" && freshMatch.user2_status === "accepted";
    if (!bothAccepted) return null;

    const [id1, id2] = [freshMatch.user1_id, freshMatch.user2_id].sort();
    let convoId: string | null = null;

    const { data: existingConvo } = await supabase
      .from("conversations").select("id, hidden_by").eq("user1_id", id1).eq("user2_id", id2).limit(1).single();

    if (existingConvo) {
      convoId = existingConvo.id;
      const hiddenBy: string[] = existingConvo.hidden_by ?? [];
      if (hiddenBy.includes(user.id)) {
        const newHidden = hiddenBy.filter((uid: string) => uid !== user.id);
        await supabase.from("conversations").update({ hidden_by: newHidden }).eq("id", existingConvo.id);
      }
    } else {
      const { data: newConvo, error: insertError } = await supabase
        .from("conversations").insert({ user1_id: id1, user2_id: id2, match_id: freshMatch.id }).select().single();
      if (newConvo) {
        convoId = newConvo.id;
      } else {
        // Insert may have failed due to unique constraint race — re-select
        console.warn("[matchmaking] convo insert failed, retrying lookup", insertError);
        for (let attempt = 0; attempt < 4; attempt++) {
          await new Promise(r => setTimeout(r, 300));
          const { data: retry } = await supabase
            .from("conversations").select("id, hidden_by").eq("user1_id", id1).eq("user2_id", id2).limit(1).single();
          if (retry) {
            convoId = retry.id;
            const hiddenBy: string[] = retry.hidden_by ?? [];
            if (hiddenBy.includes(user.id)) {
              const newHidden = hiddenBy.filter((uid: string) => uid !== user.id);
              await supabase.from("conversations").update({ hidden_by: newHidden }).eq("id", retry.id);
            }
            break;
          }
        }
      }
    }

    if (freshMatch.status !== "accepted") {
      await supabase.from("matches").update({ status: "accepted" }).eq("id", freshMatch.id);
    }

    if (convoId) setAcceptedConvoId(convoId);
    setStatus("idle");
    return convoId;
  }, [currentMatch, user]);

  return { status, currentMatch, matchedPlayer, myRank, myRankSource, queueCounts, otherAccepted, acceptedConvoId, searchPhase, joinQueue, cancelQueue, respondToMatch };
};

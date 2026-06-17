import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRiotProfile } from "@/hooks/useRiotMatches";
import { playMatchFoundSound, playMatchAcceptedSound } from "@/lib/soundUtils";
import { resolveProfileRank } from "@/lib/riotUtils";
import { findOrCreateConversation } from "@/lib/conversationUtils";
import type { Tables } from "@/integrations/supabase/types";
import type { QueueMode, Role } from "@/lib/eloUtils";
import type { MatchedPlayerInfo, QueueStatus, SearchPhase } from "@/types/matchmaking";
import type { RankSource } from "@/types/riot";

type Match = Tables<"matches">;

const QUEUE_ACTIVE_WINDOW_MS = 2 * 60 * 1000;
const GAME = "lol" as const;

async function callMatchmakingApi(
  action: string,
  data: Record<string, unknown>,
  token: string,
): Promise<Record<string, unknown>> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const apiKey      = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const res = await fetch(`${supabaseUrl}/functions/v1/matchmaking`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      apikey: apiKey,
    },
    body: JSON.stringify({ action, ...data }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error((err as { error?: string }).error ?? "Matchmaking API error");
  }
  return res.json();
}

export function useMatchmaking() {
  const { user, profile } = useAuth();

  const [status, setStatus]               = useState<QueueStatus>("idle");
  const [currentMatch, setCurrentMatch]   = useState<Match | null>(null);
  const [matchedPlayer, setMatchedPlayer] = useState<MatchedPlayerInfo | null>(null);
  const [queueEntryId, setQueueEntryId]   = useState<string | null>(null);
  const [queueCounts, setQueueCounts]     = useState<Record<string, number>>({});
  const [otherAccepted, setOtherAccepted] = useState(false);
  const [acceptedConvoId, setAcceptedConvoId] = useState<string | null>(null);
  const [searchPhase, setSearchPhase]     = useState<SearchPhase>("strict");

  const queueEntryIdRef = useRef<string | null>(null);

  // Keep ref in sync (used in beforeunload)
  useEffect(() => { queueEntryIdRef.current = queueEntryId; }, [queueEntryId]);

  // ─── Resolve current user rank (display only) ────────────────────────────
  const { data: riotData } = useRiotProfile(GAME, profile?.riot_id, "br1", 1);
  const riotRank = riotData?.game === GAME && riotData.summoner?.ranked
    ? riotData.summoner.ranked.find(r => r.queueType === "RANKED_SOLO_5x5")
      ?? riotData.summoner.ranked.find(r => r.queueType === "RANKED_FLEX_SR")
      ?? null
    : null;

  const manualRank = profile?.rank_tier
    ? { tier: profile.rank_tier, rank: profile.rank_division ?? "IV", lp: 0, winRate: 0 }
    : null;

  const myRank = riotRank ?? manualRank;
  const myRankSource: RankSource | null = riotRank ? "riot" : manualRank ? "manual" : null;

  // ─── Search phase timer ──────────────────────────────────────────────────
  useEffect(() => {
    if (status !== "searching") return;
    setSearchPhase("strict");
    const timer = setTimeout(() => setSearchPhase("expanded"), 30_000);
    return () => clearTimeout(timer);
  }, [status]);

  // ─── Retry matching when entering expanded phase ─────────────────────────
  const retryMatch = useCallback(async () => {
    if (!user || !queueEntryIdRef.current) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    try {
      await callMatchmakingApi("retry", { queueEntryId: queueEntryIdRef.current }, session.access_token);
    } catch { /* best-effort */ }
  }, [user]);

  useEffect(() => {
    if (searchPhase !== "expanded" || status !== "searching" || !queueEntryId || !user) return;
    retryMatch();
  }, [retryMatch, queueEntryId, searchPhase, status, user]);

  // ─── Auto-cancel on unload/unmount ───────────────────────────────────────
  useEffect(() => {
    const handleBeforeUnload = () => {
      const entryId = queueEntryIdRef.current;
      if (!entryId) return;
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/matchmaking_queue?id=eq.${entryId}`;
      navigator.sendBeacon(url, new Blob([JSON.stringify({ status: "cancelled" })], { type: "application/json" }));
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      const entryId = queueEntryIdRef.current;
      if (entryId) supabase.from("matchmaking_queue").update({ status: "cancelled" }).eq("id", entryId).then();
    };
  }, []);

  // ─── Queue counts polling ────────────────────────────────────────────────
  useEffect(() => {
    async function fetchCounts() {
      const cutoff = new Date(Date.now() - QUEUE_ACTIVE_WINDOW_MS).toISOString();
      const { data } = await supabase
        .from("matchmaking_queue")
        .select("mode")
        .eq("game", GAME)
        .eq("status", "waiting")
        .gte("created_at", cutoff);
      if (data) {
        const counts: Record<string, number> = {};
        data.forEach(entry => { const mode = entry.mode ?? "normal"; counts[mode] = (counts[mode] ?? 0) + 1; });
        setQueueCounts(counts);
      }
    }
    fetchCounts();
    const interval = setInterval(fetchCounts, 5_000);
    return () => clearInterval(interval);
  }, []);

  // ─── Realtime: match events ──────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`matches-realtime-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, async (payload) => {
        const match = (payload.new ?? payload.old) as Match;
        if (!match || (match.user1_id !== user.id && match.user2_id !== user.id)) return;

        setCurrentMatch(match);

        if (match.status === "pending") {
          setStatus("found");
          playMatchFoundSound();

          const isUser1     = match.user1_id === user.id;
          const otherUserId = isUser1 ? match.user2_id : match.user1_id;
          const otherStatus = isUser1 ? match.user2_status : match.user1_status;

          setOtherAccepted(otherStatus === "accepted");
          if (otherStatus === "accepted") playMatchAcceptedSound();

          const { data: otherProfile } = await supabase
            .from("profiles").select("*").eq("user_id", otherUserId).single();
          if (otherProfile) {
            const { rank, source } = await resolveProfileRank(otherProfile);
            const { data: oppQueueEntry } = await supabase
              .from("matchmaking_queue").select("my_role")
              .eq("user_id", otherUserId).eq("status", "matched")
              .order("created_at", { ascending: false }).limit(1).single();
            setMatchedPlayer({ profile: otherProfile, rank, rankSource: source ?? undefined, myRole: oppQueueEntry?.my_role ?? null });
          }
        } else if (match.status === "accepted") {
          const convoId = await findOrCreateConversation(user.id, match.user1_id, match.user2_id, match.id);
          if (convoId) setAcceptedConvoId(convoId);
          setStatus("idle");
        } else if (match.status === "declined" || match.status === "expired") {
          resetMatchState();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // ─── Polling fallback for accepted match ─────────────────────────────────
  useEffect(() => {
    if (status !== "found" || !currentMatch || !user) return;

    const matchId = currentMatch.id;
    const interval = setInterval(async () => {
      const { data: fresh } = await supabase.from("matches").select("*").eq("id", matchId).single();
      if (!fresh) return;

      const isUser1     = fresh.user1_id === user.id;
      const otherStatus = isUser1 ? fresh.user2_status : fresh.user1_status;
      const myStatus    = isUser1 ? fresh.user1_status : fresh.user2_status;

      setOtherAccepted(otherStatus === "accepted");

      if (fresh.status === "accepted" && myStatus === "accepted" && otherStatus === "accepted" && !acceptedConvoId) {
        const convoId = await findOrCreateConversation(user.id, fresh.user1_id, fresh.user2_id);
        if (convoId) { setAcceptedConvoId(convoId); setStatus("idle"); }
      }

      if (fresh.status === "declined" || fresh.status === "expired") resetMatchState();
    }, 2_000);

    return () => clearInterval(interval);
  }, [status, currentMatch, user, acceptedConvoId]);

  useEffect(() => {
    if (!currentMatch || !user || status !== "found") return;
    const isUser1 = currentMatch.user1_id === user.id;
    setOtherAccepted((isUser1 ? currentMatch.user2_status : currentMatch.user1_status) === "accepted");
  }, [currentMatch, user, status]);

  // ─── Helpers ─────────────────────────────────────────────────────────────
  function resetMatchState() {
    setStatus("idle");
    setCurrentMatch(null);
    setMatchedPlayer(null);
    setOtherAccepted(false);
  }

  // ─── Actions ─────────────────────────────────────────────────────────────
  const joinQueue = useCallback(async (mode: QueueMode, myRole?: Role | null, desiredDuoRole?: Role | null) => {
    if (!user) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error("Sessão expirada. Faça login novamente.");

    const result = await callMatchmakingApi(
      "join",
      { mode, myRole: myRole ?? null, desiredDuoRole: desiredDuoRole ?? null },
      session.access_token,
    );

    setQueueEntryId(result.queueEntryId as string);
    setStatus("searching");
  }, [user]);

  const cancelQueue = useCallback(async () => {
    if (!queueEntryId || !user) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      await callMatchmakingApi("cancel", { queueEntryId }, session.access_token).catch(() => {
        supabase.from("matchmaking_queue").update({ status: "cancelled" }).eq("id", queueEntryId).then();
      });
    } else {
      await supabase.from("matchmaking_queue").update({ status: "cancelled" }).eq("id", queueEntryId);
    }

    setStatus("idle");
    setQueueEntryId(null);
  }, [queueEntryId, user]);

  const respondToMatch = useCallback(async (accepted: boolean) => {
    if (!currentMatch || !user) return null;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error("Sessão expirada. Faça login novamente.");

    const result = await callMatchmakingApi(
      "respond",
      { matchId: currentMatch.id, accepted },
      session.access_token,
    );

    if (!accepted) {
      resetMatchState();
      return null;
    }

    const convoId = (result.conversationId as string | null) ?? null;
    if (convoId) {
      setAcceptedConvoId(convoId);
      setStatus("idle");
    }
    return convoId;
  }, [currentMatch, user]);

  return {
    status, currentMatch, matchedPlayer, myRank, myRankSource,
    queueCounts, otherAccepted, acceptedConvoId, searchPhase,
    joinQueue, cancelQueue, respondToMatch,
  };
}

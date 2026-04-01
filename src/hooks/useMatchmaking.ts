import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";

type QueueEntry = Tables<"matchmaking_queue">;
type Match = Tables<"matches">;

export const useMatchmaking = (game: "lol" | "valorant") => {
  const { user } = useAuth();
  const [status, setStatus] = useState<"idle" | "searching" | "found">("idle");
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [matchedProfile, setMatchedProfile] = useState<Tables<"profiles"> | null>(null);
  const [queueEntryId, setQueueEntryId] = useState<string | null>(null);

  // Listen for match changes in real-time
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("matches-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "matches",
        },
        (payload) => {
          const match = payload.new as Match;
          if (match && (match.user1_id === user.id || match.user2_id === user.id)) {
            setCurrentMatch(match);
            if (match.status === "pending") {
              setStatus("found");
              // Fetch matched user's profile
              const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
              supabase
                .from("profiles")
                .select("*")
                .eq("user_id", otherUserId)
                .single()
                .then(({ data }) => {
                  if (data) setMatchedProfile(data);
                });
            } else if (match.status === "accepted") {
              setStatus("idle");
            } else if (match.status === "declined" || match.status === "expired") {
              setStatus("idle");
              setCurrentMatch(null);
              setMatchedProfile(null);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const joinQueue = useCallback(async () => {
    if (!user) return;

    // Insert into queue
    const { data, error } = await supabase
      .from("matchmaking_queue")
      .insert({ user_id: user.id, game, status: "waiting" })
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
      .limit(1);

    if (waitingPlayers && waitingPlayers.length > 0) {
      const opponent = waitingPlayers[0];

      // Create match
      const { data: match, error: matchError } = await supabase
        .from("matches")
        .insert({
          user1_id: opponent.user_id,
          user2_id: user.id,
          game,
        })
        .select()
        .single();

      if (!matchError && match) {
        // Update both queue entries to matched
        await supabase
          .from("matchmaking_queue")
          .update({ status: "matched" })
          .in("id", [data.id, opponent.id]);
      }
    }
  }, [user, game]);

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
      const otherStatusField = isUser1 ? "user2_status" : "user1_status";

      const updateData: any = {
        [statusField]: accepted ? "accepted" : "declined",
      };

      // If declined, set overall status to declined
      if (!accepted) {
        updateData.status = "declined";
      } else {
        // Check if other user already accepted
        const otherStatus = isUser1 ? currentMatch.user2_status : currentMatch.user1_status;
        if (otherStatus === "accepted") {
          updateData.status = "accepted";
        }
      }

      await supabase
        .from("matches")
        .update(updateData)
        .eq("id", currentMatch.id);

      // If both accepted, create conversation and friendship
      if (updateData.status === "accepted") {
        const [id1, id2] = [currentMatch.user1_id, currentMatch.user2_id].sort();

        await supabase.from("conversations").insert({
          user1_id: id1,
          user2_id: id2,
          match_id: currentMatch.id,
        });

        await supabase.from("friendships").insert({
          user1_id: id1,
          user2_id: id2,
        });
      }

      if (!accepted) {
        setStatus("idle");
        setCurrentMatch(null);
        setMatchedProfile(null);
      }
    },
    [currentMatch, user]
  );

  return {
    status,
    currentMatch,
    matchedProfile,
    joinQueue,
    cancelQueue,
    respondToMatch,
  };
};

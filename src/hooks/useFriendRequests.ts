import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  senderProfile?: {
    username: string;
    avatar_url: string | null;
    riot_id: string | null;
  };
}

export const useFriendRequests = () => {
  const { user } = useAuth();
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);

  const fetchRequests = useCallback(async () => {
    if (!user) return;

    const { data: received } = await supabase
      .from("friend_requests")
      .select("*")
      .eq("receiver_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (received) {
      const enriched: FriendRequest[] = [];
      for (const req of received) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, avatar_url, riot_id")
          .eq("user_id", req.sender_id)
          .single();
        enriched.push({ ...req, senderProfile: profile ?? undefined });
      }
      setReceivedRequests(enriched);
    }

    const { data: sent } = await supabase
      .from("friend_requests")
      .select("*")
      .eq("sender_id", user.id)
      .eq("status", "pending");

    if (sent) setSentRequests(sent);
  }, [user]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Realtime listener for new requests
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("friend-requests-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "friend_requests", filter: `receiver_id=eq.${user.id}` },
        async (payload) => {
          const req = payload.new as FriendRequest;
          if (req.status === "pending") {
            const { data: profile } = await supabase
              .from("profiles")
              .select("username, avatar_url, riot_id")
              .eq("user_id", req.sender_id)
              .single();
            const enrichedReq = { ...req, senderProfile: profile ?? undefined };
            setReceivedRequests((prev) => [enrichedReq, ...prev]);
            toast.info(`${profile?.username ?? "Alguém"} enviou uma solicitação de amizade!`);
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const sendRequest = useCallback(async (receiverId: string) => {
    if (!user) return;

    // Check if blocked
    const { data: blocked } = await supabase
      .from("blocked_users")
      .select("id")
      .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${receiverId}),and(blocker_id.eq.${receiverId},blocked_id.eq.${user.id})`)
      .limit(1);

    if (blocked && blocked.length > 0) {
      toast.error("Não é possível enviar solicitação para este jogador.");
      return;
    }

    // Check if already friends
    const [id1, id2] = [user.id, receiverId].sort();
    const { data: existingFriendship } = await supabase
      .from("friendships")
      .select("id")
      .eq("user1_id", id1)
      .eq("user2_id", id2)
      .limit(1);

    if (existingFriendship && existingFriendship.length > 0) {
      toast.info("Vocês já são amigos!");
      return;
    }

    // Check if receiver already sent a pending request to us — auto-accept
    const { data: reverseRequest } = await supabase
      .from("friend_requests")
      .select("id")
      .eq("sender_id", receiverId)
      .eq("receiver_id", user.id)
      .eq("status", "pending")
      .limit(1);

    if (reverseRequest && reverseRequest.length > 0) {
      // Auto-accept: both sent requests to each other
      await supabase
        .from("friend_requests")
        .update({ status: "accepted" })
        .eq("id", reverseRequest[0].id);

      const [id1, id2] = [user.id, receiverId].sort();
      await supabase.from("friendships").insert({ user1_id: id1, user2_id: id2 });

      // Create or unhide conversation
      const { data: existingConvo } = await supabase
        .from("conversations")
        .select("*")
        .eq("user1_id", id1)
        .eq("user2_id", id2)
        .limit(1)
        .single();

      if (existingConvo) {
        const hiddenBy: string[] = existingConvo.hidden_by ?? [];
        if (hiddenBy.includes(user.id)) {
          await supabase
            .from("conversations")
            .update({ hidden_by: hiddenBy.filter((id) => id !== user.id) })
            .eq("id", existingConvo.id);
        }
      } else {
        await supabase.from("conversations").insert({ user1_id: id1, user2_id: id2 });
      }

      setReceivedRequests((prev) => prev.filter((r) => r.id !== reverseRequest[0].id));
      toast.success("Vocês se adicionaram mutuamente! Amigo adicionado.");
      fetchRequests();
      return;
    }

    // Check existing request from us (any status)
    const { data: existing } = await supabase
      .from("friend_requests")
      .select("id, status")
      .eq("sender_id", user.id)
      .eq("receiver_id", receiverId)
      .limit(1);

    if (existing && existing.length > 0) {
      if (existing[0].status === "pending") {
        toast.info("Solicitação já enviada!");
        return;
      }
      // Delete old accepted/declined request so we can re-send
      await supabase.from("friend_requests").delete().eq("id", existing[0].id);
    }

    // Also clean up old requests from receiver to us (non-pending)
    const { data: reverseOld } = await supabase
      .from("friend_requests")
      .select("id, status")
      .eq("sender_id", receiverId)
      .eq("receiver_id", user.id)
      .neq("status", "pending")
      .limit(1);

    if (reverseOld && reverseOld.length > 0) {
      await supabase.from("friend_requests").delete().eq("id", reverseOld[0].id);
    }

    // Check receiver's pending count (limit 50)
    const { count } = await supabase
      .from("friend_requests")
      .select("id", { count: "exact", head: true })
      .eq("receiver_id", receiverId)
      .eq("status", "pending");

    if (count !== null && count >= 50) {
      toast.error("Este jogador atingiu o limite de solicitações pendentes.");
      return;
    }

    const { error } = await supabase
      .from("friend_requests")
      .insert({ sender_id: user.id, receiver_id: receiverId });

    if (error) {
      toast.error("Erro ao enviar solicitação.");
      return;
    }

    toast.success("Solicitação de amizade enviada!");
    fetchRequests();
  }, [user, fetchRequests]);

  const acceptRequest = useCallback(async (requestId: string, senderId: string) => {
    if (!user) return;

    await supabase
      .from("friend_requests")
      .update({ status: "accepted" })
      .eq("id", requestId);

    // Create friendship
    const [id1, id2] = [user.id, senderId].sort();
    await supabase.from("friendships").insert({ user1_id: id1, user2_id: id2 });

    // Create or unhide conversation
    const { data: existing } = await supabase
      .from("conversations")
      .select("*")
      .eq("user1_id", id1)
      .eq("user2_id", id2)
      .limit(1)
      .single();

    if (existing) {
      const hiddenBy: string[] = existing.hidden_by ?? [];
      if (hiddenBy.includes(user.id)) {
        await supabase
          .from("conversations")
          .update({ hidden_by: hiddenBy.filter((id) => id !== user.id) })
          .eq("id", existing.id);
      }
    } else {
      await supabase.from("conversations").insert({ user1_id: id1, user2_id: id2 });
    }

    setReceivedRequests((prev) => prev.filter((r) => r.id !== requestId));
    toast.success("Solicitação aceita! Amigo adicionado.");
  }, [user]);

  const declineRequest = useCallback(async (requestId: string) => {
    await supabase
      .from("friend_requests")
      .update({ status: "declined" })
      .eq("id", requestId);

    setReceivedRequests((prev) => prev.filter((r) => r.id !== requestId));
    toast.success("Solicitação recusada.");
  }, []);

  const hasPendingRequestTo = useCallback((userId: string) => {
    return sentRequests.some((r) => r.receiver_id === userId);
  }, [sentRequests]);

  const hasPendingRequestFrom = useCallback((userId: string) => {
    return receivedRequests.some((r) => r.sender_id === userId);
  }, [receivedRequests]);

  return {
    receivedRequests,
    sentRequests,
    sendRequest,
    acceptRequest,
    declineRequest,
    hasPendingRequestTo,
    hasPendingRequestFrom,
    pendingCount: receivedRequests.length,
    refreshRequests: fetchRequests,
  };
};

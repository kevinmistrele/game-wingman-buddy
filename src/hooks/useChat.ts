import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { playNewMessageSound } from "@/lib/soundUtils";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Message = Tables<"messages">;
type Conversation = Tables<"conversations">;
type Profile = Tables<"profiles">;
type Friendship = Tables<"friendships">;

export interface ConversationWithProfile extends Conversation {
  otherProfile: Profile | null;
  lastMessage?: Message | null;
}

export interface FriendWithProfile extends Friendship {
  profile: Profile | null;
}

export const useChat = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithProfile[]>([]);
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!user) return;

    const { data: convos } = await supabase
      .from("conversations")
      .select("*")
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (!convos) { setLoading(false); return; }

    const visible = convos.filter((c) => {
      const hiddenBy: string[] = c.hidden_by ?? [];
      return !hiddenBy.includes(user.id);
    });

    const enriched: ConversationWithProfile[] = [];
    for (const c of visible) {
      const otherUserId = c.user1_id === user.id ? c.user2_id : c.user1_id;
      const { data: profile } = await supabase
        .from("profiles").select("*").eq("user_id", otherUserId).single();
      const { data: lastMsg } = await supabase
        .from("messages").select("*").eq("conversation_id", c.id)
        .order("created_at", { ascending: false }).limit(1).single();
      enriched.push({ ...c, otherProfile: profile, lastMessage: lastMsg });
    }

    setConversations(enriched);
    setLoading(false);
  }, [user]);

  const fetchFriends = useCallback(async () => {
    if (!user) return;

    const { data: friendships } = await supabase
      .from("friendships")
      .select("*")
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (!friendships) return;

    const enriched: FriendWithProfile[] = [];
    for (const f of friendships) {
      const otherUserId = f.user1_id === user.id ? f.user2_id : f.user1_id;
      const { data: profile } = await supabase
        .from("profiles").select("*").eq("user_id", otherUserId).single();
      enriched.push({ ...f, profile });
    }

    setFriends(enriched);
  }, [user]);

  useEffect(() => {
    fetchConversations();
    fetchFriends();
  }, [fetchConversations, fetchFriends]);

  useEffect(() => {
    if (!activeConversation) { setMessages([]); return; }
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages").select("*").eq("conversation_id", activeConversation)
        .order("created_at", { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();
  }, [activeConversation]);

  useEffect(() => {
    if (!activeConversation) return;
    const channel = supabase
      .channel(`messages-${activeConversation}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
        filter: `conversation_id=eq.${activeConversation}`,
      }, (payload) => {
        const newMsg = payload.new as Message;
        setMessages((prev) => {
          if (prev.find((m) => m.id === newMsg.id)) return prev;
          if (newMsg.sender_id !== user?.id) {
            playNewMessageSound();
          }
          return [...prev, newMsg];
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeConversation, user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("conversations-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "conversations" }, () => {
        fetchConversations();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchConversations]);

  const sendMessage = useCallback(async (content: string) => {
    if (!user || !activeConversation || !content.trim()) return;
    await supabase.from("messages").insert({
      conversation_id: activeConversation,
      sender_id: user.id,
      content: content.trim(),
    });
  }, [user, activeConversation]);

  const deleteConversation = useCallback(async (conversationId: string) => {
    if (!user) return;

    const { data: convo } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .single();

    if (!convo) return;

    const currentHidden: string[] = convo.hidden_by ?? [];
    const newHidden = [...currentHidden, user.id];

    await supabase
      .from("conversations")
      .update({ hidden_by: newHidden })
      .eq("id", conversationId);

    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
    if (activeConversation === conversationId) {
      setActiveConversation(null);
      setMessages([]);
    }
  }, [user, activeConversation]);

  const removeFriend = useCallback(async (friendshipId: string) => {
    if (!user) return;

    const friend = friends.find((f) => f.id === friendshipId);
    const friendUserId = friend
      ? (friend.user1_id === user.id ? friend.user2_id : friend.user1_id)
      : null;

    await supabase.from("friendships").delete().eq("id", friendshipId);
    setFriends((prev) => prev.filter((f) => f.id !== friendshipId));

    if (friendUserId) {
      // Find all conversations between these two users
      const [id1, id2] = [user.id, friendUserId].sort();
      const { data: allConvos } = await supabase
        .from("conversations")
        .select("id")
        .eq("user1_id", id1)
        .eq("user2_id", id2);

      if (allConvos && allConvos.length > 0) {
        const convoIds = allConvos.map((c) => c.id);
        // Delete all messages first, then conversations
        for (const cid of convoIds) {
          await supabase.from("messages").delete().eq("conversation_id", cid);
        }
        for (const cid of convoIds) {
          await supabase.from("conversations").delete().eq("id", cid);
        }
      }

      setConversations((prev) =>
        prev.filter((c) => {
          const otherUserId = c.user1_id === user.id ? c.user2_id : c.user1_id;
          return otherUserId !== friendUserId;
        })
      );

      if (activeConversation) {
        const activeConvo = conversations.find((c) => c.id === activeConversation);
        if (activeConvo) {
          const otherUserId = activeConvo.user1_id === user.id ? activeConvo.user2_id : activeConvo.user1_id;
          if (otherUserId === friendUserId) {
            setActiveConversation(null);
            setMessages([]);
          }
        }
      }
    }
  }, [user, friends, conversations, activeConversation]);

  const blockUser = useCallback(async (blockedUserId: string) => {
    if (!user) return;

    // Insert block
    await supabase.from("blocked_users").insert({ blocker_id: user.id, blocked_id: blockedUserId });

    // Remove friendship if exists
    const [id1, id2] = [user.id, blockedUserId].sort();
    await supabase.from("friendships").delete().eq("user1_id", id1).eq("user2_id", id2);

    // Delete pending friend requests in both directions
    await supabase.from("friend_requests").delete()
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${blockedUserId}),and(sender_id.eq.${blockedUserId},receiver_id.eq.${user.id})`);

    // Delete all conversations and messages between the two users
    const { data: allConvos } = await supabase
      .from("conversations")
      .select("id")
      .eq("user1_id", id1)
      .eq("user2_id", id2);

    if (allConvos && allConvos.length > 0) {
      const convoIds = allConvos.map((c) => c.id);
      for (const cid of convoIds) {
        await supabase.from("messages").delete().eq("conversation_id", cid);
      }
      for (const cid of convoIds) {
        await supabase.from("conversations").delete().eq("id", cid);
      }
    }

    // Update local state
    setFriends((prev) => prev.filter((f) => {
      const otherUserId = f.user1_id === user.id ? f.user2_id : f.user1_id;
      return otherUserId !== blockedUserId;
    }));
    setConversations((prev) => prev.filter((c) => {
      const otherUserId = c.user1_id === user.id ? c.user2_id : c.user1_id;
      return otherUserId !== blockedUserId;
    }));

    if (activeConversation) {
      const activeConvo = conversations.find((c) => c.id === activeConversation);
      if (activeConvo) {
        const otherUserId = activeConvo.user1_id === user.id ? activeConvo.user2_id : activeConvo.user1_id;
        if (otherUserId === blockedUserId) {
          setActiveConversation(null);
          setMessages([]);
        }
      }
    }

    toast.success("Jogador bloqueado.");
  }, [user, conversations, activeConversation]);

  const openConversationWithFriend = useCallback(async (friendUserId: string) => {
    if (!user) return;

    const [id1, id2] = [user.id, friendUserId].sort();

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
        const newHidden = hiddenBy.filter((id) => id !== user.id);
        await supabase
          .from("conversations")
          .update({ hidden_by: newHidden })
          .eq("id", existing.id);
      }
      await fetchConversations();
      setActiveConversation(existing.id);
    } else {
      const { data: newConvo } = await supabase
        .from("conversations")
        .insert({ user1_id: id1, user2_id: id2 })
        .select()
        .single();
      if (newConvo) {
        await fetchConversations();
        setActiveConversation(newConvo.id);
      }
    }
  }, [user, fetchConversations]);

  return {
    conversations,
    friends,
    activeConversation,
    setActiveConversation,
    messages,
    sendMessage,
    loading,
    refreshConversations: fetchConversations,
    refreshFriends: fetchFriends,
    deleteConversation,
    removeFriend,
    blockUser,
    openConversationWithFriend,
  };
};

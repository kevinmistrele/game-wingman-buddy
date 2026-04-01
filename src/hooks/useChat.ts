import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { playNewMessageSound } from "@/lib/soundUtils";
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

    // Filter out conversations hidden by this user
    const visible = convos.filter((c: any) => {
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

  // Soft-delete: only hide conversation for the current user
  const deleteConversation = useCallback(async (conversationId: string) => {
    if (!user) return;

    // Get current hidden_by array
    const { data: convo } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .single();

    if (!convo) return;

    const currentHidden: string[] = (convo as any).hidden_by ?? [];
    const newHidden = [...currentHidden, user.id];

    await supabase
      .from("conversations")
      .update({ hidden_by: newHidden } as any)
      .eq("id", conversationId);

    // Update local state
    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
    if (activeConversation === conversationId) {
      setActiveConversation(null);
      setMessages([]);
    }
  }, [user, activeConversation]);

  const removeFriend = useCallback(async (friendshipId: string) => {
    if (!user) return;
    await supabase.from("friendships").delete().eq("id", friendshipId);
    setFriends((prev) => prev.filter((f) => f.id !== friendshipId));
  }, [user]);

  // Start or open conversation with a friend
  const openConversationWithFriend = useCallback(async (friendUserId: string) => {
    if (!user) return;

    // Check if conversation already exists (including hidden ones)
    const [id1, id2] = [user.id, friendUserId].sort();

    const { data: existing } = await supabase
      .from("conversations")
      .select("*")
      .eq("user1_id", id1)
      .eq("user2_id", id2)
      .limit(1)
      .single();

    if (existing) {
      // Unhide if hidden
      const hiddenBy: string[] = (existing as any).hidden_by ?? [];
      if (hiddenBy.includes(user.id)) {
        const newHidden = hiddenBy.filter((id) => id !== user.id);
        await supabase
          .from("conversations")
          .update({ hidden_by: newHidden } as any)
          .eq("id", existing.id);
      }
      await fetchConversations();
      setActiveConversation(existing.id);
    } else {
      // Create new conversation
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
    openConversationWithFriend,
  };
};

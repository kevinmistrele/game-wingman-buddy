import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";

type Message = Tables<"messages">;
type Conversation = Tables<"conversations">;

interface ConversationWithProfile extends Conversation {
  otherProfile: Tables<"profiles"> | null;
  lastMessage?: Message | null;
}

export const useChat = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithProfile[]>([]);
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

    const enriched: ConversationWithProfile[] = [];
    for (const c of convos) {
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

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

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
        setMessages((prev) => prev.find((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeConversation]);

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
    // Delete all messages in the conversation first
    await supabase.from("messages").delete().eq("conversation_id", conversationId);
    // Delete the conversation
    await supabase.from("conversations").delete().eq("id", conversationId);
    // Update local state
    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
    if (activeConversation === conversationId) {
      setActiveConversation(null);
      setMessages([]);
    }
  }, [user, activeConversation]);

  return {
    conversations,
    activeConversation,
    setActiveConversation,
    messages,
    sendMessage,
    loading,
    refreshConversations: fetchConversations,
    deleteConversation,
  };
};

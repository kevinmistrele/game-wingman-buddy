import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { playNewMessageSound } from "@/lib/soundUtils";
import type { ConversationWithProfile, Message } from "@/types/chat";
import type { ConversationRow } from "@/types/supabase-rpc";

// Adapta o retorno flat do RPC para a estrutura ConversationWithProfile
function rowToConversationWithProfile(row: ConversationRow): ConversationWithProfile {
  return {
    id: row.id,
    user1_id: row.user1_id,
    user2_id: row.user2_id,
    match_id: row.match_id,
    hidden_by: row.hidden_by,
    created_at: row.created_at,
    otherProfile: {
      user_id: row.other_user_id,
      username: row.other_username,
      avatar_url: row.other_avatar_url,
      riot_id: row.other_riot_id,
      last_seen: row.other_last_seen,
      discord_username: row.other_discord_username,
      // campos obrigatórios do tipo Profile com fallback
      id: row.other_user_id,
      created_at: row.created_at,
      updated_at: row.created_at,
      discord_id: null,
      preferred_game: "lol",
      preferred_role: null,
      preferred_duo_role: null,
      rank: null,
      rank_tier: null,
      rank_division: null,
      rank_source: null,
      active_session_id: null,
      session_started_at: null,
    },
    lastMessage: row.last_message_content
      ? { content: row.last_message_content, created_at: row.last_message_at ?? row.created_at } as Message
      : null,
  };
}

export function useConversations() {
  const { user } = useAuth();

  const [conversations, setConversations] = useState<ConversationWithProfile[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  // ─── 1 query via RPC — resolve N+1 ─────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase.rpc("get_my_conversations");

    if (error || !data) { setLoading(false); return; }

    setConversations((data as ConversationRow[]).map(rowToConversationWithProfile));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  // Realtime: nova conversa criada
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

  // Mensagens da conversa ativa
  useEffect(() => {
    if (!activeConversation) { setMessages([]); return; }
    supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", activeConversation)
      .order("created_at", { ascending: true })
      .then(({ data }) => { if (data) setMessages(data); });
  }, [activeConversation]);

  // Realtime: novas mensagens
  useEffect(() => {
    if (!activeConversation) return;
    const channel = supabase
      .channel(`messages-${activeConversation}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
        filter: `conversation_id=eq.${activeConversation}`,
      }, (payload) => {
        const newMsg = payload.new as Message;
        setMessages(prev => {
          if (prev.find(m => m.id === newMsg.id)) return prev;
          if (newMsg.sender_id !== user?.id) playNewMessageSound();
          return [...prev, newMsg];
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeConversation, user]);

  // ─── Actions ─────────────────────────────────────────────────────────────────

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
    const { data: convo } = await supabase.from("conversations").select("hidden_by").eq("id", conversationId).single();
    if (!convo) return;

    const hidden = [...(convo.hidden_by ?? []), user.id];
    await supabase.from("conversations").update({ hidden_by: hidden }).eq("id", conversationId);

    setConversations(prev => prev.filter(c => c.id !== conversationId));
    if (activeConversation === conversationId) { setActiveConversation(null); setMessages([]); }
  }, [user, activeConversation]);

  const openConversationWithUser = useCallback(async (friendUserId: string) => {
    if (!user) return;
    const [id1, id2] = [user.id, friendUserId].sort();

    const { data: existing } = await supabase
      .from("conversations").select("id, hidden_by").eq("user1_id", id1).eq("user2_id", id2).limit(1).single();

    if (existing) {
      const hidden = (existing.hidden_by ?? []).filter((id: string) => id !== user.id);
      if (hidden.length !== (existing.hidden_by ?? []).length) {
        await supabase.from("conversations").update({ hidden_by: hidden }).eq("id", existing.id);
      }
      await fetchConversations();
      setActiveConversation(existing.id);
    } else {
      const { data: created } = await supabase
        .from("conversations").insert({ user1_id: id1, user2_id: id2 }).select("id").single();
      if (created) { await fetchConversations(); setActiveConversation(created.id); }
    }
  }, [user, fetchConversations]);

  const removeConversationsWithUser = useCallback((otherUserId: string) => {
    setConversations(prev => prev.filter(c => {
      const other = c.user1_id === user?.id ? c.user2_id : c.user1_id;
      return other !== otherUserId;
    }));
    if (activeConversation) {
      const active = conversations.find(c => c.id === activeConversation);
      if (active) {
        const other = active.user1_id === user?.id ? active.user2_id : active.user1_id;
        if (other === otherUserId) { setActiveConversation(null); setMessages([]); }
      }
    }
  }, [user, conversations, activeConversation]);

  return {
    conversations, activeConversation, setActiveConversation,
    messages, loading,
    sendMessage, deleteConversation, openConversationWithUser,
    removeConversationsWithUser,
    refreshConversations: fetchConversations,
  };
}

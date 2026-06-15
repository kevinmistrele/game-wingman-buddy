import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useConversations } from "@/hooks/useConversations";
import { useFriendsList } from "@/hooks/useFriendsList";
import { toast } from "sonner";

export type { ConversationWithProfile, FriendWithProfile } from "@/types/chat";

export function useChat() {
  const { user } = useAuth();

  const {
    conversations, activeConversation, setActiveConversation,
    messages, loading, sendMessage, deleteConversation,
    openConversationWithUser, removeConversationsWithUser,
    refreshConversations,
  } = useConversations();

  const { friends, fetchFriends, removeFriendFromState, removeFriendsByUserId } =
    useFriendsList(refreshConversations);

  // ─── Cross-state coordinated actions ─────────────────────────────────────────

  const removeFriend = useCallback(async (friendshipId: string) => {
    if (!user) return;

    const friend = friends.find(f => f.id === friendshipId);
    const friendUserId = friend
      ? (friend.user1_id === user.id ? friend.user2_id : friend.user1_id)
      : null;

    await supabase.from("friendships").delete().eq("id", friendshipId);
    removeFriendFromState(friendshipId);

    if (friendUserId) {
      const [id1, id2] = [user.id, friendUserId].sort();
      const { data: convos } = await supabase
        .from("conversations").select("id").eq("user1_id", id1).eq("user2_id", id2);

      if (convos?.length) {
        for (const c of convos) await supabase.from("messages").delete().eq("conversation_id", c.id);
        for (const c of convos) await supabase.from("conversations").delete().eq("id", c.id);
      }

      removeConversationsWithUser(friendUserId);
    }
  }, [user, friends, removeFriendFromState, removeConversationsWithUser]);

  const blockUser = useCallback(async (blockedUserId: string) => {
    if (!user) return;

    const [id1, id2] = [user.id, blockedUserId].sort();

    await Promise.all([
      supabase.from("blocked_users").insert({ blocker_id: user.id, blocked_id: blockedUserId }),
      supabase.from("friendships").delete().eq("user1_id", id1).eq("user2_id", id2),
      supabase.from("friend_requests").delete()
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${blockedUserId}),and(sender_id.eq.${blockedUserId},receiver_id.eq.${user.id})`),
    ]);

    const { data: convos } = await supabase
      .from("conversations").select("id").eq("user1_id", id1).eq("user2_id", id2);

    if (convos?.length) {
      for (const c of convos) await supabase.from("messages").delete().eq("conversation_id", c.id);
      for (const c of convos) await supabase.from("conversations").delete().eq("id", c.id);
    }

    removeFriendsByUserId(blockedUserId);
    removeConversationsWithUser(blockedUserId);

    toast.success("Jogador bloqueado.");
  }, [user, removeFriendsByUserId, removeConversationsWithUser]);

  return {
    conversations,
    friends,
    activeConversation,
    setActiveConversation,
    messages,
    loading,
    sendMessage,
    deleteConversation,
    removeFriend,
    blockUser,
    openConversationWithFriend: openConversationWithUser,
    refreshConversations,
    refreshFriends: fetchFriends,
  };
}

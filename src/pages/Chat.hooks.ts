import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useChat } from "@/hooks/useChat";
import { useFriendRequests } from "@/hooks/useFriendRequests";

export function useChatScreen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showSidebar, setShowSidebar] = useState(true);
  const chat = useChat();
  const friendRequests = useFriendRequests();

  useEffect(() => {
    const conversationId = searchParams.get("convo");
    if (conversationId && chat.conversations.some((conversation) => conversation.id === conversationId)) {
      chat.setActiveConversation(conversationId);
      setSearchParams({}, { replace: true });
    }
  }, [chat, searchParams, setSearchParams]);

  function selectConversation(id: string) {
    chat.setActiveConversation(id);
    if (window.innerWidth < 768) setShowSidebar(false);
  }

  function openConversationWithFriend(friendUserId: string) {
    chat.openConversationWithFriend(friendUserId);
    if (window.innerWidth < 768) setShowSidebar(false);
  }

  function backToSidebar() {
    setShowSidebar(true);
    chat.setActiveConversation(null);
  }

  async function acceptRequest(requestId: string, senderId: string) {
    await friendRequests.acceptRequest(requestId, senderId);
    friendRequests.refreshRequests();
    await chat.refreshFriends();
    await chat.refreshConversations();
  }

  const activeConversation = chat.conversations.find((conversation) => conversation.id === chat.activeConversation);
  const otherUserId = activeConversation?.otherProfile?.user_id ?? undefined;
  const isFriend = otherUserId
    ? chat.friends.some((friend) => friend.user1_id === otherUserId || friend.user2_id === otherUserId)
    : false;

  return {
    ...chat,
    showSidebar,
    setShowSidebar,
    selectConversation,
    openConversationWithFriend,
    backToSidebar,
    friendRequests,
    acceptRequest,
    otherUsername: activeConversation?.otherProfile?.username ?? undefined,
    otherDiscord: activeConversation?.otherProfile?.discord_username ?? undefined,
    otherLastSeen: activeConversation?.otherProfile?.last_seen ?? null,
    otherUserId,
    isFriend,
    hasPendingRequest: otherUserId ? friendRequests.hasPendingRequestTo(otherUserId) : false,
  };
}

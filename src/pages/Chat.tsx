import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import FriendsSidebar from "@/components/FriendsSidebar";
import ChatPanel from "@/components/ChatPanel";
import { useChat } from "@/hooks/useChat";
import { useFriendRequests } from "@/hooks/useFriendRequests";

const Chat = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    conversations, friends, activeConversation, setActiveConversation,
    messages, sendMessage, loading, deleteConversation, removeFriend,
    blockUser, openConversationWithFriend,
    refreshFriends, refreshConversations,
  } = useChat();

  const {
    receivedRequests, sendRequest, acceptRequest, declineRequest,
    hasPendingRequestTo, pendingCount, refreshRequests,
  } = useFriendRequests();

  useEffect(() => {
    const convoId = searchParams.get("convo");
    if (convoId && conversations.some((c) => c.id === convoId)) {
      setActiveConversation(convoId);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, conversations, setActiveConversation, setSearchParams]);

  const activeConvo = conversations.find((c) => c.id === activeConversation);
  const otherUsername = activeConvo?.otherProfile?.username ?? undefined;
  const otherDiscord = activeConvo?.otherProfile?.discord_username ?? undefined;
  const otherUserId = activeConvo
    ? (activeConvo.user1_id === activeConvo.otherProfile?.user_id ? activeConvo.otherProfile?.user_id : (activeConvo.otherProfile?.user_id ?? undefined))
    : undefined;

  const isFriend = otherUserId
    ? friends.some((f) => f.user1_id === otherUserId || f.user2_id === otherUserId)
    : false;

  const hasPendingRequest = otherUserId ? hasPendingRequestTo(otherUserId) : false;

  const handleAcceptRequest = async (requestId: string, senderId: string) => {
    await acceptRequest(requestId, senderId);
    refreshRequests();
    await refreshFriends();
    await refreshConversations();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex pt-16" style={{ height: "100vh" }}>
        <FriendsSidebar
          conversations={conversations}
          friends={friends}
          activeConversation={activeConversation}
          onSelectConversation={setActiveConversation}
          onDeleteConversation={deleteConversation}
          onRemoveFriend={removeFriend}
          onOpenConversation={openConversationWithFriend}
          onBlockUser={blockUser}
          loading={loading}
          friendRequests={receivedRequests}
          pendingRequestCount={pendingCount}
          onAcceptRequest={handleAcceptRequest}
          onDeclineRequest={declineRequest}
        />
        <div className="flex-1">
          <ChatPanel
            messages={messages}
            sendMessage={sendMessage}
            activeConversation={activeConversation}
            otherUsername={otherUsername}
            otherDiscord={otherDiscord}
            otherUserId={otherUserId}
            isFriend={isFriend}
            hasPendingRequest={hasPendingRequest}
            onSendFriendRequest={sendRequest}
            onBlockUser={blockUser}
          />
        </div>
      </div>
    </div>
  );
};

export default Chat;

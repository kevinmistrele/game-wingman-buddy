import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Users, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import FriendsSidebar from "@/components/FriendsSidebar";
import ChatPanel from "@/components/ChatPanel";
import { useChat } from "@/hooks/useChat";
import { useFriendRequests } from "@/hooks/useFriendRequests";

const Chat = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showSidebar, setShowSidebar] = useState(true);
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

  // On mobile, when a conversation is selected, hide sidebar
  const handleSelectConversation = (id: string) => {
    setActiveConversation(id);
    // Hide sidebar on mobile
    if (window.innerWidth < 768) {
      setShowSidebar(false);
    }
  };

  const handleBackToSidebar = () => {
    setShowSidebar(true);
    setActiveConversation(null);
  };

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
        {/* Sidebar: always visible on md+, toggled on mobile */}
        <div className={`${showSidebar ? "flex" : "hidden"} md:flex w-full md:w-72 flex-shrink-0`}>
          <FriendsSidebar
            conversations={conversations}
            friends={friends}
            activeConversation={activeConversation}
            onSelectConversation={handleSelectConversation}
            onDeleteConversation={deleteConversation}
            onRemoveFriend={removeFriend}
            onOpenConversation={(friendUserId) => {
              openConversationWithFriend(friendUserId);
              if (window.innerWidth < 768) setShowSidebar(false);
            }}
            onBlockUser={blockUser}
            loading={loading}
            friendRequests={receivedRequests}
            pendingRequestCount={pendingCount}
            onAcceptRequest={handleAcceptRequest}
            onDeclineRequest={declineRequest}
          />
        </div>

        {/* Chat panel: hidden on mobile when sidebar is shown */}
        <div className={`${!showSidebar ? "flex" : "hidden"} md:flex flex-1 flex-col min-w-0`}>
          {/* Mobile back button */}
          {activeConversation && (
            <button
              onClick={handleBackToSidebar}
              className="md:hidden flex items-center gap-2 px-4 py-2 border-b border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>
          )}
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

        {/* Mobile: show sidebar toggle when chat is active */}
        {!showSidebar && !activeConversation && (
          <div className="md:hidden flex flex-1 items-center justify-center">
            <button
              onClick={() => setShowSidebar(true)}
              className="flex items-center gap-2 px-4 py-3 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
            >
              <Users className="h-5 w-5" />
              Ver conversas
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;

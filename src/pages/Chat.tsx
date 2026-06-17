import { Users, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import FriendsSidebar from "@/components/FriendsSidebar";
import ChatPanel from "@/components/ChatPanel";
import { useChatScreen } from "@/pages/Chat.hooks";

function Chat() {
  const {
    conversations, friends, activeConversation, setActiveConversation,
    messages, sendMessage, loading, deleteConversation, removeFriend,
    blockUser, showSidebar, setShowSidebar, selectConversation, openConversationWithFriend,
    friendRequests, acceptRequest, otherUsername, otherDiscord, otherLastSeen,
    otherUserId, isFriend, hasPendingRequest, backToSidebar,
  } = useChatScreen();

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
            onSelectConversation={selectConversation}
            onDeleteConversation={deleteConversation}
            onRemoveFriend={removeFriend}
            onOpenConversation={openConversationWithFriend}
            onBlockUser={blockUser}
            loading={loading}
            friendRequests={friendRequests.receivedRequests}
            pendingRequestCount={friendRequests.pendingCount}
            onAcceptRequest={acceptRequest}
            onDeclineRequest={friendRequests.declineRequest}
          />
        </div>

        {/* Chat panel: hidden on mobile when sidebar is shown */}
        <div className={`${!showSidebar ? "flex" : "hidden"} md:flex flex-1 flex-col min-w-0`}>
          {/* Mobile back button */}
          {activeConversation && (
            <button
              onClick={backToSidebar}
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
            otherLastSeen={otherLastSeen}
            otherUserId={otherUserId}
            isFriend={isFriend}
            hasPendingRequest={hasPendingRequest}
            onSendFriendRequest={friendRequests.sendRequest}
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
}

export default Chat;

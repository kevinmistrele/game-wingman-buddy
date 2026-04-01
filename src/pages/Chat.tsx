import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import FriendsSidebar from "@/components/FriendsSidebar";
import ChatPanel from "@/components/ChatPanel";
import { useChat } from "@/hooks/useChat";

const Chat = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    conversations,
    friends,
    activeConversation,
    setActiveConversation,
    messages,
    sendMessage,
    loading,
    deleteConversation,
    removeFriend,
    openConversationWithFriend,
  } = useChat();

  // Auto-select conversation from URL param (e.g. after match)
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
          loading={loading}
        />
        <div className="flex-1">
          <ChatPanel
            messages={messages}
            sendMessage={sendMessage}
            activeConversation={activeConversation}
            otherUsername={otherUsername}
            otherDiscord={otherDiscord}
          />
        </div>
      </div>
    </div>
  );
};

export default Chat;

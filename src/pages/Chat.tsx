import Navbar from "@/components/Navbar";
import FriendsSidebar from "@/components/FriendsSidebar";
import ChatPanel from "@/components/ChatPanel";
import { useChat } from "@/hooks/useChat";

const Chat = () => {
  const {
    conversations,
    activeConversation,
    setActiveConversation,
    messages,
    sendMessage,
    loading,
    deleteConversation,
  } = useChat();

  const activeConvo = conversations.find((c) => c.id === activeConversation);
  const otherUsername = activeConvo?.otherProfile?.username ?? undefined;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex pt-16" style={{ height: "100vh" }}>
        <FriendsSidebar
          conversations={conversations}
          activeConversation={activeConversation}
          onSelectConversation={setActiveConversation}
          onDeleteConversation={deleteConversation}
          loading={loading}
        />
        <div className="flex-1">
          <ChatPanel
            messages={messages}
            sendMessage={sendMessage}
            activeConversation={activeConversation}
            otherUsername={otherUsername}
          />
        </div>
      </div>
    </div>
  );
};

export default Chat;

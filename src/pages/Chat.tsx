import Navbar from "@/components/Navbar";
import FriendsSidebar from "@/components/FriendsSidebar";
import ChatPanel from "@/components/ChatPanel";
import { useChat } from "@/hooks/useChat";

const Chat = () => {
  const {
    conversations,
    activeConversation,
    setActiveConversation,
    loading,
  } = useChat();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex pt-16" style={{ height: "100vh" }}>
        <FriendsSidebar
          conversations={conversations}
          activeConversation={activeConversation}
          onSelectConversation={setActiveConversation}
          loading={loading}
        />
        <div className="flex-1">
          <ChatPanel />
        </div>
      </div>
    </div>
  );
};

export default Chat;

import Navbar from "@/components/Navbar";
import FriendsSidebar from "@/components/FriendsSidebar";
import ChatPanel from "@/components/ChatPanel";

const Chat = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex pt-16" style={{ height: "100vh" }}>
        <FriendsSidebar />
        <div className="flex-1">
          <ChatPanel />
        </div>
      </div>
    </div>
  );
};

export default Chat;

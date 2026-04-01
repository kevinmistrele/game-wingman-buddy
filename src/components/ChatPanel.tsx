import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/contexts/AuthContext";

const ChatPanel = () => {
  const { user } = useAuth();
  const { messages, sendMessage, activeConversation } = useChat();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  };

  if (!activeConversation) {
    return (
      <div className="flex h-full items-center justify-center border-l border-border">
        <div className="text-center">
          <p className="font-display text-lg tracking-wider text-muted-foreground">
            SELECT A CONVERSATION
          </p>
          <p className="mt-2 text-sm text-muted-foreground/60">
            Choose a friend from the sidebar to start chatting
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col border-l border-border">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">No messages yet. Say hello!</p>
          </div>
        )}
        {messages.map((msg) => {
          const isOwn = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] px-4 py-2.5 ${
                  isOwn
                    ? "clip-angle-sm bg-primary/15 border border-primary/20 text-foreground"
                    : "clip-angle-sm bg-muted text-foreground"
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-muted px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary/50 transition-colors"
          />
          <button
            onClick={handleSend}
            className="clip-angle-sm bg-primary p-2.5 text-primary-foreground hover:box-glow-primary transition-all"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;

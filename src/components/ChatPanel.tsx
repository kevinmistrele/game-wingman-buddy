import { useState } from "react";
import { Send } from "lucide-react";

interface Message {
  id: string;
  sender: string;
  text: string;
  time: string;
  isOwn: boolean;
}

const mockMessages: Message[] = [
  { id: "1", sender: "PlayerRogue", text: "Hey! Nice to match with you", time: "2:30 PM", isOwn: false },
  { id: "2", sender: "You", text: "Hey! Down for some ranked?", time: "2:31 PM", isOwn: true },
  { id: "3", sender: "PlayerRogue", text: "Let's go! What role do you main?", time: "2:31 PM", isOwn: false },
];

const ChatPanel = () => {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: "You",
        text: input,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isOwn: true,
      },
    ]);
    setInput("");
  };

  return (
    <div className="flex h-full flex-col border-l border-border">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border p-4">
        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-display text-sm font-bold text-primary">
          PR
        </div>
        <div>
          <p className="font-display text-sm font-semibold tracking-wide text-foreground">PlayerRogue</p>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
            <span className="text-xs text-muted-foreground">Online</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[75%] px-4 py-2.5 ${
                msg.isOwn
                  ? "clip-angle-sm bg-primary/15 border border-primary/20 text-foreground"
                  : "clip-angle-sm bg-muted text-foreground"
              }`}
            >
              <p className="text-sm">{msg.text}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">{msg.time}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 bg-muted px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary/50 transition-colors"
          />
          <button
            onClick={sendMessage}
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

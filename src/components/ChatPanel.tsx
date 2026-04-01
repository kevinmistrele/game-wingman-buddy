import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";

type Message = Tables<"messages">;

interface ChatPanelProps {
  messages: Message[];
  sendMessage: (content: string) => Promise<void>;
  activeConversation: string | null;
  otherUsername?: string;
}

const ChatPanel = ({ messages, sendMessage, activeConversation, otherUsername }: ChatPanelProps) => {
  const { user } = useAuth();
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
            SELECIONE UMA CONVERSA
          </p>
          <p className="mt-2 text-sm text-muted-foreground/60">
            Escolha um amigo na barra lateral para começar a conversar
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col border-l border-border">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border p-4">
        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-display text-sm font-bold text-primary">
          {otherUsername?.slice(0, 2).toUpperCase() ?? "??"}
        </div>
        <div>
          <p className="font-display text-sm font-semibold tracking-wide text-foreground">
            {otherUsername ?? "Player"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda. Diga olá!</p>
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
            placeholder="Digite uma mensagem..."
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

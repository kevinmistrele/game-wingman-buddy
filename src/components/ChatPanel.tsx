import { useState, useRef, useEffect } from "react";
import { Send, UserPlus, Clock, ShieldBan, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import ConfirmModal from "./ConfirmModal";
import OnlineIndicator from "./OnlineIndicator";
import { useOnlineStatus } from "@/contexts/OnlineStatusContext";

type Message = Tables<"messages">;

interface ChatPanelProps {
  messages: Message[];
  sendMessage: (content: string) => Promise<void>;
  activeConversation: string | null;
  otherUsername?: string;
  otherDiscord?: string;
  otherLastSeen?: string | null;
  otherUserId?: string;
  isFriend?: boolean;
  hasPendingRequest?: boolean;
  onSendFriendRequest?: (userId: string) => Promise<void> | void;
  onBlockUser?: (userId: string) => void;
}

const DiscordIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.317 4.369a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.369a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.332-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.332-.946 2.418-2.157 2.418z" />
  </svg>
);

const ChatPanel = ({
  messages, sendMessage, activeConversation, otherUsername, otherDiscord, otherLastSeen,
  otherUserId, isFriend, hasPendingRequest, onSendFriendRequest, onBlockUser,
}: ChatPanelProps) => {
  const { user } = useAuth();
  const { isOnline } = useOnlineStatus();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const [quickMessagesSent, setQuickMessagesSent] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    setQuickMessagesSent(false);
  }, [activeConversation]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  };

  const handleQuickMessage = (text: string) => {
    sendMessage(text);
    setQuickMessagesSent(true);
  };

  const handleCopyDiscord = () => {
    if (otherDiscord) {
      navigator.clipboard.writeText(otherDiscord);
      toast.success(`Discord copiado: ${otherDiscord}`);
    }
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

  const showQuickMessages = messages.length === 0 && !quickMessagesSent;

  return (
    <div className="flex h-full flex-col border-l border-border">
      <div className="flex items-center gap-2 sm:gap-3 border-b border-border p-3 sm:p-4">
        <div className="relative flex-shrink-0">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-muted flex items-center justify-center font-display text-sm sm:text-base font-bold text-primary">
            {otherUsername?.slice(0, 2).toUpperCase() ?? "??"}
          </div>
          <OnlineIndicator userId={otherUserId} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display text-sm font-semibold tracking-wide text-foreground truncate">
            {otherUsername ?? "Player"}
          </p>
          <p className="text-[10px] text-muted-foreground/60">
            {otherUserId && isOnline(otherUserId) ? "Online" : "Offline"}
          </p>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
          {otherDiscord && (
            <button
              onClick={handleCopyDiscord}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded border border-border text-muted-foreground hover:text-[#5865F2] hover:border-[#5865F2]/50 transition-colors text-xs"
              title={`Discord: ${otherDiscord}`}
            >
              <DiscordIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="font-display tracking-wide hidden sm:inline">{otherDiscord}</span>
            </button>
          )}
          {otherUserId && !isFriend && !hasPendingRequest && onSendFriendRequest && (
            <button
              onClick={async () => {
                setSendingRequest(true);
                try { await onSendFriendRequest(otherUserId); } finally { setSendingRequest(false); }
              }}
              disabled={sendingRequest}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded border border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 transition-colors text-xs disabled:opacity-50"
              title="Adicionar amigo"
            >
              {sendingRequest ? <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" /> : <UserPlus className="h-4 w-4 sm:h-5 sm:w-5" />}
              <span className="font-display tracking-wide hidden sm:inline">Adicionar</span>
            </button>
          )}
          {otherUserId && hasPendingRequest && (
            <span className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded border border-border text-muted-foreground text-xs">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="font-display tracking-wide hidden sm:inline">Enviada</span>
            </span>
          )}
          {otherUserId && onBlockUser && (
            <button
              onClick={() => setConfirmBlock(true)}
              className="p-1.5 rounded text-muted-foreground hover:text-destructive transition-colors"
              title="Bloquear jogador"
            >
              <ShieldBan className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && !showQuickMessages && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda. Diga olá!</p>
          </div>
        )}

        {showQuickMessages && (
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <p className="font-display text-sm tracking-wider text-muted-foreground">
              INICIE A CONVERSA
            </p>
            <div className="flex flex-col gap-2 w-full max-w-sm">
              <button
                onClick={() => handleQuickMessage("E aí! Bora jogar? 😄")}
                className="clip-angle-sm border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground hover:bg-primary/10 hover:border-primary/50 transition-all text-left"
              >
                E aí! Bora jogar? 😄
              </button>
              <button
                onClick={() => handleQuickMessage("Salve! Qual modo você prefere jogar?")}
                className="clip-angle-sm border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground hover:bg-primary/10 hover:border-primary/50 transition-all text-left"
              >
                Salve! Qual modo você prefere jogar?
              </button>
              {otherDiscord && (
                <button
                  onClick={() => handleQuickMessage("Me adiciona no Discord clicando no ícone acima e bora jogar! 🎮")}
                  className="clip-angle-sm border border-secondary/30 bg-secondary/5 px-4 py-3 text-sm text-foreground hover:bg-secondary/10 hover:border-secondary/50 transition-all text-left"
                >
                  Me adiciona no Discord clicando no ícone acima e bora jogar! 🎮
                </button>
              )}
            </div>
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
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

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

      <ConfirmModal
        open={confirmBlock}
        onClose={() => setConfirmBlock(false)}
        onConfirm={() => {
          if (otherUserId && onBlockUser) onBlockUser(otherUserId);
          setConfirmBlock(false);
        }}
        title="Bloquear Jogador"
        description="Deseja bloquear este jogador? Ele será removido dos seus amigos e não poderá mais te encontrar no matchmaking."
      />
    </div>
  );
};

export default ChatPanel;

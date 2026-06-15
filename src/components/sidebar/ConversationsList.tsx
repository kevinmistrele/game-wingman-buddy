import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Loader2 } from "lucide-react";
import OnlineIndicator from "@/components/OnlineIndicator";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ConversationWithProfile } from "@/types/chat";

const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number) => ({ opacity: 1, x: 0, transition: { delay: i * 0.04, duration: 0.25, ease: "easeOut" } }),
  exit: { opacity: 0, x: -20, height: 0, padding: 0, transition: { duration: 0.2 } },
};

function relativeTime(dateStr?: string): string | null {
  if (!dateStr) return null;
  try { return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ptBR }); }
  catch { return null; }
}

interface ConversationsListProps {
  conversations: ConversationWithProfile[];
  activeConversation: string | null;
  deletingConvoId: string | null;
  onSelect: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function ConversationsList({ conversations, activeConversation, deletingConvoId, onSelect, onDelete }: ConversationsListProps) {
  if (conversations.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-muted-foreground">Nenhuma conversa ainda</p>
        <p className="mt-1 text-xs text-muted-foreground/60">Faça match com jogadores para começar a conversar!</p>
      </div>
    );
  }

  return (
    <AnimatePresence>
      {conversations.map((conv, i) => {
        const profile = conv.otherProfile;
        const initials = profile?.username?.slice(0, 2).toUpperCase() ?? "??";
        const isActive = activeConversation === conv.id;
        const timeAgo = relativeTime(conv.lastMessage?.created_at);

        return (
          <motion.button
            key={conv.id} custom={i} variants={itemVariants} initial="hidden" animate="visible" exit="exit" layout
            onClick={() => onSelect(conv.id)}
            className={`group flex w-full items-center gap-3 border-b border-border/50 p-4 text-left transition-colors ${
              isActive ? "bg-primary/10 border-l-2 border-l-primary" : "hover:bg-muted/50"
            }`}
            whileHover={{ x: 2 }} transition={{ duration: 0.15 }}
          >
            <div className="relative shrink-0">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center font-display text-base font-bold text-primary">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                ) : initials}
              </div>
              <OnlineIndicator userId={profile?.user_id} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <p className="font-display text-sm font-semibold tracking-wide text-foreground truncate">
                  {profile?.username ?? "Jogador"}
                </p>
                {timeAgo && <span className="text-[10px] text-muted-foreground/50 shrink-0">{timeAgo}</span>}
              </div>
              {profile?.riot_id && <p className="truncate text-[10px] text-muted-foreground/60">{profile.riot_id}</p>}
              <p className="truncate text-xs text-muted-foreground">{conv.lastMessage?.content ?? "Inicie uma conversa"}</p>
            </div>
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                className="p-1 text-muted-foreground/0 group-hover:text-muted-foreground hover:!text-destructive transition-colors"
                title="Ocultar conversa"
              >
                {deletingConvoId === conv.id
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Trash2 className="h-4 w-4" />}
              </button>
            )}
          </motion.button>
        );
      })}
    </AnimatePresence>
  );
}

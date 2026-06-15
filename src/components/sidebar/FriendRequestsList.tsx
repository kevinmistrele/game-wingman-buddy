import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number) => ({ opacity: 1, x: 0, transition: { delay: i * 0.04, duration: 0.25, ease: "easeOut" } }),
  exit: { opacity: 0, x: -20, height: 0, padding: 0, transition: { duration: 0.2 } },
};

export interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  senderProfile?: {
    username: string;
    avatar_url: string | null;
    riot_id: string | null;
  };
}

interface FriendRequestsListProps {
  requests: FriendRequest[];
  onAccept?: (requestId: string, senderId: string) => void;
  onDecline?: (requestId: string) => void;
}

function relativeTime(dateStr: string): string | null {
  try { return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ptBR }); }
  catch { return null; }
}

export function FriendRequestsList({ requests, onAccept, onDecline }: FriendRequestsListProps) {
  if (requests.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-muted-foreground">Nenhuma solicitação pendente</p>
        <p className="mt-1 text-xs text-muted-foreground/60">Solicitações de amizade aparecerão aqui.</p>
      </div>
    );
  }

  return (
    <AnimatePresence>
      {requests.map((req, i) => {
        const profile = req.senderProfile;
        const initials = profile?.username?.slice(0, 2).toUpperCase() ?? "??";
        const timeAgo = relativeTime(req.created_at);

        return (
          <motion.div
            key={req.id} custom={i} variants={itemVariants} initial="hidden" animate="visible" exit="exit" layout
            className="flex w-full items-center gap-3 border-b border-border/50 p-4"
          >
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center font-display text-base font-bold text-primary shrink-0">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
              ) : initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display text-sm font-semibold tracking-wide text-foreground">{profile?.username ?? "Jogador"}</p>
              {profile?.riot_id && <p className="truncate text-xs text-muted-foreground">{profile.riot_id}</p>}
              {timeAgo && <p className="text-[10px] text-muted-foreground/50">{timeAgo}</p>}
            </div>
            <div className="flex items-center gap-1">
              {onAccept && (
                <button
                  onClick={() => onAccept(req.id, req.sender_id)}
                  className="p-1.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  title="Aceitar"
                >
                  <Check className="h-5 w-5" />
                </button>
              )}
              {onDecline && (
                <button
                  onClick={() => onDecline(req.id)}
                  className="p-1.5 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                  title="Recusar"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
}

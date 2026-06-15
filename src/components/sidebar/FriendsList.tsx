import { motion, AnimatePresence } from "framer-motion";
import { Eye, MessageCircle, ShieldBan, UserMinus, Loader2 } from "lucide-react";
import OnlineIndicator from "@/components/OnlineIndicator";
import type { FriendWithProfile } from "@/types/chat";
import type { Tables } from "@/integrations/supabase/types";

const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number) => ({ opacity: 1, x: 0, transition: { delay: i * 0.04, duration: 0.25, ease: "easeOut" } }),
  exit: { opacity: 0, x: -20, height: 0, padding: 0, transition: { duration: 0.2 } },
};

interface FriendsListProps {
  friends: FriendWithProfile[];
  userId: string | undefined;
  removingFriendId: string | null;
  onViewProfile: (profile: Tables<"profiles">) => void;
  onOpenConversation?: (friendUserId: string) => void;
  onRemoveFriend?: (friendshipId: string) => void;
  onBlockUser?: (userId: string) => void;
}

export function FriendsList({
  friends, userId, removingFriendId,
  onViewProfile, onOpenConversation, onRemoveFriend, onBlockUser,
}: FriendsListProps) {
  if (friends.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-muted-foreground">Nenhum amigo ainda</p>
        <p className="mt-1 text-xs text-muted-foreground/60">Envie solicitações de amizade pelo chat!</p>
      </div>
    );
  }

  return (
    <AnimatePresence>
      {friends.map((friend, i) => {
        const profile = friend.profile;
        const initials = profile?.username?.slice(0, 2).toUpperCase() ?? "??";
        const friendUserId = friend.user1_id === userId ? friend.user2_id : friend.user1_id;

        return (
          <motion.div
            key={friend.id} custom={i} variants={itemVariants} initial="hidden" animate="visible" exit="exit" layout
            className="group flex w-full items-center gap-3 border-b border-border/50 p-4 transition-colors hover:bg-muted/50"
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
              <p className="font-display text-sm font-semibold tracking-wide text-foreground truncate">{profile?.username ?? "Jogador"}</p>
              {profile?.riot_id && <p className="truncate text-xs text-muted-foreground">{profile.riot_id}</p>}
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <button onClick={() => profile && onViewProfile(profile)} className="p-1.5 text-muted-foreground hover:text-primary transition-colors" title="Ver perfil">
                <Eye className="h-5 w-5" />
              </button>
              {onOpenConversation && profile && (
                <button onClick={() => onOpenConversation(profile.user_id)} className="p-1.5 text-muted-foreground hover:text-primary transition-colors" title="Enviar mensagem">
                  <MessageCircle className="h-5 w-5" />
                </button>
              )}
              {onBlockUser && (
                <button onClick={() => onBlockUser(friendUserId)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors" title="Bloquear">
                  <ShieldBan className="h-5 w-5" />
                </button>
              )}
              {onRemoveFriend && (
                <button onClick={() => onRemoveFriend(friend.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors" title="Remover amigo">
                  {removingFriendId === friend.id
                    ? <Loader2 className="h-5 w-5 animate-spin" />
                    : <UserMinus className="h-5 w-5" />}
                </button>
              )}
            </div>
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
}

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Trash2, Users, UserMinus, MessageCircle, Eye, Loader2, ShieldBan, Bell, Check, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import type { Tables } from "@/integrations/supabase/types";
import type { ConversationWithProfile, FriendWithProfile } from "@/hooks/useChat";
import FriendProfileModal from "./FriendProfileModal";
import ConfirmModal from "./ConfirmModal";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FriendRequest {
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

interface FriendsSidebarProps {
  conversations: ConversationWithProfile[];
  friends: FriendWithProfile[];
  activeConversation: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation?: (id: string) => void;
  onRemoveFriend?: (friendshipId: string) => void;
  onOpenConversation?: (friendUserId: string) => void;
  onBlockUser?: (userId: string) => void;
  loading: boolean;
  friendRequests?: FriendRequest[];
  pendingRequestCount?: number;
  onAcceptRequest?: (requestId: string, senderId: string) => void;
  onDeclineRequest?: (requestId: string) => void;
}

const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.04, duration: 0.25, ease: "easeOut" },
  }),
  exit: { opacity: 0, x: -20, height: 0, padding: 0, transition: { duration: 0.2 } },
};

const tabContentVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

type TabType = "conversations" | "friends" | "requests";

const FriendsSidebar = ({
  conversations, friends, activeConversation, onSelectConversation,
  onDeleteConversation, onRemoveFriend, onOpenConversation, onBlockUser, loading,
  friendRequests = [], pendingRequestCount = 0, onAcceptRequest, onDeclineRequest,
}: FriendsSidebarProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("conversations");
  const [viewingProfile, setViewingProfile] = useState<Tables<"profiles"> | null>(null);
  const [confirmDeleteConvo, setConfirmDeleteConvo] = useState<string | null>(null);
  const [confirmRemoveFriend, setConfirmRemoveFriend] = useState<string | null>(null);
  const [confirmBlockUser, setConfirmBlockUser] = useState<string | null>(null);
  const [removingFriendId, setRemovingFriendId] = useState<string | null>(null);
  const [deletingConvoId, setDeletingConvoId] = useState<string | null>(null);

  const handleConfirmDeleteConvo = async () => {
    if (confirmDeleteConvo && onDeleteConversation) {
      setDeletingConvoId(confirmDeleteConvo);
      onDeleteConversation(confirmDeleteConvo);
      toast.success("Conversa ocultada");
      setDeletingConvoId(null);
    }
    setConfirmDeleteConvo(null);
  };

  const handleConfirmRemoveFriend = async () => {
    if (confirmRemoveFriend && onRemoveFriend) {
      setRemovingFriendId(confirmRemoveFriend);
      onRemoveFriend(confirmRemoveFriend);
      toast.success("Amigo removido");
      setRemovingFriendId(null);
    }
    setConfirmRemoveFriend(null);
  };

  const handleConfirmBlock = async () => {
    if (confirmBlockUser && onBlockUser) {
      onBlockUser(confirmBlockUser);
    }
    setConfirmBlockUser(null);
  };

  const relativeTime = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ptBR });
    } catch { return null; }
  };

  const tabs: { key: TabType; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: "conversations", label: "CONVERSAS", icon: <MessageSquare className="h-4 w-4" /> },
    { key: "friends", label: "AMIGOS", icon: <Users className="h-4 w-4" />, badge: friends.length || undefined },
    { key: "requests", label: "PEDIDOS", icon: <Bell className="h-4 w-4" />, badge: pendingRequestCount || undefined },
  ];

  return (
    <>
      <div className="flex h-full w-72 flex-col border-r border-border bg-card overflow-hidden">
        <div className="flex border-b border-border relative">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-3 font-display text-[10px] tracking-widest transition-all relative ${
                activeTab === tab.key
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.badge && tab.badge > 0 && (
                <span className={`ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                  tab.key === "requests" ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary"
                }`}>
                  {tab.badge}
                </span>
              )}
              {activeTab === tab.key && (
                <motion.div
                  layoutId="sidebar-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                />
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">
            {activeTab === "conversations" && !loading && (
              <motion.div key="conversations" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
                {conversations.length === 0 && (
                  <div className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Nenhuma conversa ainda</p>
                    <p className="mt-1 text-xs text-muted-foreground/60">Faça match com jogadores para começar a conversar!</p>
                  </div>
                )}
                <AnimatePresence>
                  {conversations.map((conv, i) => {
                    const profile = conv.otherProfile;
                    const initials = profile?.username?.slice(0, 2).toUpperCase() ?? "??";
                    const isActive = activeConversation === conv.id;
                    const timeAgo = relativeTime(conv.lastMessage?.created_at);

                    return (
                      <motion.button
                        key={conv.id} custom={i} variants={itemVariants} initial="hidden" animate="visible" exit="exit" layout
                        onClick={() => onSelectConversation(conv.id)}
                        className={`group flex w-full items-center gap-3 border-b border-border/50 p-4 text-left transition-colors ${
                          isActive ? "bg-primary/10 border-l-2 border-l-primary" : "hover:bg-muted/50"
                        }`}
                        whileHover={{ x: 2 }} transition={{ duration: 0.15 }}
                      >
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center font-display text-base font-bold text-primary shrink-0">
                          {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                          ) : initials}
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
                        {onDeleteConversation && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setConfirmDeleteConvo(conv.id); }}
                            className="p-1 text-muted-foreground/0 group-hover:text-muted-foreground hover:!text-destructive transition-colors"
                            title="Ocultar conversa"
                          >
                            {deletingConvoId === conv.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </button>
                        )}
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            )}

            {activeTab === "friends" && !loading && (
              <motion.div key="friends" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
                {friends.length === 0 && (
                  <div className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Nenhum amigo ainda</p>
                    <p className="mt-1 text-xs text-muted-foreground/60">Envie solicitações de amizade pelo chat!</p>
                  </div>
                )}
                <AnimatePresence>
                  {friends.map((friend, i) => {
                    const profile = friend.profile;
                    const initials = profile?.username?.slice(0, 2).toUpperCase() ?? "??";
                    const friendUserId = friend.user1_id === user?.id ? friend.user2_id : friend.user1_id;

                    return (
                      <motion.div
                        key={friend.id} custom={i} variants={itemVariants} initial="hidden" animate="visible" exit="exit" layout
                        className="group flex w-full items-center gap-3 border-b border-border/50 p-4 transition-colors hover:bg-muted/50"
                        whileHover={{ x: 2 }} transition={{ duration: 0.15 }}
                      >
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center font-display text-base font-bold text-primary shrink-0">
                          {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                          ) : initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-display text-sm font-semibold tracking-wide text-foreground truncate">{profile?.username ?? "Jogador"}</p>
                          {profile?.riot_id && <p className="truncate text-xs text-muted-foreground">{profile.riot_id}</p>}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button onClick={() => profile && setViewingProfile(profile)} className="p-1.5 text-muted-foreground hover:text-primary transition-colors" title="Ver perfil">
                            <Eye className="h-5 w-5" />
                          </button>
                          {onOpenConversation && profile && (
                            <button onClick={() => onOpenConversation(profile.user_id)} className="p-1.5 text-muted-foreground hover:text-primary transition-colors" title="Enviar mensagem">
                              <MessageCircle className="h-5 w-5" />
                            </button>
                          )}
                          {onBlockUser && (
                            <button onClick={() => setConfirmBlockUser(friendUserId)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors" title="Bloquear">
                              <ShieldBan className="h-5 w-5" />
                            </button>
                          )}
                          {onRemoveFriend && (
                            <button onClick={() => setConfirmRemoveFriend(friend.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors" title="Remover amigo">
                              {removingFriendId === friend.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserMinus className="h-5 w-5" />}
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            )}

            {activeTab === "requests" && !loading && (
              <motion.div key="requests" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
                {friendRequests.length === 0 && (
                  <div className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Nenhuma solicitação pendente</p>
                    <p className="mt-1 text-xs text-muted-foreground/60">Solicitações de amizade aparecerão aqui.</p>
                  </div>
                )}
                <AnimatePresence>
                  {friendRequests.map((req, i) => {
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
                          {onAcceptRequest && (
                            <button
                              onClick={() => onAcceptRequest(req.id, req.sender_id)}
                              className="p-1.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                              title="Aceitar"
                            >
                              <Check className="h-5 w-5" />
                            </button>
                          )}
                          {onDeclineRequest && (
                            <button
                              onClick={() => onDeclineRequest(req.id)}
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <FriendProfileModal profile={viewingProfile} open={!!viewingProfile} onClose={() => setViewingProfile(null)} />

      <ConfirmModal open={!!confirmDeleteConvo} onClose={() => setConfirmDeleteConvo(null)} onConfirm={handleConfirmDeleteConvo}
        title="Ocultar Conversa" description="Deseja realmente ocultar esta conversa? Ela deixará de aparecer na sua lista." />
      <ConfirmModal open={!!confirmRemoveFriend} onClose={() => setConfirmRemoveFriend(null)} onConfirm={handleConfirmRemoveFriend}
        title="Remover Amigo" description="Deseja remover este usuário da sua lista de amigos? As conversas associadas também serão ocultadas." />
      <ConfirmModal open={!!confirmBlockUser} onClose={() => setConfirmBlockUser(null)} onConfirm={handleConfirmBlock}
        title="Bloquear Jogador" description="Deseja bloquear este jogador? Ele será removido dos seus amigos e não poderá mais te encontrar." />
    </>
  );
};

export default FriendsSidebar;

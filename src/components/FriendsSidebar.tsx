import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Users, Bell } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import FriendProfileModal from "./FriendProfileModal";
import ConfirmModal from "./ConfirmModal";
import { ConversationsList } from "@/components/sidebar/ConversationsList";
import { FriendsList } from "@/components/sidebar/FriendsList";
import { FriendRequestsList, type FriendRequest } from "@/components/sidebar/FriendRequestsList";
import type { Tables } from "@/integrations/supabase/types";
import type { ConversationWithProfile, FriendWithProfile } from "@/types/chat";

interface FriendsSidebarProps {
  conversations: ConversationWithProfile[];
  friends: FriendWithProfile[];
  activeConversation: string | null;
  loading: boolean;
  friendRequests?: FriendRequest[];
  pendingRequestCount?: number;
  onSelectConversation: (id: string) => void;
  onDeleteConversation?: (id: string) => void;
  onRemoveFriend?: (friendshipId: string) => void;
  onOpenConversation?: (friendUserId: string) => void;
  onBlockUser?: (userId: string) => void;
  onAcceptRequest?: (requestId: string, senderId: string) => void;
  onDeclineRequest?: (requestId: string) => void;
}

const tabContentVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

type TabType = "conversations" | "friends" | "requests";

function FriendsSidebar({
  conversations, friends, activeConversation, loading,
  friendRequests = [], pendingRequestCount = 0,
  onSelectConversation, onDeleteConversation, onRemoveFriend,
  onOpenConversation, onBlockUser, onAcceptRequest, onDeclineRequest,
}: FriendsSidebarProps) {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>("conversations");
  const [viewingProfile, setViewingProfile] = useState<Tables<"profiles"> | null>(null);
  const [confirmDeleteConvo, setConfirmDeleteConvo] = useState<string | null>(null);
  const [confirmRemoveFriend, setConfirmRemoveFriend] = useState<string | null>(null);
  const [confirmBlockUser, setConfirmBlockUser] = useState<string | null>(null);
  const [removingFriendId, setRemovingFriendId] = useState<string | null>(null);
  const [deletingConvoId, setDeletingConvoId] = useState<string | null>(null);

  async function handleConfirmDeleteConvo() {
    if (confirmDeleteConvo && onDeleteConversation) {
      setDeletingConvoId(confirmDeleteConvo);
      onDeleteConversation(confirmDeleteConvo);
      toast.success("Conversa ocultada");
      setDeletingConvoId(null);
    }
    setConfirmDeleteConvo(null);
  }

  async function handleConfirmRemoveFriend() {
    if (confirmRemoveFriend && onRemoveFriend) {
      setRemovingFriendId(confirmRemoveFriend);
      onRemoveFriend(confirmRemoveFriend);
      toast.success("Amigo removido");
      setRemovingFriendId(null);
    }
    setConfirmRemoveFriend(null);
  }

  async function handleConfirmBlock() {
    if (confirmBlockUser && onBlockUser) onBlockUser(confirmBlockUser);
    setConfirmBlockUser(null);
  }

  const tabs: { key: TabType; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: "conversations", label: "CONVERSAS", icon: <MessageSquare className="h-4 w-4" /> },
    { key: "friends", label: "AMIGOS", icon: <Users className="h-4 w-4" />, badge: friends.length || undefined },
    { key: "requests", label: "PEDIDOS", icon: <Bell className="h-4 w-4" />, badge: pendingRequestCount || undefined },
  ];

  return (
    <>
      <div className="flex h-full w-full md:w-72 flex-col border-r border-border bg-card overflow-hidden">
        <div className="flex border-b border-border relative min-w-0 overflow-hidden">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 min-w-0 flex items-center justify-center gap-1 px-1 py-3 font-display text-[10px] tracking-widest transition-all relative whitespace-nowrap ${
                activeTab === tab.key ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline truncate">{tab.label}</span>
              {tab.badge && tab.badge > 0 && (
                <span className={`flex-shrink-0 min-w-[18px] text-[10px] px-1 py-0.5 rounded-full text-center leading-none ${
                  tab.key === "requests" ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary"
                }`}>
                  {tab.badge}
                </span>
              )}
              {activeTab === tab.key && (
                <motion.div layoutId="sidebar-tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map(i => (
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
                <ConversationsList
                  conversations={conversations}
                  activeConversation={activeConversation}
                  deletingConvoId={deletingConvoId}
                  onSelect={onSelectConversation}
                  onDelete={onDeleteConversation ? (id) => setConfirmDeleteConvo(id) : undefined}
                />
              </motion.div>
            )}

            {activeTab === "friends" && !loading && (
              <motion.div key="friends" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
                <FriendsList
                  friends={friends}
                  userId={user?.id}
                  removingFriendId={removingFriendId}
                  onViewProfile={setViewingProfile}
                  onOpenConversation={onOpenConversation}
                  onRemoveFriend={onRemoveFriend ? (id) => setConfirmRemoveFriend(id) : undefined}
                  onBlockUser={onBlockUser ? (id) => setConfirmBlockUser(id) : undefined}
                />
              </motion.div>
            )}

            {activeTab === "requests" && !loading && (
              <motion.div key="requests" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
                <FriendRequestsList
                  requests={friendRequests}
                  onAccept={onAcceptRequest}
                  onDecline={onDeclineRequest}
                />
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
}

export default FriendsSidebar;

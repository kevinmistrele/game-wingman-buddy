import { useState } from "react";
import { MessageSquare, Trash2, Users, UserMinus, MessageCircle, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import type { ConversationWithProfile, FriendWithProfile } from "@/hooks/useChat";
import FriendProfileModal from "./FriendProfileModal";
import ConfirmModal from "./ConfirmModal";

interface FriendsSidebarProps {
  conversations: ConversationWithProfile[];
  friends: FriendWithProfile[];
  activeConversation: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation?: (id: string) => void;
  onRemoveFriend?: (friendshipId: string) => void;
  onOpenConversation?: (friendUserId: string) => void;
  loading: boolean;
}

const FriendsSidebar = ({
  conversations,
  friends,
  activeConversation,
  onSelectConversation,
  onDeleteConversation,
  onRemoveFriend,
  onOpenConversation,
  loading,
}: FriendsSidebarProps) => {
  const { user } = useAuth();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<"conversations" | "friends">("conversations");
  const [viewingProfile, setViewingProfile] = useState<Tables<"profiles"> | null>(null);

  // Confirmation states
  const [confirmDeleteConvo, setConfirmDeleteConvo] = useState<string | null>(null);
  const [confirmRemoveFriend, setConfirmRemoveFriend] = useState<string | null>(null);

  const handleConfirmDeleteConvo = () => {
    if (confirmDeleteConvo && onDeleteConversation) {
      onDeleteConversation(confirmDeleteConvo);
      toast.success(t("chat_convo_hidden"));
    }
    setConfirmDeleteConvo(null);
  };

  const handleConfirmRemoveFriend = () => {
    if (confirmRemoveFriend && onRemoveFriend) {
      onRemoveFriend(confirmRemoveFriend);
      toast.success(t("chat_friend_removed"));
    }
    setConfirmRemoveFriend(null);
  };

  return (
    <>
      <div className="flex h-full w-72 flex-col border-r border-border bg-card">
        {/* Tab switcher */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab("conversations")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-display text-xs tracking-widest transition-all ${
              activeTab === "conversations"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            {t("chat_conversations")}
          </button>
          <button
            onClick={() => setActiveTab("friends")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-display text-xs tracking-widest transition-all ${
              activeTab === "friends"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            {t("chat_friends")}
            {friends.length > 0 && (
              <span className="ml-1 text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                {friends.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="p-4 text-center text-sm text-muted-foreground">{t("chat_loading")}</div>
          )}

          {/* Conversations tab */}
          {activeTab === "conversations" && !loading && (
            <>
              {conversations.length === 0 && (
                <div className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">{t("chat_no_convos")}</p>
                  <p className="mt-1 text-xs text-muted-foreground/60">{t("chat_no_convos_desc")}</p>
                </div>
              )}

              {conversations.map((conv) => {
                const profile = conv.otherProfile;
                const initials = profile?.username?.slice(0, 2).toUpperCase() ?? "??";
                const isActive = activeConversation === conv.id;

                return (
                  <button
                    key={conv.id}
                    onClick={() => onSelectConversation(conv.id)}
                    className={`group flex w-full items-center gap-3 border-b border-border/50 p-4 text-left transition-colors ${
                      isActive ? "bg-primary/10 border-l-2 border-l-primary" : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-display text-sm font-bold text-primary shrink-0">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                      ) : (
                        initials
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-sm font-semibold tracking-wide text-foreground">
                        {profile?.username ?? "Jogador"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {conv.lastMessage?.content ?? t("chat_start_convo")}
                      </p>
                    </div>
                    {onDeleteConversation && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteConvo(conv.id); }}
                        className="p-1 text-muted-foreground/0 group-hover:text-muted-foreground hover:!text-destructive transition-colors"
                        title={t("chat_hide_convo")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </button>
                );
              })}
            </>
          )}

          {/* Friends tab */}
          {activeTab === "friends" && !loading && (
            <>
              {friends.length === 0 && (
                <div className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">{t("chat_no_friends")}</p>
                  <p className="mt-1 text-xs text-muted-foreground/60">{t("chat_no_friends_desc")}</p>
                </div>
              )}

              {friends.map((friend) => {
                const profile = friend.profile;
                const initials = profile?.username?.slice(0, 2).toUpperCase() ?? "??";

                return (
                  <div
                    key={friend.id}
                    className="group flex w-full items-center gap-3 border-b border-border/50 p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-display text-sm font-bold text-primary shrink-0">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                      ) : (
                        initials
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-sm font-semibold tracking-wide text-foreground">
                        {profile?.username ?? "Jogador"}
                      </p>
                      {profile?.riot_id && (
                        <p className="truncate text-xs text-muted-foreground">{profile.riot_id}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => profile && setViewingProfile(profile)}
                        className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                        title={t("chat_view_profile")}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      {onOpenConversation && profile && (
                        <button
                          onClick={() => onOpenConversation(profile.user_id)}
                          className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                          title={t("chat_send_message")}
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {onRemoveFriend && (
                        <button
                          onClick={() => setConfirmRemoveFriend(friend.id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                          title={t("chat_remove_friend")}
                        >
                          <UserMinus className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      <FriendProfileModal
        profile={viewingProfile}
        open={!!viewingProfile}
        onClose={() => setViewingProfile(null)}
      />

      {/* Confirmation modals */}
      <ConfirmModal
        open={!!confirmDeleteConvo}
        onClose={() => setConfirmDeleteConvo(null)}
        onConfirm={handleConfirmDeleteConvo}
        title={t("confirm_delete_convo_title")}
        description={t("confirm_delete_convo_desc")}
      />
      <ConfirmModal
        open={!!confirmRemoveFriend}
        onClose={() => setConfirmRemoveFriend(null)}
        onConfirm={handleConfirmRemoveFriend}
        title={t("confirm_remove_friend_title")}
        description={t("confirm_remove_friend_desc")}
      />
    </>
  );
};

export default FriendsSidebar;

import { MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";

type Message = Tables<"messages">;
type Conversation = Tables<"conversations"> & {
  otherProfile: Tables<"profiles"> | null;
  lastMessage?: Message | null;
};

interface FriendsSidebarProps {
  conversations: Conversation[];
  activeConversation: string | null;
  onSelectConversation: (id: string) => void;
  loading: boolean;
}

const FriendsSidebar = ({
  conversations,
  activeConversation,
  onSelectConversation,
  loading,
}: FriendsSidebarProps) => {
  const { user } = useAuth();

  return (
    <div className="flex h-full w-72 flex-col border-r border-border bg-card">
      <div className="border-b border-border p-4">
        <h3 className="font-display text-sm font-bold tracking-widest text-muted-foreground">
          CONVERSATIONS
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
        )}

        {!loading && conversations.length === 0 && (
          <div className="p-4 text-center">
            <p className="text-sm text-muted-foreground">No conversations yet</p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Match with players to start chatting!
            </p>
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
              className={`flex w-full items-center gap-3 border-b border-border/50 p-4 text-left transition-colors ${
                isActive ? "bg-primary/10 border-l-2 border-l-primary" : "hover:bg-muted/50"
              }`}
            >
              <div className="relative">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-display text-sm font-bold text-primary">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display text-sm font-semibold tracking-wide text-foreground">
                  {profile?.username ?? "Player"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {conv.lastMessage?.content ?? "Start a conversation"}
                </p>
              </div>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FriendsSidebar;

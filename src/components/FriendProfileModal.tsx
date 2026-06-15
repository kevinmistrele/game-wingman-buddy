import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import RankBadge from "@/components/RankBadge";
import type { Tables } from "@/integrations/supabase/types";

interface FriendProfileModalProps {
  profile: Tables<"profiles"> | null;
  open: boolean;
  onClose: () => void;
}

const DiscordIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.369a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.369a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.332-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.332-.946 2.418-2.157 2.418z" />
  </svg>
);

const FriendProfileModal = ({ profile, open, onClose }: FriendProfileModalProps) => {
  if (!profile) return null;

  const initials = profile.username?.slice(0, 2).toUpperCase() ?? "??";
  const hasRank = profile.rank_tier;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm border-border bg-card">
        <DialogHeader>
          <DialogTitle className="font-display tracking-wider">PERFIL DO JOGADOR</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center font-display text-2xl font-bold text-primary">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
            ) : (
              initials
            )}
          </div>

          <h3 className="font-display text-xl font-bold tracking-wide text-foreground">
            {profile.username}
          </h3>

          <div className="w-full space-y-3">
            {profile.riot_id && (
              <div className="flex items-center justify-between border border-border p-3 rounded">
                <div>
                  <p className="text-xs font-display tracking-widest text-muted-foreground">RIOT ID</p>
                  <p className="text-sm text-foreground">{profile.riot_id}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(profile.riot_id!, "Riot ID")}
                  className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {profile.discord_username && (
              <div className="flex items-center justify-between border border-border p-3 rounded">
                <div className="flex items-center gap-2">
                  <DiscordIcon className="h-4 w-4 text-[#5865F2]" />
                  <div>
                    <p className="text-xs font-display tracking-widest text-muted-foreground">DISCORD</p>
                    <p className="text-sm text-foreground">{profile.discord_username}</p>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(profile.discord_username!, "Discord")}
                  className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {hasRank && (
              <div className="border border-border p-3 rounded text-center">
                <p className="text-xs font-display tracking-widest text-muted-foreground mb-2">RANK</p>
                <RankBadge
                  tier={profile.rank_tier!}
                  rank={profile.rank_division ?? "IV"}
                 
                  winRate={0}
                  size="md"
                />
                {profile.rank_source === "manual" && (
                  <p className="text-xs text-muted-foreground/60 mt-1">Rank definido manualmente</p>
                )}
              </div>
            )}

            <div className="border border-border p-3 rounded text-center">
              <p className="text-xs font-display tracking-widest text-muted-foreground">JOGO</p>
              <p className="text-sm text-foreground mt-1">League of Legends</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FriendProfileModal;

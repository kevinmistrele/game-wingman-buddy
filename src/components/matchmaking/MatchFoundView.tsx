import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { motionConfig } from "@/design-system/tokens";
import { Skeleton } from "@/components/ui/skeleton";
import RankBadge from "@/components/RankBadge";
import RoleIcon from "@/components/RoleIcon";
import type { MatchedPlayerInfo } from "@/types/matchmaking";

interface MatchFoundViewProps {
  matchedPlayer: MatchedPlayerInfo | null;
  otherAccepted: boolean;
  respondingMatch: "accept" | "decline" | null;
  onAccept: () => void;
  onDecline: () => void;
}

export function MatchFoundView({
  matchedPlayer, otherAccepted, respondingMatch, onAccept, onDecline,
}: MatchFoundViewProps) {
  return (
    <motion.div
      key="found"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex flex-col items-center gap-8"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", damping: 10 }}
        className="h-32 w-32 rounded-full border-2 border-primary bg-primary/10 flex items-center justify-center box-glow-primary"
      >
        <Check className="h-12 w-12 text-primary" />
      </motion.div>

      <div className="text-center">
        <h2 className="font-display text-3xl font-bold tracking-wider text-primary text-glow-primary">
          MATCH ENCONTRADO
        </h2>
        <p className="mt-2 text-muted-foreground">Um jogador quer se conectar!</p>
      </div>

      <motion.div
        {...motionConfig.fadeUp}
        transition={{ ...motionConfig.fadeUp.transition, delay: 0.3 }}
        className="clip-angle border border-primary/30 gradient-card p-6 w-80"
      >
        {!matchedPlayer ? (
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center font-display text-xl font-bold text-primary">
              {matchedPlayer.profile.avatar_url ? (
                <img src={matchedPlayer.profile.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
              ) : (
                matchedPlayer.profile.username?.slice(0, 2).toUpperCase() ?? "??"
              )}
            </div>
            <div className="flex-1">
              <p className="font-display text-lg font-semibold tracking-wide text-foreground">
                {matchedPlayer.profile.username ?? "Jogador"}
              </p>
              {matchedPlayer.rank ? (
                <>
                  <RankBadge
                    tier={matchedPlayer.rank.tier}
                    rank={matchedPlayer.rank.rank}
                    winRate={matchedPlayer.rank.winRate}
                    size="sm"
                  />
                  {matchedPlayer.rankSource === "manual" && (
                    <p className="text-xs text-muted-foreground/50">Rank manual</p>
                  )}
                </>
              ) : (
                <p className="text-xs text-muted-foreground">Sem rank</p>
              )}
              {matchedPlayer.myRole && (
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  Rota: <RoleIcon role={matchedPlayer.myRole} size="sm" showLabel className="text-foreground font-medium" />
                </p>
              )}
            </div>
          </div>
        )}

        {otherAccepted && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mt-3 text-center text-sm text-primary font-display"
          >
            ✓ O outro jogador aceitou!
          </motion.div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={onAccept}
            disabled={!!respondingMatch}
            className="flex-1 clip-angle-sm bg-primary py-3 font-display text-sm font-bold tracking-wider text-primary-foreground hover:box-glow-primary transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {respondingMatch === "accept" && <Loader2 className="h-4 w-4 animate-spin" />}
            ACEITAR
          </button>
          <button
            onClick={onDecline}
            disabled={!!respondingMatch}
            className="flex-1 clip-angle-sm border border-muted-foreground/30 py-3 font-display text-sm tracking-wider text-muted-foreground hover:border-destructive hover:text-destructive transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {respondingMatch === "decline" && <Loader2 className="h-4 w-4 animate-spin" />}
            RECUSAR
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

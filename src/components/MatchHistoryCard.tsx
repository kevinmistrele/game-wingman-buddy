import { motion } from "framer-motion";
import { Sword, Shield, Target, Clock, Trophy, TrendingUp, TrendingDown } from "lucide-react";
import type { LolMatch, ValorantMatch } from "@/hooks/useRiotMatches";

interface MatchHistoryCardProps {
  match: LolMatch | ValorantMatch;
  game: "lol" | "valorant";
}

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffH < 1) return "Agora há pouco";
  if (diffH < 24) return `${diffH}h atrás`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d atrás`;
  return date.toLocaleDateString("pt-BR");
};

const MatchHistoryCard = ({ match, game }: MatchHistoryCardProps) => {
  const kda = match.deaths === 0
    ? "Perfect"
    : ((match.kills + match.assists) / match.deaths).toFixed(1);

  if (game === "lol") {
    const lolMatch = match as LolMatch;
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className={`flex items-center gap-4 p-3 border-l-4 ${
          lolMatch.win ? "border-l-primary bg-primary/5" : "border-l-destructive bg-destructive/5"
        } border border-border/50`}
      >
        {/* Champion icon */}
        <div className="flex-shrink-0">
          <img
            src={`https://ddragon.leagueoflegends.com/cdn/14.10.1/img/champion/${lolMatch.champion}.png`}
            alt={lolMatch.champion}
            className="h-12 w-12 rounded border border-border"
            onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-display text-sm font-bold text-foreground">{lolMatch.champion}</span>
            <span className={`text-xs font-display font-bold ${lolMatch.win ? "text-primary" : "text-destructive"}`}>
              {lolMatch.win ? "VITÓRIA" : "DERROTA"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{lolMatch.gameMode}</p>
        </div>

        {/* KDA */}
        <div className="text-center">
          <p className="font-display text-sm font-bold text-foreground">
            {lolMatch.kills}/{lolMatch.deaths}/{lolMatch.assists}
          </p>
          <p className="text-[10px] text-muted-foreground font-display">KDA {kda}</p>
        </div>

        {/* CS & Gold */}
        <div className="text-center hidden sm:block">
          <p className="font-display text-sm text-foreground">{lolMatch.cs}</p>
          <p className="text-[10px] text-muted-foreground font-display">CS</p>
        </div>

        {/* Duration & Date */}
        <div className="text-right text-xs text-muted-foreground">
          <p className="flex items-center gap-1 justify-end">
            <Clock className="h-3 w-3" />
            {formatDuration(lolMatch.duration)}
          </p>
          <p>{formatDate(lolMatch.date)}</p>
        </div>
      </motion.div>
    );
  }

  // Valorant
  const valMatch = match as ValorantMatch;
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center gap-4 p-3 border-l-4 ${
        valMatch.win ? "border-l-primary bg-primary/5" : "border-l-destructive bg-destructive/5"
      } border border-border/50`}
    >
      <div className="flex-shrink-0 h-12 w-12 rounded bg-muted flex items-center justify-center">
        <Target className="h-6 w-6 text-secondary" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-display text-sm font-bold text-foreground">{valMatch.agent || "Agent"}</span>
          <span className={`text-xs font-display font-bold ${valMatch.win ? "text-primary" : "text-destructive"}`}>
            {valMatch.win ? "VITÓRIA" : "DERROTA"}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {valMatch.roundsWon}-{valMatch.roundsLost}
        </p>
      </div>

      <div className="text-center">
        <p className="font-display text-sm font-bold text-foreground">
          {valMatch.kills}/{valMatch.deaths}/{valMatch.assists}
        </p>
        <p className="text-[10px] text-muted-foreground font-display">KDA {kda}</p>
      </div>

      <div className="text-right text-xs text-muted-foreground">
        <p>{formatDate(valMatch.date)}</p>
      </div>
    </motion.div>
  );
};

export default MatchHistoryCard;

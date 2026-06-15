import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ChevronDown, Eye, Coins, Flame, Sword } from "lucide-react";
import type { LolMatch } from "@/hooks/useRiotMatches";

interface MatchHistoryCardProps {
  match: LolMatch;
  game: "lol";
}

const DDRAGON_VERSION = "14.10.1";

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

const formatNumber = (n: number) => {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
};

const MatchHistoryCard = ({ match }: MatchHistoryCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const kda = match.deaths === 0
    ? "Perfect"
    : ((match.kills + match.assists) / match.deaths).toFixed(1);

  const csPerMin = match.duration > 0 ? (match.cs / (match.duration / 60)).toFixed(1) : "0";

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`border-l-4 ${
        match.win ? "border-l-primary bg-primary/5" : "border-l-destructive bg-destructive/5"
      } border border-border/50 overflow-hidden`}
    >
      <div
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-shrink-0">
          <img
            src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${match.champion}.png`}
            alt={match.champion}
            className="h-12 w-12 rounded border border-border"
            onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-display text-sm font-bold text-foreground">{match.champion}</span>
            <span className={`text-xs font-display font-bold ${match.win ? "text-primary" : "text-destructive"}`}>
              {match.win ? "VITÓRIA" : "DERROTA"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{match.gameMode}</p>
        </div>

        <div className="text-center">
          <p className="font-display text-sm font-bold text-foreground">
            {match.kills}/{match.deaths}/{match.assists}
          </p>
          <p className={`text-xs font-display font-bold ${parseFloat(kda) >= 3 || kda === "Perfect" ? "text-primary" : parseFloat(kda) >= 2 ? "text-warning" : "text-muted-foreground"}`}>
            {kda} KDA
          </p>
        </div>

        <div className="text-center hidden sm:block">
          <p className="font-display text-sm text-foreground">{match.cs}</p>
          <p className="text-xs text-muted-foreground font-display">{csPerMin}/min</p>
        </div>

        <div className="text-right text-xs text-muted-foreground">
          <p className="flex items-center gap-1 justify-end">
            <Clock className="h-3 w-3" />
            {formatDuration(match.duration)}
          </p>
          <p>{formatDate(match.date)}</p>
        </div>

        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 border-t border-border/30 space-y-3">
              <div className="grid grid-cols-4 gap-2">
                <div className="flex items-center gap-1.5 text-xs">
                  <Flame className="h-3.5 w-3.5 text-orange-400" />
                  <span className="text-muted-foreground">Dano</span>
                  <span className="font-display font-bold text-foreground ml-auto">{formatNumber(match.damage)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <Coins className="h-3.5 w-3.5 text-warning" />
                  <span className="text-muted-foreground">Ouro</span>
                  <span className="font-display font-bold text-foreground ml-auto">{formatNumber(match.goldEarned)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <Eye className="h-3.5 w-3.5 text-info" />
                  <span className="text-muted-foreground">Visão</span>
                  <span className="font-display font-bold text-foreground ml-auto">{match.visionScore}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <Sword className="h-3.5 w-3.5 text-primary" />
                  <span className="text-muted-foreground">CS</span>
                  <span className="font-display font-bold text-foreground ml-auto">{match.cs}</span>
                </div>
              </div>

              {match.items && match.items.some((i) => i > 0) && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground font-display mr-1">Itens</span>
                  {match.items.map((itemId, idx) => (
                    itemId > 0 ? (
                      <img
                        key={idx}
                        src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/item/${itemId}.png`}
                        alt={`Item ${itemId}`}
                        className="h-7 w-7 rounded border border-border/50"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div key={idx} className="h-7 w-7 rounded border border-border/30 bg-muted/50" />
                    )
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MatchHistoryCard;

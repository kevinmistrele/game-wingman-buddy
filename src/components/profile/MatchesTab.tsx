import { motion } from "framer-motion";
import type { LolMatch } from "@/hooks/useRiotMatches";
import MatchHistoryCard from "@/components/MatchHistoryCard";
import { Swords } from "lucide-react";

const MatchesTab = ({ matches }: { matches: LolMatch[] }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
    <h4 className="font-display text-xs tracking-[0.2em] text-muted-foreground flex items-center gap-2">
      <Swords className="h-3 w-3" /> HISTÓRICO DE PARTIDAS
    </h4>
    <div className="space-y-1.5">
      {matches.map((match) => (
        <MatchHistoryCard key={match.matchId} match={match} game="lol" />
      ))}
      {matches.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">Nenhuma partida encontrada</p>
      )}
    </div>
  </motion.div>
);

export default MatchesTab;

import { motion } from "framer-motion";
import type { LolMatch, ChampionMastery } from "@/hooks/useRiotMatches";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Star } from "lucide-react";

const DDRAGON_VERSION = "14.10.1";

const getChampionStats = (matches: LolMatch[]) => {
  const map: Record<string, { wins: number; losses: number; kills: number; deaths: number; assists: number; cs: number; damage: number; games: number; champion: string }> = {};
  matches.forEach((m) => {
    if (!map[m.champion]) map[m.champion] = { wins: 0, losses: 0, kills: 0, deaths: 0, assists: 0, cs: 0, damage: 0, games: 0, champion: m.champion };
    const s = map[m.champion];
    s.games++;
    s.kills += m.kills;
    s.deaths += m.deaths;
    s.assists += m.assists;
    s.cs += m.cs;
    s.damage += m.damage;
    if (m.win) s.wins++; else s.losses++;
  });
  return Object.values(map).sort((a, b) => b.games - a.games);
};

const ChampionsTab = ({ matches, masteries }: { matches: LolMatch[]; masteries: ChampionMastery[] }) => {
  const champStats = getChampionStats(matches);

  return (
    <div className="space-y-6">
      {/* Performance by Champion */}
      {champStats.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
          <h4 className="font-display text-xs tracking-[0.2em] text-muted-foreground flex items-center gap-2">
            <BarChart3 className="h-3 w-3" /> DESEMPENHO POR CAMPEÃO
          </h4>
          <div className="space-y-1.5">
            {champStats.map((cs) => {
              const wr = Math.round((cs.wins / cs.games) * 100);
              const kda = cs.deaths === 0 ? "Perfect" : ((cs.kills + cs.assists) / cs.deaths).toFixed(1);
              const avgDmg = Math.round(cs.damage / cs.games);
              const avgCs = Math.round(cs.cs / cs.games);
              return (
                <div key={cs.champion} className="flex items-center gap-3 border border-border gradient-card p-3">
                  <img
                    src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${cs.champion}.png`}
                    alt={cs.champion}
                    className="h-10 w-10 rounded border border-border"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-sm font-bold text-foreground truncate">{cs.champion}</p>
                    <p className="text-xs text-muted-foreground">{cs.games} partidas • {cs.wins}W {cs.losses}L</p>
                  </div>
                  <div className="text-center hidden sm:block">
                    <p className="text-xs text-muted-foreground">DMG</p>
                    <p className="font-display text-xs font-bold text-foreground">{(avgDmg / 1000).toFixed(1)}K</p>
                  </div>
                  <div className="text-center hidden sm:block">
                    <p className="text-xs text-muted-foreground">CS</p>
                    <p className="font-display text-xs font-bold text-foreground">{avgCs}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-display text-sm font-bold ${wr >= 60 ? "text-primary" : wr >= 50 ? "text-yellow-400" : "text-destructive"}`}>{wr}% WR</p>
                    <p className="text-xs text-muted-foreground">{kda} KDA</p>
                  </div>
                  <div className="w-16 hidden sm:block">
                    <Progress value={wr} className="h-1.5" />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Masteries */}
      {masteries.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
          <h4 className="font-display text-xs tracking-[0.2em] text-muted-foreground flex items-center gap-2">
            <Star className="h-3 w-3" /> MAESTRIAS DE CAMPEÕES
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {masteries.map((champ) => (
              <div key={champ.championId} className="border border-border gradient-card p-3 text-center">
                <img src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${champ.championName}.png`} alt={champ.championName}
                  className="h-14 w-14 mx-auto rounded-full border-2 border-primary/20 object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <p className="mt-2 font-display text-xs font-bold text-foreground truncate">{champ.championName}</p>
                <p className="text-xs text-primary font-display font-bold">M{champ.championLevel}</p>
                <p className="text-xs text-muted-foreground font-display">{(champ.championPoints / 1000).toFixed(0)}K pts</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ChampionsTab;

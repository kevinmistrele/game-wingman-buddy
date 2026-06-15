import { motion } from "framer-motion";
import type { LolProfileResponse, LolMatch } from "@/hooks/useRiotMatches";
import RankBadge from "@/components/RankBadge";
import { Trophy, Swords, Shield, Target, Flame, Coins, Eye, TrendingUp, BarChart3 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const DDRAGON_VERSION = "14.10.1";

const formatNumber = (n: number) => {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return Math.round(n).toString();
};

const StatItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="text-center space-y-1">
    <div className="flex justify-center">{icon}</div>
    <p className="font-display text-sm font-bold text-foreground">{value}</p>
    <p className="font-display text-xs tracking-wider text-muted-foreground">{label}</p>
  </div>
);

const OverviewTab = ({ data }: { data: LolProfileResponse }) => {
  const ranked = data.summoner?.ranked?.find((r) => r.queueType === "RANKED_SOLO_5x5");
  const flexRanked = data.summoner?.ranked?.find((r) => r.queueType === "RANKED_FLEX_SR");
  const totalMatches = data.recentMatches.length;
  const wins = data.recentMatches.filter((m) => m.win).length;
  const losses = totalMatches - wins;

  const avg = (fn: (m: LolMatch) => number) => totalMatches ? data.recentMatches.reduce((a, m) => a + fn(m), 0) / totalMatches : 0;
  const avgKills = avg((m) => m.kills).toFixed(1);
  const avgDeaths = avg((m) => m.deaths).toFixed(1);
  const avgAssists = avg((m) => m.assists).toFixed(1);
  const avgCsPerMin = totalMatches ? (data.recentMatches.reduce((a, m) => a + (m.duration > 0 ? m.cs / (m.duration / 60) : 0), 0) / totalMatches).toFixed(1) : "0";
  const avgDamage = avg((m) => m.damage);
  const avgGold = avg((m) => m.goldEarned);
  const avgVision = avg((m) => m.visionScore).toFixed(1);
  const avgKda = avg((m) => m.deaths === 0 ? (m.kills + m.assists) : (m.kills + m.assists) / m.deaths).toFixed(2);

  const bestKda = totalMatches ? Math.max(...data.recentMatches.map((m) => m.deaths === 0 ? m.kills + m.assists : (m.kills + m.assists) / m.deaths)) : 0;
  const maxDamage = totalMatches ? Math.max(...data.recentMatches.map((m) => m.damage)) : 0;
  const maxCs = totalMatches ? Math.max(...data.recentMatches.map((m) => m.cs)) : 0;

  let currentStreak = 0;
  let streakType: "win" | "loss" = data.recentMatches[0]?.win ? "win" : "loss";
  for (const m of data.recentMatches) {
    if ((streakType === "win" && m.win) || (streakType === "loss" && !m.win)) currentStreak++;
    else break;
  }

  return (
    <div className="space-y-4">
      {/* Summoner Header */}
      {data.summoner && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="clip-angle border border-border gradient-card p-5">
          <div className="flex items-center gap-4">
            <img src={data.summoner.profileIconUrl} alt="Profile Icon" className="h-16 w-16 rounded-full border-2 border-primary/30" />
            <div className="flex-1">
              <h3 className="font-display text-lg font-bold tracking-wider text-foreground">{data.gameName}#{data.tagLine}</h3>
              <p className="text-sm text-muted-foreground">Nível {data.summoner.level}</p>
            </div>
            {ranked && <RankBadge tier={ranked.tier} rank={ranked.rank} winRate={ranked.winRate} wins={ranked.wins} losses={ranked.losses} size="lg" />}
          </div>
          {flexRanked && (
            <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-3">
              <span className="text-xs text-muted-foreground font-display tracking-wider">FLEX</span>
              <RankBadge tier={flexRanked.tier} rank={flexRanked.rank} winRate={flexRanked.winRate} wins={flexRanked.wins} losses={flexRanked.losses} size="sm" />
            </div>
          )}
        </motion.div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "PARTIDAS", value: totalMatches.toString(), icon: Swords },
          { label: "VITÓRIAS", value: `${wins}W ${losses}L`, icon: Trophy },
          { label: "KDA MÉDIO", value: `${avgKills}/${avgDeaths}/${avgAssists}`, icon: Target },
          { label: "WIN RATE", value: totalMatches ? `${Math.round((wins / totalMatches) * 100)}%` : "—", icon: Shield },
        ].map((stat) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="border border-border gradient-card p-3 text-center">
            <stat.icon className="mx-auto h-4 w-4 text-primary/60 mb-1" />
            <p className="font-display text-sm font-bold text-foreground">{stat.value}</p>
            <p className="font-display text-xs tracking-widest text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Performance */}
      {totalMatches > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="border border-border gradient-card p-5 space-y-4">
          <h4 className="font-display text-xs tracking-[0.2em] text-muted-foreground flex items-center gap-2">
            <BarChart3 className="h-3 w-3" /> DESEMPENHO
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatItem icon={<Flame className="h-4 w-4 text-orange-400" />} label="DMG MÉDIO" value={formatNumber(avgDamage)} />
            <StatItem icon={<Coins className="h-4 w-4 text-warning" />} label="OURO MÉDIO" value={formatNumber(avgGold)} />
            <StatItem icon={<Eye className="h-4 w-4 text-info" />} label="VISÃO MÉDIA" value={avgVision} />
            <StatItem icon={<TrendingUp className="h-4 w-4 text-emerald-400" />} label="CS/MIN" value={avgCsPerMin} />
          </div>
          <div className="flex items-center gap-3 pt-2 border-t border-border/50">
            <span className="text-xs text-muted-foreground font-display tracking-wider">KDA</span>
            <span className={`font-display text-lg font-bold ${parseFloat(avgKda) >= 3 ? "text-primary" : parseFloat(avgKda) >= 2 ? "text-warning" : "text-destructive"}`}>{avgKda}</span>
            <div className="flex-1">
              <Progress value={Math.min(parseFloat(avgKda) / 5 * 100, 100)} className="h-2" />
            </div>
          </div>
          {currentStreak >= 2 && (
            <div className={`flex items-center gap-2 text-sm font-display font-bold ${streakType === "win" ? "text-primary" : "text-destructive"}`}>
              {streakType === "win" ? <Trophy className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
              {currentStreak} {streakType === "win" ? "vitórias seguidas" : "derrotas seguidas"}
            </div>
          )}
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border/50">
            <div className="text-center">
              <p className="text-xs text-muted-foreground font-display">MELHOR KDA</p>
              <p className="font-display text-sm font-bold text-foreground">{bestKda === Infinity ? "Perfect" : bestKda.toFixed(1)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground font-display">MAX DANO</p>
              <p className="font-display text-sm font-bold text-foreground">{formatNumber(maxDamage)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground font-display">MAX CS</p>
              <p className="font-display text-sm font-bold text-foreground">{maxCs}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Top Champions Preview */}
      {data.topChampions.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
          <h4 className="font-display text-xs tracking-[0.2em] text-muted-foreground">TOP CAMPEÕES</h4>
          <div className="grid grid-cols-5 gap-2">
            {data.topChampions.slice(0, 5).map((champ) => (
              <div key={champ.championId} className="border border-border gradient-card p-2 text-center">
                <img src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${champ.championName}.png`} alt={champ.championName}
                  className="h-12 w-12 mx-auto rounded-full border-2 border-primary/20 object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <p className="mt-1 font-display text-xs font-bold text-foreground truncate">{champ.championName}</p>
                <p className="text-xs text-muted-foreground font-display">M{champ.championLevel}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default OverviewTab;

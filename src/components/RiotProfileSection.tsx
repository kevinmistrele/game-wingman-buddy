import { useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useRiotProfile } from "@/hooks/useRiotMatches";
import type { LolProfileResponse, ValorantProfileResponse, LolMatch, ValorantMatch } from "@/hooks/useRiotMatches";
import MatchHistoryCard from "@/components/MatchHistoryCard";
import { Trophy, Swords, Star, AlertCircle, Loader2, Shield, Target } from "lucide-react";

const TIER_COLORS: Record<string, string> = {
  IRON: "text-muted-foreground",
  BRONZE: "text-[hsl(25,60%,50%)]",
  SILVER: "text-muted-foreground",
  GOLD: "text-secondary",
  PLATINUM: "text-[hsl(175,60%,50%)]",
  EMERALD: "text-[hsl(140,60%,50%)]",
  DIAMOND: "text-[hsl(210,80%,65%)]",
  MASTER: "text-accent",
  GRANDMASTER: "text-destructive",
  CHALLENGER: "text-secondary",
};

const RiotProfileSection = () => {
  const { profile } = useAuth();
  const [game, setGame] = useState<"lol" | "valorant">(
    profile?.preferred_game === "valorant" ? "valorant" : "lol"
  );

  const { data, isLoading, error } = useRiotProfile(game, profile?.riot_id, "br1", 10);

  if (!profile?.riot_id) {
    return (
      <div className="clip-angle border border-border gradient-card p-8 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
        <p className="font-display text-sm tracking-wider text-muted-foreground">
          VINCULE SEU RIOT ID NO PERFIL PARA VER SUAS ESTATÍSTICAS
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Game Tabs */}
      <Tabs value={game} onValueChange={(v) => setGame(v as "lol" | "valorant")}>
        <TabsList className="bg-muted border border-border w-full">
          <TabsTrigger value="lol" className="flex-1 font-display tracking-wider text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            LEAGUE OF LEGENDS
          </TabsTrigger>
          <TabsTrigger value="valorant" className="flex-1 font-display tracking-wider text-xs data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
            VALORANT
          </TabsTrigger>
        </TabsList>

        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 font-display text-sm tracking-wider text-muted-foreground">
              CARREGANDO DADOS DA RIOT...
            </span>
          </div>
        )}

        {error && (
          <div className="clip-angle border border-destructive/30 bg-destructive/5 p-6 text-center mt-4">
            <AlertCircle className="mx-auto h-6 w-6 text-destructive mb-2" />
            <p className="text-sm text-destructive">{(error as Error).message}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Verifique se sua API Key da Riot está válida
            </p>
          </div>
        )}

        {!isLoading && !error && data && (
          <>
            <TabsContent value="lol" className="space-y-4 mt-4">
              {data.game === "lol" && <LolProfile data={data} />}
            </TabsContent>
            <TabsContent value="valorant" className="space-y-4 mt-4">
              {data.game === "valorant" && <ValorantProfile data={data} />}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
};

const LolProfile = ({ data }: { data: LolProfileResponse }) => {
  const ranked = data.summoner?.ranked?.find((r) => r.queueType === "RANKED_SOLO_5x5");
  const totalMatches = data.recentMatches.length;
  const wins = data.recentMatches.filter((m) => m.win).length;
  const avgKills = totalMatches ? (data.recentMatches.reduce((a, m) => a + m.kills, 0) / totalMatches).toFixed(1) : "0";
  const avgDeaths = totalMatches ? (data.recentMatches.reduce((a, m) => a + m.deaths, 0) / totalMatches).toFixed(1) : "0";
  const avgAssists = totalMatches ? (data.recentMatches.reduce((a, m) => a + m.assists, 0) / totalMatches).toFixed(1) : "0";

  return (
    <>
      {/* Summoner Info */}
      {data.summoner && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="clip-angle border border-border gradient-card p-5"
        >
          <div className="flex items-center gap-4">
            <img
              src={data.summoner.profileIconUrl}
              alt="Profile Icon"
              className="h-16 w-16 rounded-full border-2 border-primary/30"
            />
            <div className="flex-1">
              <h3 className="font-display text-lg font-bold tracking-wider text-foreground">
                {data.gameName}#{data.tagLine}
              </h3>
              <p className="text-sm text-muted-foreground">Nível {data.summoner.level}</p>
            </div>
            {ranked && (
              <div className="text-right">
                <p className={`font-display text-lg font-bold ${TIER_COLORS[ranked.tier] ?? "text-foreground"}`}>
                  {ranked.tier} {ranked.rank}
                </p>
                <p className="text-xs text-muted-foreground">{ranked.lp} LP • {ranked.winRate}% WR</p>
                <p className="text-[10px] text-muted-foreground">{ranked.wins}V {ranked.losses}D</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "PARTIDAS", value: totalMatches.toString(), icon: Swords },
          { label: "VITÓRIAS", value: `${wins}/${totalMatches}`, icon: Trophy },
          { label: "KDA MÉDIO", value: `${avgKills}/${avgDeaths}/${avgAssists}`, icon: Target },
          { label: "WIN RATE", value: totalMatches ? `${Math.round((wins / totalMatches) * 100)}%` : "—", icon: Shield },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-border gradient-card p-3 text-center"
          >
            <stat.icon className="mx-auto h-4 w-4 text-primary/60 mb-1" />
            <p className="font-display text-sm font-bold text-foreground">{stat.value}</p>
            <p className="font-display text-[9px] tracking-widest text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Top Champions */}
      {data.topChampions.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
          <h4 className="font-display text-xs tracking-[0.2em] text-muted-foreground flex items-center gap-2">
            <Star className="h-3 w-3" /> CAMPEÕES MAIS JOGADOS
          </h4>
          <div className="grid grid-cols-5 gap-2">
            {data.topChampions.map((champ) => (
              <div key={champ.championId} className="border border-border gradient-card p-2 text-center">
                <img
                  src={`https://ddragon.leagueoflegends.com/cdn/14.10.1/img/champion/${champ.championName}.png`}
                  alt={champ.championName}
                  className="h-12 w-12 mx-auto rounded-full border-2 border-primary/20 object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <p className="mt-1 font-display text-xs font-bold text-foreground truncate">
                  {champ.championName}
                </p>
                <p className="text-[10px] text-muted-foreground font-display">
                  M{champ.championLevel} • {(champ.championPoints / 1000).toFixed(0)}K
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Match History */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
        <h4 className="font-display text-xs tracking-[0.2em] text-muted-foreground flex items-center gap-2">
          <Swords className="h-3 w-3" /> PARTIDAS RECENTES
        </h4>
        <div className="space-y-1.5">
          {data.recentMatches.map((match) => (
            <MatchHistoryCard key={match.matchId} match={match} game="lol" />
          ))}
          {data.recentMatches.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma partida encontrada</p>
          )}
        </div>
      </motion.div>
    </>
  );
};

const ValorantProfile = ({ data }: { data: ValorantProfileResponse }) => {
  const totalMatches = data.recentMatches.length;
  const wins = data.recentMatches.filter((m) => m.win).length;
  const avgKills = totalMatches ? (data.recentMatches.reduce((a, m) => a + m.kills, 0) / totalMatches).toFixed(1) : "0";
  const avgDeaths = totalMatches ? (data.recentMatches.reduce((a, m) => a + m.deaths, 0) / totalMatches).toFixed(1) : "0";
  const avgAssists = totalMatches ? (data.recentMatches.reduce((a, m) => a + m.assists, 0) / totalMatches).toFixed(1) : "0";

  return (
    <>
      {/* Player Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="clip-angle border border-border gradient-card p-5"
      >
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full border-2 border-secondary/30 bg-muted flex items-center justify-center">
            <Target className="h-8 w-8 text-secondary" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold tracking-wider text-foreground">
              {data.gameName}#{data.tagLine}
            </h3>
            <p className="text-sm text-muted-foreground">Valorant</p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "PARTIDAS", value: totalMatches.toString(), icon: Swords },
          { label: "VITÓRIAS", value: `${wins}/${totalMatches}`, icon: Trophy },
          { label: "KDA MÉDIO", value: `${avgKills}/${avgDeaths}/${avgAssists}`, icon: Target },
          { label: "WIN RATE", value: totalMatches ? `${Math.round((wins / totalMatches) * 100)}%` : "—", icon: Shield },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-border gradient-card p-3 text-center"
          >
            <stat.icon className="mx-auto h-4 w-4 text-secondary/60 mb-1" />
            <p className="font-display text-sm font-bold text-foreground">{stat.value}</p>
            <p className="font-display text-[9px] tracking-widest text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Top Agents */}
      {data.topAgents.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
          <h4 className="font-display text-xs tracking-[0.2em] text-muted-foreground flex items-center gap-2">
            <Star className="h-3 w-3" /> AGENTES MAIS USADOS
          </h4>
          <div className="space-y-1.5">
            {data.topAgents.map((agent) => (
              <div key={agent.agentId} className="flex items-center gap-3 border border-border gradient-card p-3">
                <div className="h-10 w-10 rounded bg-secondary/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-secondary" />
                </div>
                <div className="flex-1">
                  <p className="font-display text-sm font-bold text-foreground">{agent.agentId}</p>
                  <p className="text-xs text-muted-foreground">{agent.games} partidas</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-sm font-bold text-foreground">{agent.winRate}% WR</p>
                  <p className="text-[10px] text-muted-foreground">
                    {agent.kills}/{agent.deaths}/{agent.assists} KDA
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Match History */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
        <h4 className="font-display text-xs tracking-[0.2em] text-muted-foreground flex items-center gap-2">
          <Swords className="h-3 w-3" /> PARTIDAS RECENTES
        </h4>
        <div className="space-y-1.5">
          {data.recentMatches.map((match) => (
            <MatchHistoryCard key={match.matchId} match={match} game="valorant" />
          ))}
          {data.recentMatches.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma partida encontrada</p>
          )}
        </div>
      </motion.div>
    </>
  );
};

export default RiotProfileSection;

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
import { z } from "npm:zod@3.25.76";

const RIOT_REGIONS: Record<string, string> = {
  na1: "americas", br1: "americas", la1: "americas", la2: "americas",
  euw1: "europe", eun1: "europe", tr1: "europe", ru: "europe",
  kr: "asia", jp1: "asia",
  oc1: "sea", ph2: "sea", sg2: "sea", th2: "sea", tw2: "sea", vn2: "sea",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const QuerySchema = z.object({
  action: z.enum(["matches", "profile"]),
  game: z.enum(["lol", "valorant"]),
  riotId: z.string().min(1),
  region: z.string().default("br1"),
  count: z.coerce.number().min(1).max(20).default(5),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const RIOT_API_KEY = Deno.env.get("RIOT_API_KEY");
  if (!RIOT_API_KEY) return json({ error: "RIOT_API_KEY not configured" }, 500);

  try {
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      action: url.searchParams.get("action") ?? "matches",
      game: url.searchParams.get("game"),
      riotId: url.searchParams.get("riotId"),
      region: url.searchParams.get("region") ?? "br1",
      count: url.searchParams.get("count") ?? "5",
    });

    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);

    const { action, game, riotId, region, count } = parsed.data;
    const [gameName, tagLine] = riotId.split("#");
    if (!gameName || !tagLine) return json({ error: "Invalid Riot ID. Use Name#TAG" }, 400);

    const continent = RIOT_REGIONS[region] ?? "americas";
    const headers = { "X-Riot-Token": RIOT_API_KEY };

    // Get PUUID
    const accountRes = await fetch(
      `https://${continent}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
      { headers }
    );
    if (!accountRes.ok) {
      const body = await accountRes.text();
      return json({ error: `Account lookup failed [${accountRes.status}]: ${body}` }, accountRes.status);
    }
    const account = await accountRes.json();
    const puuid = account.puuid;

    // ===== PROFILE ACTION =====
    if (action === "profile") {
      if (game === "lol") {
        // Get summoner by PUUID
        const summonerRes = await fetch(
          `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,
          { headers }
        );
        let summoner = null;
        if (summonerRes.ok) {
          const s = await summonerRes.json();
          summoner = {
            name: s.name,
            level: s.summonerLevel,
            profileIconId: s.profileIconId,
            profileIconUrl: `https://ddragon.leagueoflegends.com/cdn/14.10.1/img/profileicon/${s.profileIconId}.png`,
          };

          // Get ranked info
          const rankedRes = await fetch(
            `https://${region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${s.id}`,
            { headers }
          );
          if (rankedRes.ok) {
            const ranked = await rankedRes.json();
            summoner.ranked = ranked.map((r: any) => ({
              queueType: r.queueType,
              tier: r.tier,
              rank: r.rank,
              lp: r.leaguePoints,
              wins: r.wins,
              losses: r.losses,
              winRate: Math.round((r.wins / (r.wins + r.losses)) * 100),
            }));
          }
        }

        // Fetch Data Dragon champion map for id->name resolution
        let championMap: Record<number, string> = {};
        try {
          const versionRes = await fetch("https://ddragon.leagueoflegends.com/api/versions.json");
          const versions: string[] = await versionRes.json();
          const latestVersion = versions[0];
          const champListRes = await fetch(`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/champion.json`);
          const champListData = await champListRes.json();
          for (const champ of Object.values(champListData.data) as any[]) {
            championMap[parseInt(champ.key)] = champ.id;
          }
        } catch (e) {
          console.error("Failed to fetch champion data from Data Dragon:", e);
        }

        // Champion mastery top 5
        const masteryRes = await fetch(
          `https://${region}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/top?count=5`,
          { headers }
        );
        let topChampions: any[] = [];
        if (masteryRes.ok) {
          const masteries = await masteryRes.json();
          topChampions = masteries.map((m: any) => {
            const champKey = championMap[m.championId] ?? "Unknown";
            return {
              championId: m.championId,
              championName: champKey,
              championLevel: m.championLevel,
              championPoints: m.championPoints,
              lastPlayTime: new Date(m.lastPlayTime).toISOString(),
            };
          });
        }

        // Recent matches (last 5)
        const matchIdsRes = await fetch(
          `https://${continent}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?count=${count}`,
          { headers }
        );
        let recentMatches: any[] = [];
        if (matchIdsRes.ok) {
          const matchIds: string[] = await matchIdsRes.json();
          for (const matchId of matchIds) {
            const matchRes = await fetch(
              `https://${continent}.api.riotgames.com/lol/match/v5/matches/${matchId}`,
              { headers }
            );
            if (matchRes.ok) {
              const match = await matchRes.json();
              const p = match.info.participants.find((p: any) => p.puuid === puuid);
              if (p) {
                recentMatches.push({
                  matchId,
                  gameMode: match.info.gameMode,
                  champion: p.championName,
                  championId: p.championId,
                  win: p.win,
                  kills: p.kills,
                  deaths: p.deaths,
                  assists: p.assists,
                  cs: p.totalMinionsKilled + p.neutralMinionsKilled,
                  visionScore: p.visionScore,
                  goldEarned: p.goldEarned,
                  damage: p.totalDamageDealtToChampions,
                  duration: match.info.gameDuration,
                  date: new Date(match.info.gameCreation).toISOString(),
                  items: [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5, p.item6],
                });
              }
            }
          }
        }

        return json({ game: "lol", puuid, gameName, tagLine, summoner, topChampions, recentMatches });
      }

      if (game === "valorant") {
        // Valorant match history
        const matchIdsRes = await fetch(
          `https://${continent}.api.riotgames.com/val/match/v1/matchlists/by-puuid/${puuid}`,
          { headers }
        );
        let recentMatches: any[] = [];
        const agentStats: Record<string, { wins: number; losses: number; kills: number; deaths: number; assists: number; games: number }> = {};

        if (matchIdsRes.ok) {
          const matchList = await matchIdsRes.json();
          const matchIds = (matchList.history || []).slice(0, count).map((m: any) => m.matchId);

          for (const matchId of matchIds) {
            const matchRes = await fetch(
              `https://${continent}.api.riotgames.com/val/match/v1/matches/${matchId}`,
              { headers }
            );
            if (matchRes.ok) {
              const match = await matchRes.json();
              const player = match.players?.find((p: any) => p.puuid === puuid);
              if (player) {
                const team = match.teams?.find((t: any) => t.teamId === player.teamId);
                const won = team?.won ?? false;
                const agentId = player.characterId;

                recentMatches.push({
                  matchId,
                  map: match.matchInfo?.mapId,
                  agent: agentId,
                  win: won,
                  kills: player.stats?.kills ?? 0,
                  deaths: player.stats?.deaths ?? 0,
                  assists: player.stats?.assists ?? 0,
                  score: player.stats?.score ?? 0,
                  roundsWon: team?.roundsWon ?? 0,
                  roundsLost: team?.roundsPlayed ? (team.roundsPlayed - (team.roundsWon ?? 0)) : 0,
                  date: new Date(match.matchInfo?.gameStartMillis ?? 0).toISOString(),
                });

                // Aggregate agent stats
                if (!agentStats[agentId]) {
                  agentStats[agentId] = { wins: 0, losses: 0, kills: 0, deaths: 0, assists: 0, games: 0 };
                }
                agentStats[agentId].games++;
                agentStats[agentId].kills += player.stats?.kills ?? 0;
                agentStats[agentId].deaths += player.stats?.deaths ?? 0;
                agentStats[agentId].assists += player.stats?.assists ?? 0;
                if (won) agentStats[agentId].wins++;
                else agentStats[agentId].losses++;
              }
            }
          }
        }

        const topAgents = Object.entries(agentStats)
          .map(([agentId, stats]) => ({ agentId, ...stats, winRate: Math.round((stats.wins / stats.games) * 100) }))
          .sort((a, b) => b.games - a.games);

        return json({ game: "valorant", puuid, gameName, tagLine, recentMatches, topAgents });
      }
    }

    // ===== MATCHES ACTION (legacy) =====
    if (action === "matches") {
      if (game === "lol") {
        const matchIdsRes = await fetch(
          `https://${continent}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?count=${count}`,
          { headers }
        );
        if (!matchIdsRes.ok) return json({ error: `Match history failed [${matchIdsRes.status}]` }, matchIdsRes.status);
        const matchIds: string[] = await matchIdsRes.json();

        const matches = [];
        for (const matchId of matchIds) {
          const matchRes = await fetch(`https://${continent}.api.riotgames.com/lol/match/v5/matches/${matchId}`, { headers });
          if (matchRes.ok) {
            const match = await matchRes.json();
            const p = match.info.participants.find((p: any) => p.puuid === puuid);
            if (p) {
              matches.push({
                matchId, gameMode: match.info.gameMode, champion: p.championName, win: p.win,
                kills: p.kills, deaths: p.deaths, assists: p.assists,
                cs: p.totalMinionsKilled + p.neutralMinionsKilled,
                duration: match.info.gameDuration, date: new Date(match.info.gameCreation).toISOString(),
              });
            }
          }
        }
        return json({ matches, puuid, gameName, tagLine });
      }

      if (game === "valorant") {
        const matchIdsRes = await fetch(`https://${continent}.api.riotgames.com/val/match/v1/matchlists/by-puuid/${puuid}`, { headers });
        if (!matchIdsRes.ok) return json({ error: `Valorant match history failed [${matchIdsRes.status}]` }, matchIdsRes.status);
        const matchList = await matchIdsRes.json();
        const matchIds = (matchList.history || []).slice(0, count).map((m: any) => m.matchId);

        const matches = [];
        for (const matchId of matchIds) {
          const matchRes = await fetch(`https://${continent}.api.riotgames.com/val/match/v1/matches/${matchId}`, { headers });
          if (matchRes.ok) {
            const match = await matchRes.json();
            const player = match.players?.find((p: any) => p.puuid === puuid);
            if (player) {
              const team = match.teams?.find((t: any) => t.teamId === player.teamId);
              matches.push({
                matchId, map: match.matchInfo?.mapId, agent: player.characterId, win: team?.won ?? false,
                kills: player.stats?.kills ?? 0, deaths: player.stats?.deaths ?? 0, assists: player.stats?.assists ?? 0,
                score: player.stats?.score ?? 0, date: new Date(match.matchInfo?.gameStartMillis ?? 0).toISOString(),
              });
            }
          }
        }
        return json({ matches, puuid, gameName, tagLine });
      }
    }

    return json({ error: "Invalid game" }, 400);
  } catch (error) {
    console.error("Riot API error:", error);
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});

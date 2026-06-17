import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { z } from "zod";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RIOT_REGIONS: Record<string, string> = {
  na1: "americas", br1: "americas", la1: "americas", la2: "americas",
  euw1: "europe", eun1: "europe", tr1: "europe", ru: "europe",
  kr: "asia", jp1: "asia",
  oc1: "sea", ph2: "sea", sg2: "sea", th2: "sea", tw2: "sea", vn2: "sea",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });

const QuerySchema = z.object({
  action: z.enum(["matches", "profile"]),
  game: z.enum(["lol", "valorant"]),
  riotId: z.string().min(1),
  region: z.string().default("br1"),
  count: z.coerce.number().min(1).max(20).default(5),
});

// ===== TYPES =====

interface RiotAccount { puuid: string }

interface RiotSummoner {
  id: string;
  name?: string;
  summonerLevel: number;
  profileIconId: number;
}

interface RiotRankedEntry {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
}

interface DataDragonChampion { id: string; key: string }

interface ChampionMastery {
  championId: number;
  championLevel: number;
  championPoints: number;
  lastPlayTime: number;
}

interface LolParticipant {
  puuid: string;
  championName: string;
  championId: number;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  totalMinionsKilled: number;
  neutralMinionsKilled: number;
  visionScore: number;
  goldEarned: number;
  totalDamageDealtToChampions: number;
  item0: number; item1: number; item2: number;
  item3: number; item4: number; item5: number; item6: number;
}

interface LolMatchResponse {
  info: {
    gameMode: string;
    gameDuration: number;
    gameCreation: number;
    participants: LolParticipant[];
  };
}

interface ValorantMatchListItem { matchId: string }
interface ValorantMatchList { history?: ValorantMatchListItem[] }

interface ValorantPlayer {
  puuid: string;
  teamId: string;
  characterId: string;
  stats?: { kills?: number; deaths?: number; assists?: number; score?: number };
}

interface ValorantTeam {
  teamId: string;
  won?: boolean;
  roundsWon?: number;
  roundsPlayed?: number;
}

interface ValorantMatchResponse {
  matchInfo?: { mapId?: string; gameStartMillis?: number };
  players?: ValorantPlayer[];
  teams?: ValorantTeam[];
}

// ===== HELPERS =====

class RiotApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "RiotApiError";
  }
}

async function riotFetch<T>(url: string, headers: Record<string, string>): Promise<T> {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const body = await res.text();
    throw new RiotApiError(res.status, `Riot API [${res.status}]: ${body}`);
  }
  return res.json() as Promise<T>;
}

async function getChampionMap(): Promise<Record<number, string>> {
  try {
    const versions = await riotFetch<string[]>(
      "https://ddragon.leagueoflegends.com/api/versions.json",
      {}
    );
    const champData = await riotFetch<{ data: Record<string, DataDragonChampion> }>(
      `https://ddragon.leagueoflegends.com/cdn/${versions[0]}/data/en_US/champion.json`,
      {}
    );
    return Object.fromEntries(Object.values(champData.data).map((c) => [parseInt(c.key), c.id]));
  } catch (e) {
    console.error("Failed to fetch Data Dragon champion data:", e);
    return {};
  }
}

function mapLolMatch(p: LolParticipant, match: LolMatchResponse, matchId: string) {
  return {
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
  };
}

async function fetchLolMatches(
  continent: string, puuid: string, count: number, headers: Record<string, string>
) {
  const matchIds = await riotFetch<string[]>(
    `https://${continent}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?count=${count}`,
    headers
  );

  const results: ReturnType<typeof mapLolMatch>[] = [];
  for (const matchId of matchIds) {
    try {
      const match = await riotFetch<LolMatchResponse>(
        `https://${continent}.api.riotgames.com/lol/match/v5/matches/${matchId}`,
        headers
      );
      const p = match.info.participants.find((pt) => pt.puuid === puuid);
      if (p) results.push(mapLolMatch(p, match, matchId));
    } catch { /* skip failed individual matches */ }
  }
  return results;
}

async function fetchValorantMatches(
  continent: string, puuid: string, count: number, headers: Record<string, string>
) {
  const matchList = await riotFetch<ValorantMatchList>(
    `https://${continent}.api.riotgames.com/val/match/v1/matchlists/by-puuid/${puuid}`,
    headers
  );
  const matchIds = (matchList.history ?? []).slice(0, count).map((m) => m.matchId);

  const results: Array<{
    matchId: string; map?: string; agent: string; win: boolean;
    kills: number; deaths: number; assists: number; score: number;
    roundsWon: number; roundsLost: number; date: string;
  }> = [];

  for (const matchId of matchIds) {
    try {
      const match = await riotFetch<ValorantMatchResponse>(
        `https://${continent}.api.riotgames.com/val/match/v1/matches/${matchId}`,
        headers
      );
      const player = match.players?.find((pl) => pl.puuid === puuid);
      if (player) {
        const team = match.teams?.find((t) => t.teamId === player.teamId);
        results.push({
          matchId,
          map: match.matchInfo?.mapId,
          agent: player.characterId,
          win: team?.won ?? false,
          kills: player.stats?.kills ?? 0,
          deaths: player.stats?.deaths ?? 0,
          assists: player.stats?.assists ?? 0,
          score: player.stats?.score ?? 0,
          roundsWon: team?.roundsWon ?? 0,
          roundsLost: team?.roundsPlayed ? team.roundsPlayed - (team.roundsWon ?? 0) : 0,
          date: new Date(match.matchInfo?.gameStartMillis ?? 0).toISOString(),
        });
      }
    } catch { /* skip failed individual matches */ }
  }
  return results;
}

// ===== PROFILE HANDLERS =====

async function handleLolProfile(
  region: string, continent: string, puuid: string, count: number, headers: Record<string, string>
) {
  const summonerRes = await fetch(
    `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,
    { headers }
  );

  let summoner = null;
  if (summonerRes.ok) {
    const s: RiotSummoner = await summonerRes.json();
    const rankedRes = await fetch(
      `https://${region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${s.id}`,
      { headers }
    );
    const ranked = rankedRes.ok
      ? ((await rankedRes.json()) as RiotRankedEntry[]).map((r) => ({
          queueType: r.queueType,
          tier: r.tier,
          rank: r.rank,
          lp: r.leaguePoints,
          wins: r.wins,
          losses: r.losses,
          winRate: Math.round((r.wins / (r.wins + r.losses)) * 100),
        }))
      : [];

    summoner = {
      name: s.name,
      level: s.summonerLevel,
      profileIconId: s.profileIconId,
      profileIconUrl: `https://ddragon.leagueoflegends.com/cdn/14.10.1/img/profileicon/${s.profileIconId}.png`,
      ranked,
    };
  }

  const [championMap, masteryRes, recentMatches] = await Promise.all([
    getChampionMap(),
    fetch(
      `https://${region}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/top?count=5`,
      { headers }
    ),
    fetchLolMatches(continent, puuid, count, headers),
  ]);

  const topChampions = masteryRes.ok
    ? ((await masteryRes.json()) as ChampionMastery[]).map((m) => ({
        championId: m.championId,
        championName: championMap[m.championId] ?? "Unknown",
        championLevel: m.championLevel,
        championPoints: m.championPoints,
        lastPlayTime: new Date(m.lastPlayTime).toISOString(),
      }))
    : [];

  return { summoner, topChampions, recentMatches };
}

async function handleValorantProfile(
  continent: string, puuid: string, count: number, headers: Record<string, string>
) {
  const recentMatches = await fetchValorantMatches(continent, puuid, count, headers);

  const agentStats: Record<string, {
    wins: number; losses: number; kills: number; deaths: number; assists: number; games: number;
  }> = {};

  for (const m of recentMatches) {
    if (!agentStats[m.agent]) {
      agentStats[m.agent] = { wins: 0, losses: 0, kills: 0, deaths: 0, assists: 0, games: 0 };
    }
    const s = agentStats[m.agent];
    s.games++;
    s.kills += m.kills;
    s.deaths += m.deaths;
    s.assists += m.assists;
    if (m.win) s.wins++; else s.losses++;
  }

  const topAgents = Object.entries(agentStats)
    .map(([agentId, stats]) => ({
      agentId, ...stats,
      winRate: Math.round((stats.wins / stats.games) * 100),
    }))
    .sort((a, b) => b.games - a.games);

  return { recentMatches, topAgents };
}

// ===== ENTRY POINT =====

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

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

    const account = await riotFetch<RiotAccount>(
      `https://${continent}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
      headers
    );
    const { puuid } = account;

    if (action === "profile") {
      if (game === "lol") {
        const data = await handleLolProfile(region, continent, puuid, count, headers);
        return json({ game: "lol", puuid, gameName, tagLine, ...data });
      }
      if (game === "valorant") {
        const data = await handleValorantProfile(continent, puuid, count, headers);
        return json({ game: "valorant", puuid, gameName, tagLine, ...data });
      }
    }

    if (action === "matches") {
      if (game === "lol") {
        const matches = await fetchLolMatches(continent, puuid, count, headers);
        return json({ matches, puuid, gameName, tagLine });
      }
      if (game === "valorant") {
        const matches = await fetchValorantMatches(continent, puuid, count, headers);
        return json({ matches, puuid, gameName, tagLine });
      }
    }

    return json({ error: "Invalid game" }, 400);
  } catch (error) {
    console.error("Riot API error:", error);
    const status = error instanceof RiotApiError ? error.status : 500;
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, status);
  }
});

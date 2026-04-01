import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface LolMatch {
  matchId: string;
  gameMode: string;
  champion: string;
  championId: number;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  visionScore: number;
  goldEarned: number;
  damage: number;
  duration: number;
  date: string;
  items: number[];
}

interface ValorantMatch {
  matchId: string;
  map: string;
  agent: string;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  score: number;
  roundsWon: number;
  roundsLost: number;
  date: string;
}

interface ChampionMastery {
  championId: number;
  championLevel: number;
  championPoints: number;
  lastPlayTime: string;
}

interface RankedEntry {
  queueType: string;
  tier: string;
  rank: string;
  lp: number;
  wins: number;
  losses: number;
  winRate: number;
}

interface Summoner {
  name: string;
  level: number;
  profileIconId: number;
  profileIconUrl: string;
  ranked?: RankedEntry[];
}

interface ValorantAgent {
  agentId: string;
  wins: number;
  losses: number;
  kills: number;
  deaths: number;
  assists: number;
  games: number;
  winRate: number;
}

interface LolProfileResponse {
  game: "lol";
  puuid: string;
  gameName: string;
  tagLine: string;
  summoner: Summoner | null;
  topChampions: ChampionMastery[];
  recentMatches: LolMatch[];
}

interface ValorantProfileResponse {
  game: "valorant";
  puuid: string;
  gameName: string;
  tagLine: string;
  recentMatches: ValorantMatch[];
  topAgents: ValorantAgent[];
}

type RiotProfileResponse = LolProfileResponse | ValorantProfileResponse;

const fetchRiotProfile = async (
  game: "lol" | "valorant",
  riotId: string,
  region = "br1",
  count = 10
): Promise<RiotProfileResponse> => {
  const { data: { session } } = await supabase.auth.getSession();

  const projectUrl = import.meta.env.VITE_SUPABASE_URL;
  const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const url = `${projectUrl}/functions/v1/riot-matches?action=profile&game=${game}&riotId=${encodeURIComponent(riotId)}&region=${region}&count=${count}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${session?.access_token ?? ""}`,
      apikey: apiKey,
    },
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Falha ao buscar perfil Riot");
  }

  return response.json();
};

export const useRiotProfile = (
  game: "lol" | "valorant",
  riotId: string | null | undefined,
  region = "br1",
  count = 10
) => {
  return useQuery<RiotProfileResponse>({
    queryKey: ["riot-profile", game, riotId, region, count],
    queryFn: () => fetchRiotProfile(game, riotId!, region, count),
    enabled: !!riotId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};

export const useRiotMatches = (
  game: "lol" | "valorant",
  riotId: string | null | undefined,
  region = "br1",
  count = 5
) => {
  return useQuery({
    queryKey: ["riot-matches", game, riotId, region, count],
    queryFn: async () => {
      const projectUrl = import.meta.env.VITE_SUPABASE_URL;
      const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const { data: { session } } = await supabase.auth.getSession();

      const url = `${projectUrl}/functions/v1/riot-matches?action=matches&game=${game}&riotId=${encodeURIComponent(riotId!)}&region=${region}&count=${count}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session?.access_token ?? ""}`,
          apikey: apiKey,
        },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch matches");
      }
      return res.json();
    },
    enabled: !!riotId,
    staleTime: 5 * 60 * 1000,
  });
};

export type {
  LolMatch, ValorantMatch, ChampionMastery, RankedEntry,
  Summoner, ValorantAgent, LolProfileResponse, ValorantProfileResponse, RiotProfileResponse,
};

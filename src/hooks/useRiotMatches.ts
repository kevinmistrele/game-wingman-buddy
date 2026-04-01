import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface LolMatch {
  matchId: string;
  gameMode: string;
  champion: string;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  duration: number;
  date: string;
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
  rounds: number;
  date: string;
}

interface MatchHistoryResponse {
  matches: (LolMatch | ValorantMatch)[];
  puuid: string;
  gameName: string;
  tagLine: string;
}

export const useRiotMatches = (
  game: "lol" | "valorant",
  riotId: string | null | undefined,
  region = "na1",
  count = 5
) => {
  return useQuery<MatchHistoryResponse>({
    queryKey: ["riot-matches", game, riotId, region, count],
    queryFn: async () => {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const url = `https://${projectId}.supabase.co/functions/v1/riot-matches?game=${game}&riotId=${encodeURIComponent(riotId!)}&region=${region}&count=${count}`;
      
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session?.access_token ?? ""}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
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

export type { LolMatch, ValorantMatch, MatchHistoryResponse };

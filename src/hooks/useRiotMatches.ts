import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { LolProfileResponse } from "@/types/riot";

async function fetchRiotProfile(
  game: "lol",
  riotId: string,
  region = "br1",
  count = 10,
): Promise<LolProfileResponse> {
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
    const err = await response.json().catch(() => ({}));
    const msg = typeof err.error === "string" ? err.error : "Falha ao buscar perfil Riot";
    const error = new Error(msg) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export function useRiotProfile(
  game: "lol",
  riotId: string | null | undefined,
  region = "br1",
  count = 10,
) {
  return useQuery<LolProfileResponse>({
    queryKey: ["riot-profile", game, riotId, region, count],
    queryFn: () => fetchRiotProfile(game, riotId!, region, count),
    enabled: !!riotId,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      const status = (error as Error & { status?: number })?.status;
      if (status === 404 || status === 400) return false;
      return failureCount < 1;
    },
  });
}

export function useRiotMatches(
  game: "lol",
  riotId: string | null | undefined,
  region = "br1",
  count = 5,
) {
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
        throw new Error(err.error || "Falha ao buscar partidas");
      }
      return res.json();
    },
    enabled: !!riotId,
    staleTime: 5 * 60 * 1000,
  });
}

export type { LolMatch, ChampionMastery, RankedEntry, Summoner, LolProfileResponse } from "@/types/riot";

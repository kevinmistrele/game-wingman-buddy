import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import type { ProfileRank, ResolvedRank } from "@/types/riot";

export async function resolveProfileRank(profile: Tables<"profiles">): Promise<ProfileRank> {
  if (profile.riot_id) {
    try {
      const projectUrl = import.meta.env.VITE_SUPABASE_URL;
      const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch(
        `${projectUrl}/functions/v1/riot-matches?action=profile&game=lol&riotId=${encodeURIComponent(profile.riot_id)}&region=br1&count=1`,
        { headers: { Authorization: `Bearer ${session?.access_token ?? ""}`, apikey: apiKey } }
      );

      if (res.ok) {
        const data = await res.json();
        if (data.summoner?.ranked) {
          const rank: ResolvedRank =
            data.summoner.ranked.find((r: ResolvedRank) => r.queueType === "RANKED_SOLO_5x5") ??
            data.summoner.ranked.find((r: ResolvedRank) => r.queueType === "RANKED_FLEX_SR") ??
            null;
          if (rank) return { rank, source: "riot" };
        }
      }
    } catch { /* fall through to manual rank */ }
  }

  const tier = profile.rank_tier ?? null;
  const division = profile.rank_division ?? null;
  if (tier) return { rank: { tier, rank: division ?? "IV", lp: 0, winRate: 0 }, source: "manual" };

  return { rank: null, source: null };
}

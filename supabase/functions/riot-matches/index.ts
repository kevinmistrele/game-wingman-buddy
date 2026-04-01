import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "@supabase/supabase-js/cors";
import { z } from "npm:zod@3.25.76";

const RIOT_REGIONS: Record<string, string> = {
  na1: "americas",
  br1: "americas",
  la1: "americas",
  la2: "americas",
  euw1: "europe",
  eun1: "europe",
  tr1: "europe",
  ru: "europe",
  kr: "asia",
  jp1: "asia",
  oc1: "sea",
  ph2: "sea",
  sg2: "sea",
  th2: "sea",
  tw2: "sea",
  vn2: "sea",
};

const QuerySchema = z.object({
  game: z.enum(["lol", "valorant"]),
  riotId: z.string().min(1),
  region: z.string().default("na1"),
  count: z.coerce.number().min(1).max(20).default(5),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const RIOT_API_KEY = Deno.env.get("RIOT_API_KEY");
  if (!RIOT_API_KEY) {
    return new Response(JSON.stringify({ error: "RIOT_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      game: url.searchParams.get("game"),
      riotId: url.searchParams.get("riotId"),
      region: url.searchParams.get("region") ?? "na1",
      count: url.searchParams.get("count") ?? "5",
    });

    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { game, riotId, region, count } = parsed.data;
    const [gameName, tagLine] = riotId.split("#");
    if (!gameName || !tagLine) {
      return new Response(JSON.stringify({ error: "Invalid Riot ID format. Use Name#TAG" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const continent = RIOT_REGIONS[region] ?? "americas";
    const headers = { "X-Riot-Token": RIOT_API_KEY };

    // Get PUUID from Riot ID
    const accountRes = await fetch(
      `https://${continent}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
      { headers }
    );

    if (!accountRes.ok) {
      const body = await accountRes.text();
      return new Response(JSON.stringify({ error: `Account lookup failed [${accountRes.status}]: ${body}` }), {
        status: accountRes.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const account = await accountRes.json();
    const puuid = account.puuid;

    if (game === "lol") {
      // Get match IDs
      const matchIdsRes = await fetch(
        `https://${continent}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?count=${count}`,
        { headers }
      );
      if (!matchIdsRes.ok) {
        return new Response(JSON.stringify({ error: `Match history failed [${matchIdsRes.status}]` }), {
          status: matchIdsRes.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const matchIds: string[] = await matchIdsRes.json();

      // Fetch match details (respect rate limits - sequential)
      const matches = [];
      for (const matchId of matchIds) {
        const matchRes = await fetch(
          `https://${continent}.api.riotgames.com/lol/match/v5/matches/${matchId}`,
          { headers }
        );
        if (matchRes.ok) {
          const match = await matchRes.json();
          const participant = match.info.participants.find((p: any) => p.puuid === puuid);
          if (participant) {
            matches.push({
              matchId,
              gameMode: match.info.gameMode,
              champion: participant.championName,
              win: participant.win,
              kills: participant.kills,
              deaths: participant.deaths,
              assists: participant.assists,
              cs: participant.totalMinionsKilled + participant.neutralMinionsKilled,
              duration: match.info.gameDuration,
              date: new Date(match.info.gameCreation).toISOString(),
            });
          }
        }
      }

      return new Response(JSON.stringify({ matches, puuid, gameName, tagLine }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (game === "valorant") {
      // Get Valorant match history
      const matchIdsRes = await fetch(
        `https://${continent}.api.riotgames.com/val/match/v1/matchlists/by-puuid/${puuid}`,
        { headers }
      );
      if (!matchIdsRes.ok) {
        return new Response(JSON.stringify({ error: `Valorant match history failed [${matchIdsRes.status}]` }), {
          status: matchIdsRes.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const matchList = await matchIdsRes.json();
      const matchIds = (matchList.history || []).slice(0, count).map((m: any) => m.matchId);

      const matches = [];
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
            matches.push({
              matchId,
              map: match.matchInfo?.mapId,
              agent: player.characterId,
              win: team?.won ?? false,
              kills: player.stats?.kills ?? 0,
              deaths: player.stats?.deaths ?? 0,
              assists: player.stats?.assists ?? 0,
              score: player.stats?.score ?? 0,
              rounds: (match.teams?.[0]?.roundsWon ?? 0) + (match.teams?.[0]?.roundsPlayed ?? 0),
              date: new Date(match.matchInfo?.gameStartMillis ?? 0).toISOString(),
            });
          }
        }
      }

      return new Response(JSON.stringify({ matches, puuid, gameName, tagLine }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid game" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Riot API error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import type { Tables } from "@/integrations/supabase/types";

export interface LolMatch {
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

export interface ChampionMastery {
  championId: number;
  championName: string;
  championLevel: number;
  championPoints: number;
  lastPlayTime: string;
}

export interface RankedEntry {
  queueType: string;
  tier: string;
  rank: string;
  lp: number;
  wins: number;
  losses: number;
  winRate: number;
}

export interface Summoner {
  name: string;
  level: number;
  profileIconId: number;
  profileIconUrl: string;
  ranked?: RankedEntry[];
}

export interface LolProfileResponse {
  game: "lol";
  puuid: string;
  gameName: string;
  tagLine: string;
  summoner: Summoner | null;
  topChampions: ChampionMastery[];
  recentMatches: LolMatch[];
}

export type RankSource = "riot" | "manual";

export interface ResolvedRank {
  tier: string;
  rank: string;
  lp: number;
  winRate: number;
}

export interface ProfileRank {
  rank: ResolvedRank | null;
  source: RankSource | null;
}

export type Profile = Tables<"profiles">;

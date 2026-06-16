import type { LolMatch } from "@/hooks/useRiotMatches";

interface LolMatchSummary {
  totalMatches: number;
  wins: number;
  losses: number;
  avgKills: string;
  avgDeaths: string;
  avgAssists: string;
  avgCsPerMin: string;
  avgDamage: number;
  avgGold: number;
  avgVision: string;
  avgKda: string;
  bestKda: number;
  maxDamage: number;
  maxCs: number;
  currentStreak: number;
  streakType: "win" | "loss";
}

export function formatCompactNumber(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return Math.round(value).toString();
}

export function getLolMatchSummary(matches: LolMatch[]): LolMatchSummary {
  const totalMatches = matches.length;
  const wins = matches.filter((match) => match.win).length;
  const losses = totalMatches - wins;
  const average = (getValue: (match: LolMatch) => number) =>
    totalMatches ? matches.reduce((sum, match) => sum + getValue(match), 0) / totalMatches : 0;
  const getKda = (match: LolMatch) =>
    match.deaths === 0 ? match.kills + match.assists : (match.kills + match.assists) / match.deaths;
  const streakType: "win" | "loss" = matches[0]?.win ? "win" : "loss";
  let currentStreak = 0;

  for (const match of matches) {
    if ((streakType === "win" && match.win) || (streakType === "loss" && !match.win)) currentStreak++;
    else break;
  }

  return {
    totalMatches,
    wins,
    losses,
    avgKills: average((match) => match.kills).toFixed(1),
    avgDeaths: average((match) => match.deaths).toFixed(1),
    avgAssists: average((match) => match.assists).toFixed(1),
    avgCsPerMin: totalMatches
      ? average((match) => (match.duration > 0 ? match.cs / (match.duration / 60) : 0)).toFixed(1)
      : "0",
    avgDamage: average((match) => match.damage),
    avgGold: average((match) => match.goldEarned),
    avgVision: average((match) => match.visionScore).toFixed(1),
    avgKda: average(getKda).toFixed(2),
    bestKda: totalMatches ? Math.max(...matches.map(getKda)) : 0,
    maxDamage: totalMatches ? Math.max(...matches.map((match) => match.damage)) : 0,
    maxCs: totalMatches ? Math.max(...matches.map((match) => match.cs)) : 0,
    currentStreak,
    streakType,
  };
}

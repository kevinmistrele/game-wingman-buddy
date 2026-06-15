import type { Tables } from "@/integrations/supabase/types";
import type { QueueMode, Role } from "@/lib/eloUtils";
import type { ResolvedRank, RankSource } from "@/types/riot";

export type Match = Tables<"matches">;
export type MatchmakingQueueEntry = Tables<"matchmaking_queue">;

export type QueueStatus = "idle" | "searching" | "found";
export type SearchPhase = "strict" | "expanded";

export interface MatchedPlayerInfo {
  profile: Tables<"profiles">;
  rank: ResolvedRank | null;
  rankSource?: RankSource;
  myRole?: string | null;
}

export interface QueueOptions {
  mode: QueueMode;
  myRole?: Role | null;
  desiredDuoRole?: Role | null;
}

export interface MyRankInfo {
  rank: ResolvedRank | null;
  source: RankSource | null;
}

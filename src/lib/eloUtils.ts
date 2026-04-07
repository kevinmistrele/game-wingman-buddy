// Elo tier system and matchmaking rules based on Riot's official Solo/Duo restrictions

export const TIERS = [
  "IRON", "BRONZE", "SILVER", "GOLD", "PLATINUM",
  "EMERALD", "DIAMOND", "MASTER", "GRANDMASTER", "CHALLENGER",
] as const;

export type Tier = typeof TIERS[number];

export const DIVISIONS = ["IV", "III", "II", "I"] as const;
export type Division = typeof DIVISIONS[number];

export const TIER_INDEX: Record<string, number> = {};
TIERS.forEach((t, i) => { TIER_INDEX[t] = i; });

export const DIVISION_INDEX: Record<string, number> = {
  IV: 0, III: 1, II: 2, I: 3,
};

export const TIER_LABELS: Record<string, string> = {
  IRON: "Ferro",
  BRONZE: "Bronze",
  SILVER: "Prata",
  GOLD: "Ouro",
  PLATINUM: "Platina",
  EMERALD: "Esmeralda",
  DIAMOND: "Diamante",
  MASTER: "Mestre",
  GRANDMASTER: "Grão-Mestre",
  CHALLENGER: "Desafiante",
};

/** Returns an absolute rank value for comparison. Higher = better. */
export const getRankValue = (tier: string, division: string): number => {
  const ti = TIER_INDEX[tier] ?? 0;
  const di = DIVISION_INDEX[division] ?? 0;
  return ti * 4 + di;
};

/**
 * Check if two players can queue together in Solo/Duo based on Riot's rules.
 */
export const canQueueSoloDuo = (
  tier1: string, div1: string,
  tier2: string, div2: string,
): boolean => {
  // Master, Grandmaster, Challenger cannot duo
  const highTiers = ["MASTER", "GRANDMASTER", "CHALLENGER"];
  if (highTiers.includes(tier1) || highTiers.includes(tier2)) return false;

  // Diamond: only within 2 divisions of each other
  if (tier1 === "DIAMOND" && tier2 === "DIAMOND") {
    return Math.abs(DIVISION_INDEX[div1] - DIVISION_INDEX[div2]) <= 2;
  }
  if (tier1 === "DIAMOND" || tier2 === "DIAMOND") {
    // Diamond can only play with other Diamond players
    return false;
  }

  // Iron to Emerald: can play with 1 tier above or below
  const tierDiff = Math.abs(TIER_INDEX[tier1] - TIER_INDEX[tier2]);
  return tierDiff <= 1;
};

/**
 * Check if two players can be matched in the matchmaking queue.
 * Mode determines the rules applied.
 */
export const canMatch = (
  mode: string,
  rank1: { tier: string; rank: string } | null,
  rank2: { tier: string; rank: string } | null,
): boolean => {
  // ARAM and Normal: no rank restrictions
  if (mode === "aram" || mode === "normal") return true;

  // Ranked modes require both players to have a rank
  if (!rank1 || !rank2) return false;

  if (mode === "solo_duo") {
    return canQueueSoloDuo(rank1.tier, rank1.rank, rank2.tier, rank2.rank);
  }

  if (mode === "flex") {
    // Flex: more permissive, allow up to 2 tiers apart
    const tierDiff = Math.abs(TIER_INDEX[rank1.tier] - TIER_INDEX[rank2.tier]);
    return tierDiff <= 2;
  }

  return true;
};

export const QUEUE_MODES = [
  { value: "aram", label: "ARAM", description: "Sem restrição de elo", ranked: false },
  { value: "normal", label: "Normal Game", description: "Sem restrição de elo", ranked: false },
  { value: "solo_duo", label: "Solo/Duo", description: "Baseado no seu elo", ranked: true },
  { value: "flex", label: "Flex", description: "Regras mais flexíveis", ranked: true },
] as const;

export type QueueMode = typeof QUEUE_MODES[number]["value"];

export const ROLES = [
  { value: "top", label: "Top" },
  { value: "jungle", label: "Jungle" },
  { value: "mid", label: "Mid" },
  { value: "adc", label: "ADC" },
  { value: "support", label: "Suporte" },
] as const;

export type Role = typeof ROLES[number]["value"];

/**
 * Check role compatibility between two players.
 * Returns false if there's a conflict, true if compatible.
 * Only used in ranked modes during "strict" phase.
 */
export const areRolesCompatible = (
  playerMyRole: string | null,
  playerDesiredRole: string | null,
  opponentMyRole: string | null,
  opponentDesiredRole: string | null,
): boolean => {
  // Same role conflict: both play same role and at least one specified a desired duo role
  const sameRoleConflict =
    playerMyRole && opponentMyRole
    && playerMyRole === opponentMyRole
    && (playerDesiredRole || opponentDesiredRole);
  if (sameRoleConflict) return false;

  // Bidirectional compatibility
  const rolesOk =
    (!playerDesiredRole || opponentMyRole === playerDesiredRole)
    && (!opponentDesiredRole || playerMyRole === opponentDesiredRole);
  return rolesOk;
};

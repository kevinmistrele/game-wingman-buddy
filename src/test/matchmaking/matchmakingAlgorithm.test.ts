/**
 * Tests for the server-side matchmaking decision algorithm.
 *
 * These tests replicate the logic of attempt_matchmaking() (the Postgres
 * SECURITY DEFINER function) in pure TypeScript so the rules can be validated
 * without a live database. Any change to the Postgres function should also be
 * reflected here and vice-versa.
 */

import { describe, it, expect } from "vitest";
import { canMatch, areRolesCompatible } from "@/lib/eloUtils";

// ─── Helpers that mirror the Postgres matching function ───────────────────────

type QueueEntry = {
  id: string;
  user_id: string;
  game: string;
  mode: string;
  status: "waiting" | "matched" | "cancelled";
  rank_tier: string | null;
  rank_division: string | null;
  my_role: string | null;
  desired_duo_role: string | null;
  created_at: Date;
};

const QUEUE_TTL_MS = 2 * 60 * 1000;

function getSearchPhase(entryA: QueueEntry, entryB: QueueEntry, now = new Date()): "strict" | "expanded" {
  const aWaited = now.getTime() - entryA.created_at.getTime();
  const bWaited = now.getTime() - entryB.created_at.getTime();
  return aWaited > 30_000 || bWaited > 30_000 ? "expanded" : "strict";
}

function canPair(entryA: QueueEntry, entryB: QueueEntry, now = new Date()): boolean {
  if (entryA.game !== entryB.game) return false;
  if (entryA.mode !== entryB.mode) return false;
  if (entryA.user_id === entryB.user_id) return false;
  if (entryA.status !== "waiting" || entryB.status !== "waiting") return false;

  const age = (e: QueueEntry) => now.getTime() - e.created_at.getTime();
  if (age(entryA) > QUEUE_TTL_MS || age(entryB) > QUEUE_TTL_MS) return false;

  const ranked = entryA.mode === "solo_duo" || entryA.mode === "flex";
  if (ranked) {
    if (!canMatch(entryA.mode, { tier: entryA.rank_tier!, rank: entryA.rank_division! },
                               { tier: entryB.rank_tier!, rank: entryB.rank_division! })) return false;
  }

  const phase = getSearchPhase(entryA, entryB, now);
  if (phase === "strict" && ranked) {
    if (!areRolesCompatible(entryA.my_role, entryA.desired_duo_role, entryB.my_role, entryB.desired_duo_role)) return false;
  }

  return true;
}

// ─── Factory ──────────────────────────────────────────────────────────────────

let idCounter = 1;
function makeEntry(overrides: Partial<QueueEntry> = {}): QueueEntry {
  return {
    id: `entry-${idCounter++}`,
    user_id: `user-${idCounter++}`,
    game: "lol",
    mode: "normal",
    status: "waiting",
    rank_tier: null,
    rank_division: null,
    my_role: null,
    desired_duo_role: null,
    created_at: new Date(),
    ...overrides,
  };
}

// ─── Mode and game gating ────────────────────────────────────────────────────

describe("mode and game gating", () => {
  it("different modes are never paired", () => {
    const a = makeEntry({ mode: "aram" });
    const b = makeEntry({ mode: "normal" });
    expect(canPair(a, b)).toBe(false);
  });

  it("different games are never paired", () => {
    const a = makeEntry({ game: "lol" });
    const b = makeEntry({ game: "valorant" });
    expect(canPair(a, b)).toBe(false);
  });

  it("same user cannot be paired with themselves", () => {
    const a = makeEntry({ user_id: "user-same" });
    const b = makeEntry({ user_id: "user-same" });
    expect(canPair(a, b)).toBe(false);
  });

  it("cancelled entries are skipped", () => {
    const a = makeEntry({ mode: "aram" });
    const b = makeEntry({ mode: "aram", status: "cancelled" });
    expect(canPair(a, b)).toBe(false);
  });

  it("expired entries (> 2 minutes) are skipped", () => {
    const old = new Date(Date.now() - 3 * 60 * 1000);
    const a = makeEntry({ mode: "aram", created_at: old });
    const b = makeEntry({ mode: "aram" });
    expect(canPair(a, b)).toBe(false);
  });
});

// ─── ARAM / Normal matching ───────────────────────────────────────────────────

describe("ARAM / Normal mode (no rank restrictions)", () => {
  it("two waiting players in the same mode match immediately", () => {
    const a = makeEntry({ mode: "aram" });
    const b = makeEntry({ mode: "aram" });
    expect(canPair(a, b)).toBe(true);
  });

  it("rank is irrelevant for ARAM", () => {
    const a = makeEntry({ mode: "aram", rank_tier: "IRON", rank_division: "IV" });
    const b = makeEntry({ mode: "aram", rank_tier: "CHALLENGER", rank_division: "I" });
    expect(canPair(a, b)).toBe(true);
  });

  it("rank is irrelevant for Normal", () => {
    const a = makeEntry({ mode: "normal", rank_tier: "BRONZE", rank_division: "III" });
    const b = makeEntry({ mode: "normal", rank_tier: "MASTER", rank_division: "I" });
    expect(canPair(a, b)).toBe(true);
  });
});

// ─── Solo/Duo ranked matching ─────────────────────────────────────────────────

describe("Solo/Duo mode", () => {
  it("compatible ranks within 1 tier can pair", () => {
    const a = makeEntry({ mode: "solo_duo", rank_tier: "GOLD", rank_division: "I" });
    const b = makeEntry({ mode: "solo_duo", rank_tier: "PLATINUM", rank_division: "IV" });
    expect(canPair(a, b)).toBe(true);
  });

  it("ranks more than 1 tier apart cannot pair", () => {
    const a = makeEntry({ mode: "solo_duo", rank_tier: "GOLD", rank_division: "I" });
    const b = makeEntry({ mode: "solo_duo", rank_tier: "DIAMOND", rank_division: "IV" });
    expect(canPair(a, b)).toBe(false);
  });

  it("entries without rank cannot pair in ranked mode", () => {
    const a = makeEntry({ mode: "solo_duo", rank_tier: null });
    const b = makeEntry({ mode: "solo_duo", rank_tier: "GOLD", rank_division: "I" });
    expect(canPair(a, b)).toBe(false);
  });

  it("MASTER cannot pair in solo_duo", () => {
    const a = makeEntry({ mode: "solo_duo", rank_tier: "MASTER", rank_division: "I" });
    const b = makeEntry({ mode: "solo_duo", rank_tier: "DIAMOND", rank_division: "I" });
    expect(canPair(a, b)).toBe(false);
  });

  it("Diamond players with division gap <= 2 can pair", () => {
    const a = makeEntry({ mode: "solo_duo", rank_tier: "DIAMOND", rank_division: "II" });
    const b = makeEntry({ mode: "solo_duo", rank_tier: "DIAMOND", rank_division: "IV" });
    expect(canPair(a, b)).toBe(true);
  });

  it("Diamond I and Diamond IV (3 divisions) cannot pair", () => {
    const a = makeEntry({ mode: "solo_duo", rank_tier: "DIAMOND", rank_division: "I" });
    const b = makeEntry({ mode: "solo_duo", rank_tier: "DIAMOND", rank_division: "IV" });
    expect(canPair(a, b)).toBe(false);
  });
});

// ─── Flex mode ────────────────────────────────────────────────────────────────

describe("Flex mode", () => {
  it("allows up to 2 tiers apart", () => {
    const a = makeEntry({ mode: "flex", rank_tier: "SILVER", rank_division: "I" });
    const b = makeEntry({ mode: "flex", rank_tier: "PLATINUM", rank_division: "IV" });
    expect(canPair(a, b)).toBe(true);
  });

  it("blocks more than 2 tiers apart", () => {
    const a = makeEntry({ mode: "flex", rank_tier: "IRON", rank_division: "I" });
    const b = makeEntry({ mode: "flex", rank_tier: "GOLD", rank_division: "IV" });
    expect(canPair(a, b)).toBe(false);
  });

  it("is more permissive than solo_duo for Diamond vs Emerald", () => {
    const a = makeEntry({ mode: "flex", rank_tier: "DIAMOND", rank_division: "IV" });
    const b = makeEntry({ mode: "flex", rank_tier: "EMERALD", rank_division: "I" });
    expect(canPair(a, b)).toBe(true);
  });
});

// ─── Role compatibility in strict vs expanded phases ─────────────────────────

describe("role compatibility (strict phase, ranked)", () => {
  it("conflicting roles block the match in strict phase", () => {
    const now = new Date(); // both just joined → strict
    const a = makeEntry({ mode: "solo_duo", rank_tier: "GOLD", rank_division: "I", my_role: "mid", desired_duo_role: "support" });
    const b = makeEntry({ mode: "solo_duo", rank_tier: "GOLD", rank_division: "I", my_role: "adc", desired_duo_role: null });
    expect(canPair(a, b, now)).toBe(false);
  });

  it("compatible roles allow the match in strict phase", () => {
    const now = new Date();
    const a = makeEntry({ mode: "solo_duo", rank_tier: "GOLD", rank_division: "I", my_role: "mid", desired_duo_role: "support" });
    const b = makeEntry({ mode: "solo_duo", rank_tier: "GOLD", rank_division: "I", my_role: "support", desired_duo_role: null });
    expect(canPair(a, b, now)).toBe(true);
  });

  it("role conflict is ignored in expanded phase (one player waited > 30s)", () => {
    const thirtyOneSec = new Date(Date.now() - 31_000);
    const a = makeEntry({ mode: "solo_duo", rank_tier: "GOLD", rank_division: "I", my_role: "mid", desired_duo_role: "support", created_at: thirtyOneSec });
    const b = makeEntry({ mode: "solo_duo", rank_tier: "GOLD", rank_division: "I", my_role: "adc", desired_duo_role: null });
    expect(canPair(a, b)).toBe(true);
  });

  it("role conflict is ignored in expanded phase (the other player waited > 30s)", () => {
    const thirtyOneSec = new Date(Date.now() - 31_000);
    const a = makeEntry({ mode: "solo_duo", rank_tier: "GOLD", rank_division: "I", my_role: "mid", desired_duo_role: "support" });
    const b = makeEntry({ mode: "solo_duo", rank_tier: "GOLD", rank_division: "I", my_role: "adc", desired_duo_role: null, created_at: thirtyOneSec });
    expect(canPair(a, b)).toBe(true);
  });

  it("role checks do not apply in non-ranked modes", () => {
    const now = new Date();
    const a = makeEntry({ mode: "aram", my_role: "mid", desired_duo_role: "support" });
    const b = makeEntry({ mode: "aram", my_role: "adc", desired_duo_role: null });
    // aram is not ranked, so role preferences are irrelevant
    expect(canPair(a, b, now)).toBe(true);
  });
});

// ─── Search phase determination ────────────────────────────────────────────────

describe("getSearchPhase", () => {
  it("both players just joined → strict", () => {
    const a = makeEntry();
    const b = makeEntry();
    expect(getSearchPhase(a, b)).toBe("strict");
  });

  it("one player waited 31 seconds → expanded", () => {
    const old = new Date(Date.now() - 31_000);
    const a = makeEntry({ created_at: old });
    const b = makeEntry();
    expect(getSearchPhase(a, b)).toBe("expanded");
  });

  it("both players waited exactly 30 seconds → strict (boundary)", () => {
    const thirtyExact = new Date(Date.now() - 30_000);
    const a = makeEntry({ created_at: thirtyExact });
    const b = makeEntry({ created_at: thirtyExact });
    // 30000 > 30000 is false → still strict
    expect(getSearchPhase(a, b)).toBe("strict");
  });

  it("one player waited 30001 ms → expanded", () => {
    const justOver = new Date(Date.now() - 30_001);
    const a = makeEntry({ created_at: justOver });
    const b = makeEntry();
    expect(getSearchPhase(a, b)).toBe("expanded");
  });
});

// ─── End-to-end scenario tests ────────────────────────────────────────────────

describe("end-to-end matching scenarios", () => {
  it("Scenario: two ARAM players → immediate match", () => {
    const alice = makeEntry({ mode: "aram" });
    const bob   = makeEntry({ mode: "aram" });
    expect(canPair(alice, bob)).toBe(true);
  });

  it("Scenario: Gold mid (wants support) + Gold support → match", () => {
    const alice = makeEntry({ mode: "solo_duo", rank_tier: "GOLD", rank_division: "II", my_role: "mid",     desired_duo_role: "support" });
    const bob   = makeEntry({ mode: "solo_duo", rank_tier: "GOLD", rank_division: "I",  my_role: "support", desired_duo_role: null });
    expect(canPair(alice, bob)).toBe(true);
  });

  it("Scenario: Gold mid (wants support) + Gold adc → no match (strict phase)", () => {
    const alice = makeEntry({ mode: "solo_duo", rank_tier: "GOLD", rank_division: "II", my_role: "mid", desired_duo_role: "support" });
    const bob   = makeEntry({ mode: "solo_duo", rank_tier: "GOLD", rank_division: "I",  my_role: "adc", desired_duo_role: null });
    expect(canPair(alice, bob)).toBe(false);
  });

  it("Scenario: Gold mid (wants support) + Gold adc after 31s → match (expanded phase)", () => {
    const thirtyOneSec = new Date(Date.now() - 31_000);
    const alice = makeEntry({ mode: "solo_duo", rank_tier: "GOLD", rank_division: "II", my_role: "mid", desired_duo_role: "support", created_at: thirtyOneSec });
    const bob   = makeEntry({ mode: "solo_duo", rank_tier: "GOLD", rank_division: "I",  my_role: "adc", desired_duo_role: null });
    expect(canPair(alice, bob)).toBe(true);
  });

  it("Scenario: Diamond I + Diamond IV in Solo/Duo → no match (3 divisions)", () => {
    const alice = makeEntry({ mode: "solo_duo", rank_tier: "DIAMOND", rank_division: "I" });
    const bob   = makeEntry({ mode: "solo_duo", rank_tier: "DIAMOND", rank_division: "IV" });
    expect(canPair(alice, bob)).toBe(false);
  });

  it("Scenario: Diamond II + Diamond IV in Solo/Duo → match (2 divisions)", () => {
    const alice = makeEntry({ mode: "solo_duo", rank_tier: "DIAMOND", rank_division: "II" });
    const bob   = makeEntry({ mode: "solo_duo", rank_tier: "DIAMOND", rank_division: "IV" });
    expect(canPair(alice, bob)).toBe(true);
  });

  it("Scenario: Silver vs Emerald in Flex → no match (3 tiers apart)", () => {
    const alice = makeEntry({ mode: "flex", rank_tier: "SILVER", rank_division: "I" });
    const bob   = makeEntry({ mode: "flex", rank_tier: "EMERALD", rank_division: "IV" });
    expect(canPair(alice, bob)).toBe(false);
  });

  it("Scenario: player in wrong mode does not match", () => {
    const alice = makeEntry({ mode: "aram" });
    const bob   = makeEntry({ mode: "normal" });
    expect(canPair(alice, bob)).toBe(false);
  });

  it("Scenario: entry expires after 2 minutes and is skipped", () => {
    const expired = new Date(Date.now() - 2 * 60 * 1000 - 1);
    const alice   = makeEntry({ mode: "aram", created_at: expired });
    const bob     = makeEntry({ mode: "aram" });
    expect(canPair(alice, bob)).toBe(false);
  });
});

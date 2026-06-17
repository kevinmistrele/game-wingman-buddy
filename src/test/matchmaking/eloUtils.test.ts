import { describe, it, expect } from "vitest";
import {
  canQueueSoloDuo,
  canMatch,
  areRolesCompatible,
  getRankValue,
  TIER_INDEX,
  DIVISION_INDEX,
} from "@/lib/eloUtils";

// ─── getRankValue ────────────────────────────────────────────────────────────

describe("getRankValue", () => {
  it("returns higher value for higher tiers", () => {
    expect(getRankValue("GOLD", "I")).toBeGreaterThan(getRankValue("SILVER", "I"));
    expect(getRankValue("DIAMOND", "IV")).toBeGreaterThan(getRankValue("EMERALD", "I"));
  });

  it("returns higher value for higher divisions within the same tier", () => {
    expect(getRankValue("GOLD", "I")).toBeGreaterThan(getRankValue("GOLD", "IV"));
    expect(getRankValue("PLATINUM", "II")).toBeGreaterThan(getRankValue("PLATINUM", "III"));
  });

  it("IRON IV is the minimum", () => {
    expect(getRankValue("IRON", "IV")).toBe(0);
  });

  it("CHALLENGER I is the maximum among normal tiers", () => {
    const challenger = getRankValue("CHALLENGER", "I");
    const master = getRankValue("MASTER", "I");
    expect(challenger).toBeGreaterThan(master);
  });
});

// ─── canQueueSoloDuo ─────────────────────────────────────────────────────────

describe("canQueueSoloDuo", () => {
  describe("high-tier restrictions", () => {
    it("MASTER cannot duo", () => {
      expect(canQueueSoloDuo("MASTER", "I", "DIAMOND", "I")).toBe(false);
    });

    it("GRANDMASTER cannot duo", () => {
      expect(canQueueSoloDuo("GRANDMASTER", "I", "DIAMOND", "I")).toBe(false);
    });

    it("CHALLENGER cannot duo", () => {
      expect(canQueueSoloDuo("CHALLENGER", "I", "DIAMOND", "I")).toBe(false);
    });

    it("two MASTER players cannot duo each other", () => {
      expect(canQueueSoloDuo("MASTER", "I", "MASTER", "I")).toBe(false);
    });
  });

  describe("Diamond tier rules", () => {
    it("Diamond II can queue with Diamond IV (2 divisions apart)", () => {
      expect(canQueueSoloDuo("DIAMOND", "II", "DIAMOND", "IV")).toBe(true);
    });

    it("Diamond I can queue with Diamond III (2 divisions apart)", () => {
      expect(canQueueSoloDuo("DIAMOND", "I", "DIAMOND", "III")).toBe(true);
    });

    it("Diamond I cannot queue with Diamond IV (3 divisions apart)", () => {
      expect(canQueueSoloDuo("DIAMOND", "I", "DIAMOND", "IV")).toBe(false);
    });

    it("Diamond cannot queue with Emerald", () => {
      expect(canQueueSoloDuo("DIAMOND", "IV", "EMERALD", "I")).toBe(false);
    });

    it("Diamond cannot queue with Platinum", () => {
      expect(canQueueSoloDuo("DIAMOND", "IV", "PLATINUM", "I")).toBe(false);
    });
  });

  describe("Iron to Emerald rules (1 tier apart)", () => {
    it("Silver can queue with Gold", () => {
      expect(canQueueSoloDuo("SILVER", "I", "GOLD", "IV")).toBe(true);
    });

    it("Gold can queue with Platinum", () => {
      expect(canQueueSoloDuo("GOLD", "I", "PLATINUM", "IV")).toBe(true);
    });

    it("Platinum can queue with Emerald", () => {
      expect(canQueueSoloDuo("PLATINUM", "I", "EMERALD", "IV")).toBe(true);
    });

    it("Silver cannot queue with Platinum (2 tiers apart)", () => {
      expect(canQueueSoloDuo("SILVER", "I", "PLATINUM", "IV")).toBe(false);
    });

    it("Iron cannot queue with Bronze when 2 tiers apart", () => {
      // Iron=0, Bronze=1, diff=1 → allowed
      expect(canQueueSoloDuo("IRON", "I", "BRONZE", "IV")).toBe(true);
    });

    it("Iron cannot queue with Silver (2 tiers apart)", () => {
      expect(canQueueSoloDuo("IRON", "I", "SILVER", "IV")).toBe(false);
    });

    it("same tier is always allowed (0 tiers apart)", () => {
      expect(canQueueSoloDuo("GOLD", "I", "GOLD", "IV")).toBe(true);
      expect(canQueueSoloDuo("PLATINUM", "II", "PLATINUM", "I")).toBe(true);
    });
  });
});

// ─── canMatch ────────────────────────────────────────────────────────────────

describe("canMatch", () => {
  describe("ARAM mode", () => {
    it("always returns true regardless of rank", () => {
      expect(canMatch("aram", null, null)).toBe(true);
      expect(canMatch("aram", { tier: "IRON", rank: "IV" }, { tier: "CHALLENGER", rank: "I" })).toBe(true);
    });
  });

  describe("Normal mode", () => {
    it("always returns true regardless of rank", () => {
      expect(canMatch("normal", null, null)).toBe(true);
      expect(canMatch("normal", { tier: "BRONZE", rank: "II" }, { tier: "MASTER", rank: "I" })).toBe(true);
    });
  });

  describe("Solo/Duo mode", () => {
    it("returns false if either player has no rank", () => {
      expect(canMatch("solo_duo", null, { tier: "GOLD", rank: "I" })).toBe(false);
      expect(canMatch("solo_duo", { tier: "GOLD", rank: "I" }, null)).toBe(false);
      expect(canMatch("solo_duo", null, null)).toBe(false);
    });

    it("delegates to canQueueSoloDuo rules", () => {
      expect(canMatch("solo_duo", { tier: "GOLD", rank: "I" }, { tier: "PLATINUM", rank: "IV" })).toBe(true);
      expect(canMatch("solo_duo", { tier: "GOLD", rank: "I" }, { tier: "DIAMOND", rank: "IV" })).toBe(false);
      expect(canMatch("solo_duo", { tier: "MASTER", rank: "I" }, { tier: "DIAMOND", rank: "I" })).toBe(false);
    });
  });

  describe("Flex mode", () => {
    it("returns false if either player has no rank", () => {
      expect(canMatch("flex", null, { tier: "GOLD", rank: "I" })).toBe(false);
    });

    it("allows up to 2 tiers apart", () => {
      // IRON=0, GOLD=3 → diff=3 → false
      expect(canMatch("flex", { tier: "IRON", rank: "I" }, { tier: "GOLD", rank: "IV" })).toBe(false);
      // SILVER=2, GOLD=3 → diff=1 → true
      expect(canMatch("flex", { tier: "SILVER", rank: "I" }, { tier: "GOLD", rank: "IV" })).toBe(true);
      // SILVER=2, PLATINUM=4 → diff=2 → true
      expect(canMatch("flex", { tier: "SILVER", rank: "I" }, { tier: "PLATINUM", rank: "IV" })).toBe(true);
      // SILVER=2, EMERALD=5 → diff=3 → false
      expect(canMatch("flex", { tier: "SILVER", rank: "I" }, { tier: "EMERALD", rank: "IV" })).toBe(false);
    });

    it("is more permissive than solo_duo for Diamond", () => {
      // Flex allows Diamond vs Emerald (diff=1), solo_duo does not
      expect(canMatch("flex", { tier: "DIAMOND", rank: "IV" }, { tier: "EMERALD", rank: "I" })).toBe(true);
      expect(canMatch("solo_duo", { tier: "DIAMOND", rank: "IV" }, { tier: "EMERALD", rank: "I" })).toBe(false);
    });
  });
});

// ─── areRolesCompatible ──────────────────────────────────────────────────────

describe("areRolesCompatible", () => {
  describe("no preferences set", () => {
    it("null/null vs null/null is always compatible", () => {
      expect(areRolesCompatible(null, null, null, null)).toBe(true);
    });

    it("having a role without a desired duo is compatible with anyone", () => {
      expect(areRolesCompatible("mid", null, "mid", null)).toBe(true);
      expect(areRolesCompatible("top", null, "jungle", null)).toBe(true);
    });
  });

  describe("same role conflict", () => {
    it("two players with the same role are incompatible if one specified a desired duo", () => {
      expect(areRolesCompatible("mid", null, "mid", "support")).toBe(false);
      expect(areRolesCompatible("adc", "support", "adc", null)).toBe(false);
    });

    it("two players with the same role but no desired duo are compatible", () => {
      expect(areRolesCompatible("mid", null, "mid", null)).toBe(true);
    });
  });

  describe("desired duo role mismatch", () => {
    it("returns false when player 1 wants X but player 2 doesn't play X", () => {
      expect(areRolesCompatible("mid", "support", "adc", null)).toBe(false);
    });

    it("returns false when player 2 wants X but player 1 doesn't play X", () => {
      expect(areRolesCompatible("adc", null, "support", "mid")).toBe(false);
    });
  });

  describe("perfect role matches", () => {
    it("mid wanting support matches support wanting mid", () => {
      expect(areRolesCompatible("mid", "support", "support", "mid")).toBe(true);
    });

    it("top wanting jungle matches jungle wanting top", () => {
      expect(areRolesCompatible("top", "jungle", "jungle", "top")).toBe(true);
    });

    it("adc wanting support matches support with no preference", () => {
      expect(areRolesCompatible("adc", "support", "support", null)).toBe(true);
    });

    it("no preference matches support wanting no specific duo", () => {
      expect(areRolesCompatible("top", null, "support", null)).toBe(true);
    });
  });

  describe("one-sided preferences", () => {
    it("player specifying a desired role is satisfied when opponent plays that role", () => {
      expect(areRolesCompatible("jungle", "mid", "mid", null)).toBe(true);
    });

    it("player specifying a desired role is blocked when opponent plays a different role", () => {
      expect(areRolesCompatible("jungle", "mid", "top", null)).toBe(false);
    });
  });
});

// ─── TIER_INDEX / DIVISION_INDEX sanity checks ───────────────────────────────

describe("tier and division index ordering", () => {
  it("TIERS are ordered from weakest to strongest", () => {
    const tiers = ["IRON", "BRONZE", "SILVER", "GOLD", "PLATINUM", "EMERALD", "DIAMOND", "MASTER", "GRANDMASTER", "CHALLENGER"];
    for (let i = 1; i < tiers.length; i++) {
      expect(TIER_INDEX[tiers[i]]).toBeGreaterThan(TIER_INDEX[tiers[i - 1]]);
    }
  });

  it("DIVISIONS are ordered from weakest (IV) to strongest (I)", () => {
    expect(DIVISION_INDEX["I"]).toBeGreaterThan(DIVISION_INDEX["II"]);
    expect(DIVISION_INDEX["II"]).toBeGreaterThan(DIVISION_INDEX["III"]);
    expect(DIVISION_INDEX["III"]).toBeGreaterThan(DIVISION_INDEX["IV"]);
  });
});

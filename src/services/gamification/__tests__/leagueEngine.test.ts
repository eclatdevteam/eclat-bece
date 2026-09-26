import { describe, it, expect } from "vitest";
import {
  LEAGUE_TIERS,
  getLeagueTierConfig,
  getCohortZone,
  evaluateWeeklyLeaguePromotion,
  getWeeklyCohortWindow,
  PROMOTION_CUTOFF_RANK,
  RELEGATION_START_RANK,
} from "../leagueEngine";

describe("League Engine (PRD Section 5 & Module 3)", () => {
  describe("Tier Configuration", () => {
    it("should define all 8 official league tiers in progression", () => {
      expect(LEAGUE_TIERS[1].name).toBe("Starter League");
      expect(LEAGUE_TIERS[2].name).toBe("Bronze League");
      expect(LEAGUE_TIERS[3].name).toBe("Silver League");
      expect(LEAGUE_TIERS[4].name).toBe("Gold League");
      expect(LEAGUE_TIERS[5].name).toBe("Platinum League");
      expect(LEAGUE_TIERS[6].name).toBe("Diamond League");
      expect(LEAGUE_TIERS[7].name).toBe("Élite League");
      expect(LEAGUE_TIERS[8].name).toBe("Éclat Champion");
    });

    it("should clamp invalid tiers safely to 1..8", () => {
      expect(getLeagueTierConfig(0).tier).toBe(1);
      expect(getLeagueTierConfig(99).tier).toBe(8);
      expect(getLeagueTierConfig(4).name).toBe("Gold League");
    });
  });

  describe("Cohort Zone Classification", () => {
    it("should classify ranks 1 to 5 as promotion zone across all tiers", () => {
      for (let r = 1; r <= PROMOTION_CUTOFF_RANK; r++) {
        expect(getCohortZone(r, 1)).toBe("promotion");
        expect(getCohortZone(r, 4)).toBe("promotion");
        expect(getCohortZone(r, 8)).toBe("promotion");
      }
    });

    it("should classify ranks 6 to 25 as retained (safe zone)", () => {
      expect(getCohortZone(6, 3)).toBe("retained");
      expect(getCohortZone(15, 5)).toBe("retained");
      expect(getCohortZone(25, 7)).toBe("retained");
    });

    it("should classify ranks 26 to 30 as relegation zone for Tier 3 and above", () => {
      for (let r = RELEGATION_START_RANK; r <= 30; r++) {
        expect(getCohortZone(r, 3)).toBe("relegation");
        expect(getCohortZone(r, 5)).toBe("relegation");
        expect(getCohortZone(r, 8)).toBe("relegation");
      }
    });

    it("should exempt Starter (Tier 1) and Bronze (Tier 2) from relegation zone", () => {
      for (let r = RELEGATION_START_RANK; r <= 30; r++) {
        expect(getCohortZone(r, 1)).toBe("retained");
        expect(getCohortZone(r, 2)).toBe("retained");
      }
    });
  });

  describe("Weekly Promotion & Relegation Evaluation (Sunday 23:59 UTC)", () => {
    it("promotes ranks 1-5 to the next higher tier", () => {
      const res1 = evaluateWeeklyLeaguePromotion(1, 3);
      expect(res1.outcome).toBe("promoted");
      expect(res1.newTier).toBe(2);

      const res4 = evaluateWeeklyLeaguePromotion(4, 1);
      expect(res4.outcome).toBe("promoted");
      expect(res4.newTier).toBe(5);

      const res7 = evaluateWeeklyLeaguePromotion(7, 5);
      expect(res7.outcome).toBe("promoted");
      expect(res7.newTier).toBe(8);
    });

    it("retains Tier 8 Éclat Champions in rank 1-5 at Tier 8", () => {
      const res = evaluateWeeklyLeaguePromotion(8, 1);
      expect(res.outcome).toBe("champion_retained");
      expect(res.newTier).toBe(8);
    });

    it("retains middle ranks (6-25) in current tier", () => {
      const res = evaluateWeeklyLeaguePromotion(4, 12);
      expect(res.outcome).toBe("retained");
      expect(res.newTier).toBe(4);
    });

    it("relegates bottom ranks (26-30) for Tier 3+", () => {
      const resSilver = evaluateWeeklyLeaguePromotion(3, 28);
      expect(resSilver.outcome).toBe("relegated");
      expect(resSilver.newTier).toBe(2);

      const resGold = evaluateWeeklyLeaguePromotion(4, 30);
      expect(resGold.outcome).toBe("relegated");
      expect(resGold.newTier).toBe(3);
    });

    it("protects Starter (Tier 1) and Bronze (Tier 2) from relegation even at rank 30", () => {
      const resStarter = evaluateWeeklyLeaguePromotion(1, 29);
      expect(resStarter.outcome).toBe("retained");
      expect(resStarter.newTier).toBe(1);

      const resBronze = evaluateWeeklyLeaguePromotion(2, 30);
      expect(resBronze.outcome).toBe("retained");
      expect(resBronze.newTier).toBe(2);
    });
  });

  describe("Weekly Cohort Time Window", () => {
    it("calculates Monday start and Sunday end correctly for a Wednesday", () => {
      // 2026-09-23 is Wednesday
      const ref = new Date("2026-09-23T14:30:00Z");
      const window = getWeeklyCohortWindow(ref);

      expect(window.weekStartDate).toBe("2026-09-21"); // Monday
      expect(window.weekEndDate).toBe("2026-09-27"); // Sunday
      expect(window.isResetDay).toBe(false);
      expect(window.timeRemainingSeconds).toBeGreaterThan(0);
      expect(window.formattedCountdown).toContain("remaining");
    });

    it("identifies Sunday as reset day", () => {
      // 2026-09-27 is Sunday
      const ref = new Date("2026-09-27T18:00:00Z");
      const window = getWeeklyCohortWindow(ref);

      expect(window.weekStartDate).toBe("2026-09-21"); // Monday
      expect(window.weekEndDate).toBe("2026-09-27"); // Sunday
      expect(window.isResetDay).toBe(true);
    });
  });
});

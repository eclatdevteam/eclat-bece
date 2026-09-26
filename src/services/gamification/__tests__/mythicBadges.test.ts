import { describe, it, expect } from "vitest";
import { evaluateBadgesToUnlock, StudentContextData } from "../badgeEngine";

describe("Category 12 Ultra-Rare Mythic Achievements", () => {
  const baseContext: StudentContextData = {
    totalSessionsCompleted: 20,
    currentStreak: 5,
  };

  it("unlocks 'perfect_week' when student hits 7 consecutive daily challenges at 95%+ accuracy", () => {
    const context: StudentContextData = {
      ...baseContext,
      consecutiveDailyChallenge95PlusCount: 7,
    };
    const unlocked = evaluateBadgesToUnlock(context, []);
    const perfectWeek = unlocked.find((b) => b.id === "perfect_week");

    expect(perfectWeek).toBeDefined();
    expect(perfectWeek?.title).toBe("Perfect Week");
    expect(perfectWeek?.rarity).toBe("mythic");
    expect(perfectWeek?.rewardEP).toBe(500);
  });

  it("unlocks 'grandmaster' when promoted to League Tier 8 (Éclat Champion)", () => {
    const context: StudentContextData = {
      ...baseContext,
      leagueTier: 8,
    };
    const unlocked = evaluateBadgesToUnlock(context, []);
    const grandmaster = unlocked.find((b) => b.id === "grandmaster");

    expect(grandmaster).toBeDefined();
    expect(grandmaster?.rewardEP).toBe(750);
  });

  it("unlocks 'double_grandmaster' when maintaining 90%+ mastery in both Mathematics and English", () => {
    const context: StudentContextData = {
      ...baseContext,
      mathMasteryPercent: 92,
      englishMasteryPercent: 94,
    };
    const unlocked = evaluateBadgesToUnlock(context, []);
    const doubleGm = unlocked.find((b) => b.id === "double_grandmaster");

    expect(doubleGm).toBeDefined();
    expect(doubleGm?.rewardEP).toBe(1000);
  });

  it("unlocks 'the_one_percent' when student is within top 1% national rank", () => {
    const context: StudentContextData = {
      ...baseContext,
      nationalPercentileRank: 0.8,
    };
    const unlocked = evaluateBadgesToUnlock(context, []);
    const onePercent = unlocked.find((b) => b.id === "the_one_percent");

    expect(onePercent).toBeDefined();
    expect(onePercent?.rewardEP).toBe(1000);
  });

  it("unlocks 'invincible' when winning 20 consecutive arena duels", () => {
    const context: StudentContextData = {
      ...baseContext,
      consecutiveArenaWinsCount: 20,
    };
    const unlocked = evaluateBadgesToUnlock(context, []);
    const invincible = unlocked.find((b) => b.id === "invincible");

    expect(invincible).toBeDefined();
    expect(invincible?.rewardEP).toBe(750);
  });

  it("unlocks 'eclat_legend' when reaching Level 50, 90%+ mastery, and Champion League", () => {
    const context: StudentContextData = {
      ...baseContext,
      currentLevel: 50,
      overallMasteryPercent: 91,
      leagueTier: 8,
    };
    const unlocked = evaluateBadgesToUnlock(context, []);
    const legend = unlocked.find((b) => b.id === "eclat_legend");

    expect(legend).toBeDefined();
    expect(legend?.rewardEP).toBe(2000);
    expect(legend?.rarity).toBe("mythic");
  });

  it("does not re-unlock mythic badges if already earned", () => {
    const context: StudentContextData = {
      ...baseContext,
      leagueTier: 8,
      consecutiveArenaWinsCount: 25,
    };
    const alreadyEarned = ["grandmaster", "invincible"];
    const unlocked = evaluateBadgesToUnlock(context, alreadyEarned);

    expect(unlocked.find((b) => b.id === "grandmaster")).toBeUndefined();
    expect(unlocked.find((b) => b.id === "invincible")).toBeUndefined();
  });
});

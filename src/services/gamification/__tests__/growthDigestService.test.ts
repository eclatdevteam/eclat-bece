import { describe, it, expect, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { composeGrowthDigest, GrowthDigestInput } from "../growthDigestService";

describe("EP-PAR-01: Weekly Parent Growth Digest Engine", () => {
  it("generates positive turnaround headline and narrative when a weak topic is conquered", () => {
    const input: GrowthDigestInput = {
      studentName: "Francis",
      weekStartDate: "2026-09-21",
      weekEndDate: "2026-09-27",
      daysActive: 5,
      weeklyEP: 480,
      currentLevel: 4,
      leagueTier: 3,
      cohortRank: 3,
      streakCount: 7,
      streakShields: 1,
      topicTurnarounds: [
        {
          subject: "English Language",
          topic: "Comprehension",
          previousAccuracy: 45,
          currentAccuracy: 76,
          newStatus: "Developing",
        },
      ],
      newBadgesEarned: [
        { badgeId: "comeback_kid", title: "Comeback Kid", rarity: "Uncommon" },
      ],
      currentFocusAreas: [
        { subject: "Mathematics", topic: "Fractions", accuracy: 52 },
      ],
    };

    const digest = composeGrowthDigest(input);

    expect(digest.headline).toContain("Turnaround");
    expect(digest.narrative).toContain("Francis");
    expect(digest.narrative).toContain("Comeback Kid");
    expect(digest.narrative).toContain("Comprehension");
    expect(digest.metrics.daysActive).toBe(5);
    expect(digest.metrics.leagueMovement).toBe("promoted"); // Rank 1-5 promotes
    expect(digest.actionableEncouragement).toContain("Fractions");
  });

  it("celebrates multi-day consistency and league promotion when no turnaround occurred", () => {
    const input: GrowthDigestInput = {
      studentName: "Weird Ore",
      weekStartDate: "2026-09-21",
      weekEndDate: "2026-09-27",
      daysActive: 6,
      weeklyEP: 620,
      currentLevel: 5,
      leagueTier: 2,
      cohortRank: 2,
      streakCount: 14,
      streakShields: 2,
      topicTurnarounds: [],
      newBadgesEarned: [
        { badgeId: "locked_in", title: "Locked In", rarity: "Rare" },
      ],
      currentFocusAreas: [],
    };

    const digest = composeGrowthDigest(input);

    expect(digest.headline).toContain("Streak");
    expect(digest.narrative).toContain("Weird Ore");
    expect(digest.narrative).toContain("6 days");
    expect(digest.metrics.leagueMovement).toBe("promoted");
    expect(digest.metrics.streakCount).toBe(14);
  });

  it("provides gentle, constructive encouragement for a student with low activity", () => {
    const input: GrowthDigestInput = {
      studentName: "Chloe",
      weekStartDate: "2026-09-21",
      weekEndDate: "2026-09-27",
      daysActive: 1,
      weeklyEP: 70,
      currentLevel: 2,
      leagueTier: 1,
      cohortRank: 28,
      streakCount: 1,
      streakShields: 0,
      topicTurnarounds: [],
      newBadgesEarned: [],
      currentFocusAreas: [
        { subject: "Mathematics", topic: "Algebra", accuracy: 40 },
      ],
    };

    const digest = composeGrowthDigest(input);

    // Must be encouraging, never punitive or clinical
    expect(digest.headline).not.toContain("Failed");
    expect(digest.headline).not.toContain("Bad");
    expect(digest.narrative).toContain("Chloe");
    expect(digest.actionableEncouragement).toContain("Algebra");
    // Starter league tier 1 exempt from relegation
    expect(digest.metrics.leagueMovement).toBe("retained");
  });
});

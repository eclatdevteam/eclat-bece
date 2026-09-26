import { describe, it, expect } from "vitest";
import {
  evaluateDailyStreak,
  awardStreakShield,
  getStreakMilestoneBonus,
  MAX_STREAK_SHIELDS,
} from "../streakEngine";
import { StreakState } from "../types";

describe("EP-03: Daily Practice Streak & Streak Shield Engine", () => {
  const baseState: StreakState = {
    currentStreak: 1,
    longestStreak: 1,
    lastQualifyingDate: "2026-09-20",
    streakShields: 0,
  };

  it("requires minimum 10 questions or 1 Daily Challenge to qualify", () => {
    // 7 questions answered: does not qualify
    const under = evaluateDailyStreak({
      currentState: baseState,
      dateUTC: "2026-09-21",
      questionsAnsweredToday: 7,
      dailyChallengeCompletedToday: false,
    });
    expect(under.streakIncremented).toBe(false);
    expect(under.newState.currentStreak).toBe(1);

    // 10 questions answered: qualifies and increments
    const qualified = evaluateDailyStreak({
      currentState: baseState,
      dateUTC: "2026-09-21",
      questionsAnsweredToday: 10,
    });
    expect(qualified.streakIncremented).toBe(true);
    expect(qualified.newState.currentStreak).toBe(2);
    expect(qualified.streakBonusEP).toBe(10); // Day 2: +10 EP
  });

  it("qualifies on 1 Daily Challenge even if separate question count is under 10", () => {
    const qualified = evaluateDailyStreak({
      currentState: baseState,
      dateUTC: "2026-09-21",
      questionsAnsweredToday: 0,
      dailyChallengeCompletedToday: true,
    });
    expect(qualified.streakIncremented).toBe(true);
    expect(qualified.newState.currentStreak).toBe(2);
  });

  it("does not increment streak twice on the same calendar day", () => {
    const stateToday: StreakState = {
      currentStreak: 5,
      longestStreak: 5,
      lastQualifyingDate: "2026-09-21",
      streakShields: 0,
    };

    const sameDay = evaluateDailyStreak({
      currentState: stateToday,
      dateUTC: "2026-09-21", // Same date
      questionsAnsweredToday: 15,
    });

    expect(sameDay.streakIncremented).toBe(false);
    expect(sameDay.newState.currentStreak).toBe(5);
  });

  it("awards exact PRD milestone bonuses across consecutive days", () => {
    expect(getStreakMilestoneBonus(2)?.bonusEP).toBe(10);
    expect(getStreakMilestoneBonus(3)?.bonusEP).toBe(15);
    expect(getStreakMilestoneBonus(4)).toBeNull(); // No bonus on Day 4
    expect(getStreakMilestoneBonus(5)?.bonusEP).toBe(30);
    expect(getStreakMilestoneBonus(7)?.bonusEP).toBe(50);
    expect(getStreakMilestoneBonus(14)?.bonusEP).toBe(100);
    expect(getStreakMilestoneBonus(30)?.bonusEP).toBe(250);
    expect(getStreakMilestoneBonus(60)?.bonusEP).toBe(500);
    expect(getStreakMilestoneBonus(100)?.bonusEP).toBe(1000);
    expect(getStreakMilestoneBonus(105)?.bonusEP).toBe(25); // Day 101+: +25 EP / day
  });

  it("automatically consumes a Streak Shield when 1 calendar day is missed", () => {
    const shieldedState: StreakState = {
      currentStreak: 8,
      longestStreak: 8,
      lastQualifyingDate: "2026-09-20",
      streakShields: 1, // 1 shield active
    };

    // Missed 2026-09-21, practiced on 2026-09-22 (2 days later)
    const result = evaluateDailyStreak({
      currentState: shieldedState,
      dateUTC: "2026-09-22",
      questionsAnsweredToday: 12,
    });

    expect(result.streakPreservedByShield).toBe(true);
    expect(result.streakBroken).toBe(false);
    expect(result.newState.currentStreak).toBe(9); // Streak preserved & advanced
    expect(result.newState.streakShields).toBe(0); // Shield consumed
  });

  it("resets streak to 1 if calendar day is missed and no shields are available", () => {
    const unshieldedState: StreakState = {
      currentStreak: 12,
      longestStreak: 12,
      lastQualifyingDate: "2026-09-20",
      streakShields: 0,
    };

    // Practiced on 2026-09-22 (gap of 2 days with 0 shields)
    const result = evaluateDailyStreak({
      currentState: unshieldedState,
      dateUTC: "2026-09-22",
      questionsAnsweredToday: 10,
    });

    expect(result.streakBroken).toBe(true);
    expect(result.newState.currentStreak).toBe(1);
    expect(result.newState.longestStreak).toBe(12); // Longest preserved
  });

  it("awards a streak shield for every 3 weak topics turned Strong up to maximum of 2", () => {
    const award1 = awardStreakShield(0, 3);
    expect(award1.shieldsAwarded).toBe(1);
    expect(award1.newShieldCount).toBe(1);

    const award2 = awardStreakShield(1, 6);
    expect(award2.shieldsAwarded).toBe(1);
    expect(award2.newShieldCount).toBe(2);

    // Capped at 2 maximum shields
    const award3 = awardStreakShield(2, 9);
    expect(award3.shieldsAwarded).toBe(0);
    expect(award3.newShieldCount).toBe(MAX_STREAK_SHIELDS);
  });
});

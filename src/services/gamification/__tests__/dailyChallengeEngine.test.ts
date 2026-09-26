import { describe, it, expect } from "vitest";
import {
  evaluateDailyChallenge,
  DAILY_CHALLENGE_TOTAL_QUESTIONS,
  getDailyChallengeCountdown,
} from "../dailyChallengeEngine";

describe("EP-04: Daily Challenge Service Engine", () => {
  it("awards +20 EP baseline completion for completing all 10 questions under 70%", () => {
    const result = evaluateDailyChallenge({
      completedQuestions: 10,
      scorePercentage: 60,
      alreadyCompletedToday: false,
    });

    expect(result.eligible).toBe(true);
    expect(result.baseCompletionEP).toBe(20);
    expect(result.accuracyTierEP).toBe(0);
    expect(result.totalEP).toBe(20);
  });

  it("awards +10 additional EP (+30 EP total) for 70.0% to 89.9% accuracy", () => {
    const result = evaluateDailyChallenge({
      completedQuestions: 10,
      scorePercentage: 75,
      alreadyCompletedToday: false,
    });

    expect(result.eligible).toBe(true);
    expect(result.accuracyTierEP).toBe(10);
    expect(result.totalEP).toBe(30);
  });

  it("awards +20 additional EP (+40 EP total) for 90.0% to 99.9% accuracy", () => {
    const result = evaluateDailyChallenge({
      completedQuestions: 10,
      scorePercentage: 90,
      alreadyCompletedToday: false,
    });

    expect(result.eligible).toBe(true);
    expect(result.accuracyTierEP).toBe(20);
    expect(result.totalEP).toBe(40);
  });

  it("awards +30 additional EP (+50 EP total) for 100% perfect score", () => {
    const result = evaluateDailyChallenge({
      completedQuestions: 10,
      scorePercentage: 100,
      alreadyCompletedToday: false,
    });

    expect(result.eligible).toBe(true);
    expect(result.accuracyTierEP).toBe(30);
    expect(result.totalEP).toBe(50);
  });

  it("disqualifies if fewer than 10 questions were completed", () => {
    const result = evaluateDailyChallenge({
      completedQuestions: 9,
      scorePercentage: 100,
      alreadyCompletedToday: false,
    });

    expect(result.eligible).toBe(false);
    expect(result.totalEP).toBe(0);
  });

  it("enforces daily cap: awards 0 EP if already completed today", () => {
    const result = evaluateDailyChallenge({
      completedQuestions: 10,
      scorePercentage: 100,
      alreadyCompletedToday: true, // Already claimed
    });

    expect(result.eligible).toBe(false);
    expect(result.totalEP).toBe(0);
    expect(result.reason).toContain("once per calendar day");
  });

  describe("Daily Challenge Reset Countdown", () => {
    it("calculates time remaining until next 00:00 UTC", () => {
      // 18:30:00 UTC -> 5h 30m remaining until 00:00 UTC next day
      const refDate = new Date("2026-09-26T18:30:00.000Z");
      const countdown = getDailyChallengeCountdown(refDate);

      expect(countdown.remainingHours).toBe(5);
      expect(countdown.remainingMinutes).toBe(30);
      expect(countdown.remainingSeconds).toBe(5 * 3600 + 30 * 60);
      expect(countdown.formattedCountdown).toBe("5h 30m");
    });

    it("handles late night times like 23:45 UTC", () => {
      const refDate = new Date("2026-09-26T23:45:10.000Z");
      const countdown = getDailyChallengeCountdown(refDate);

      expect(countdown.remainingHours).toBe(0);
      expect(countdown.remainingMinutes).toBe(14);
      expect(countdown.formattedCountdown).toBe("0h 14m");
    });
  });
});


import { describe, it, expect } from "vitest";
import {
  evaluateQuestionAttemptAntiGaming,
  checkQuestionChurningCooldown,
  isHeadToHeadMatchEligibleForPoints,
  applyDailySpeedBonusCap,
  RAPID_GUESSING_THRESHOLD_SECONDS,
  DUPLICATE_COOLDOWN_HOURS,
  DOWN_TIER_FULL_LIMIT,
  DOWN_TIER_DECAY_LIMIT,
  DAILY_SPEED_BONUS_CAP,
  MAX_HEAD_TO_HEAD_COLLUSION_MATCHES,
} from "../antiGamingEngine";

describe("PRD Section 4: Anti-Gaming & Integrity Enforcement Engine", () => {
  describe("PRD §4.1: Down-Tier Farming Decay", () => {
    it("allows full EP for Year 9 student practicing Year 6 questions for the first 15 questions", () => {
      const result = evaluateQuestionAttemptAntiGaming({
        studentClassYear: "year_9",
        questionClassYear: "year_6",
        hasStrongMasteryInSubject: true,
        downTierQuestionsAnsweredToday: 10,
        timeSpentSeconds: 15,
      });

      expect(result.allowed).toBe(true);
      expect(result.epMultiplier).toBe(1.0);
      expect(result.flaggedReason).toBeUndefined();
    });

    it("applies 50% decay for questions 16 to 30 when strong Year 9 student farms Year 6 content", () => {
      const result = evaluateQuestionAttemptAntiGaming({
        studentClassYear: "year_9",
        questionClassYear: "year_6",
        hasStrongMasteryInSubject: true,
        downTierQuestionsAnsweredToday: 15, // 16th question
        timeSpentSeconds: 15,
      });

      expect(result.allowed).toBe(true);
      expect(result.epMultiplier).toBe(0.5);
      expect(result.flaggedReason).toBe("down_tier_decay");
    });

    it("applies 0% EP ceiling after 30 down-tier questions in a single day", () => {
      const result = evaluateQuestionAttemptAntiGaming({
        studentClassYear: "year_9",
        questionClassYear: "year_6",
        hasStrongMasteryInSubject: true,
        downTierQuestionsAnsweredToday: 30, // 31st question
        timeSpentSeconds: 20,
      });

      expect(result.allowed).toBe(true);
      expect(result.epMultiplier).toBe(0.0);
      expect(result.flaggedReason).toBe("down_tier_ceiling");
    });

    it("does NOT decay points if Year 9 student does NOT have strong mastery in the subject (legitimate remediation)", () => {
      const result = evaluateQuestionAttemptAntiGaming({
        studentClassYear: "year_9",
        questionClassYear: "year_6",
        hasStrongMasteryInSubject: false, // Weak or developing
        downTierQuestionsAnsweredToday: 25,
        timeSpentSeconds: 20,
      });

      expect(result.allowed).toBe(true);
      expect(result.epMultiplier).toBe(1.0);
      expect(result.flaggedReason).toBeUndefined();
    });

    it("awards full EP for on-grade questions (Year 9 on Year 9)", () => {
      const result = evaluateQuestionAttemptAntiGaming({
        studentClassYear: "year_9",
        questionClassYear: "year_9",
        hasStrongMasteryInSubject: true,
        downTierQuestionsAnsweredToday: 50,
        timeSpentSeconds: 25,
      });

      expect(result.epMultiplier).toBe(1.0);
      expect(result.flaggedReason).toBeUndefined();
    });
  });

  describe("PRD §4.2: Question Churning & Refresh Cooldown", () => {
    it("does not trigger cooldown if <= 5 sessions abandoned in 2 minutes", () => {
      const now = Date.now();
      const abandons = [
        now - 10000,
        now - 20000,
        now - 30000,
        now - 40000,
        now - 50000,
      ]; // 5 abandons

      const status = checkQuestionChurningCooldown(abandons);
      expect(status.inCooldown).toBe(false);
      expect(status.remainingCooldownSeconds).toBe(0);
    });

    it("triggers 10-minute cooldown if > 5 sessions abandoned within 2 minutes", () => {
      const now = Date.now();
      const abandons = [
        now - 5000,
        now - 15000,
        now - 25000,
        now - 35000,
        now - 45000,
        now - 55000, // 6th abandon
      ];

      const status = checkQuestionChurningCooldown(abandons);
      expect(status.inCooldown).toBe(true);
      expect(status.remainingCooldownSeconds).toBeGreaterThan(500);
      expect(status.remainingCooldownSeconds).toBeLessThanOrEqual(600);
    });

    it("ignores old abandons outside the 2-minute detection window", () => {
      const now = Date.now();
      const threeMinutesAgo = now - 3 * 60 * 1000;
      const abandons = [
        threeMinutesAgo - 10000,
        threeMinutesAgo - 20000,
        threeMinutesAgo - 30000,
        threeMinutesAgo - 40000,
        threeMinutesAgo - 50000,
        now - 10000, // Only 1 in last 2 mins
      ];

      const status = checkQuestionChurningCooldown(abandons);
      expect(status.inCooldown).toBe(false);
    });
  });

  describe("PRD §4.3: Rapid Guessing & Botting Safeguards", () => {
    it("disqualifies answers submitted in under 2.5 seconds with 0 EP", () => {
      const result = evaluateQuestionAttemptAntiGaming({
        timeSpentSeconds: 1.8, // Sub-2.5s rapid guess
      });

      expect(result.allowed).toBe(true);
      expect(result.epMultiplier).toBe(0.0);
      expect(result.flaggedReason).toBe("rapid_guessing");
    });

    it("permits standard cognitive submissions (>= 2.5 seconds)", () => {
      const result = evaluateQuestionAttemptAntiGaming({
        timeSpentSeconds: 2.6,
      });

      expect(result.epMultiplier).toBe(1.0);
      expect(result.flaggedReason).toBeUndefined();
    });
  });

  describe("PRD §4.4: Duplicate Question Repetition", () => {
    it("blocks points for re-answering identical question within 4 hours", () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const result = evaluateQuestionAttemptAntiGaming({
        lastAttemptedAt: twoHoursAgo,
        timeSpentSeconds: 15,
      });

      expect(result.epMultiplier).toBe(0.0);
      expect(result.flaggedReason).toBe("duplicate_cooldown");
    });

    it("allows full points if last attempt was > 4 hours ago", () => {
      const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString();
      const result = evaluateQuestionAttemptAntiGaming({
        lastAttemptedAt: fiveHoursAgo,
        timeSpentSeconds: 15,
      });

      expect(result.epMultiplier).toBe(1.0);
      expect(result.flaggedReason).toBeUndefined();
    });
  });

  describe("PRD §4.5: Head-to-Head Arena Collusion Prevention", () => {
    it("permits points for the first 2 head-to-head matches between a pair in 24h", () => {
      expect(isHeadToHeadMatchEligibleForPoints(0)).toBe(true);
      expect(isHeadToHeadMatchEligibleForPoints(1)).toBe(true);
    });

    it("blocks points starting from the 3rd match against the same opponent within 24h", () => {
      expect(isHeadToHeadMatchEligibleForPoints(2)).toBe(false);
      expect(isHeadToHeadMatchEligibleForPoints(5)).toBe(false);
    });
  });

  describe("PRD §4.6: Daily Speed Bonus Cap", () => {
    it("allows prospective speed bonus when well under the 50 EP daily limit", () => {
      const awarded = applyDailySpeedBonusCap(20, 10);
      expect(awarded).toBe(10);
    });

    it("partially truncates speed bonus when prospective bonus hits 50 EP ceiling", () => {
      const awarded = applyDailySpeedBonusCap(45, 10);
      expect(awarded).toBe(5); // 45 + 5 = 50 EP max
    });

    it("awards 0 EP speed bonus once 50 EP daily cap is met", () => {
      const awarded = applyDailySpeedBonusCap(50, 10);
      expect(awarded).toBe(0);
    });
  });
});

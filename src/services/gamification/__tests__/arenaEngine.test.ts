import { describe, it, expect } from "vitest";
import {
  calculateArenaMatchEP,
  isMatchmakingEligible,
  ARENA_BASE_REWARDS,
  UPSET_VICTORY_BONUS_EP,
  MAX_DAILY_MATCHES_PER_PAIR,
} from "../arenaEngine";

describe("Arena Engine - Head-to-Head Duel of Minds (PRD Section 3.9 & 4)", () => {
  describe("Base Match Outcomes", () => {
    it("awards +50 EP on victory and increments win streak", () => {
      const res = calculateArenaMatchEP({
        outcome: "win",
        playerTier: 2,
        opponentTier: 2,
        currentWinStreak: 0,
        matchesBetweenPairToday: 0,
      });

      expect(res.baseEP).toBe(50);
      expect(res.upsetBonusEP).toBe(0);
      expect(res.streakBonusEP).toBe(0);
      expect(res.totalEP).toBe(50);
      expect(res.newWinStreak).toBe(1);
      expect(res.cappedByCollusion).toBe(false);
    });

    it("awards +20 EP on draw and preserves win streak", () => {
      const res = calculateArenaMatchEP({
        outcome: "draw",
        playerTier: 3,
        opponentTier: 3,
        currentWinStreak: 4,
        matchesBetweenPairToday: 1,
      });

      expect(res.baseEP).toBe(20);
      expect(res.totalEP).toBe(20);
      expect(res.newWinStreak).toBe(4);
    });

    it("awards +5 EP on loss and resets win streak to 0", () => {
      const res = calculateArenaMatchEP({
        outcome: "loss",
        playerTier: 4,
        opponentTier: 4,
        currentWinStreak: 6,
        matchesBetweenPairToday: 0,
      });

      expect(res.baseEP).toBe(5);
      expect(res.totalEP).toBe(5);
      expect(res.newWinStreak).toBe(0);
    });
  });

  describe("Upset Victory Bonus (+25 EP)", () => {
    it("awards +25 EP upset bonus when defeating an opponent 2+ leagues higher", () => {
      // Bronze (2) defeats Gold (4)
      const res = calculateArenaMatchEP({
        outcome: "win",
        playerTier: 2,
        opponentTier: 4,
        currentWinStreak: 0,
        matchesBetweenPairToday: 0,
      });

      expect(res.isUpset).toBe(true);
      expect(res.upsetBonusEP).toBe(25);
      expect(res.totalEP).toBe(75); // 50 base + 25 upset
    });

    it("awards +25 EP upset bonus when defeating an opponent 50+ ranks higher on leaderboard", () => {
      // Rank 120 defeats Rank 40 (difference 80 >= 50)
      const res = calculateArenaMatchEP({
        outcome: "win",
        playerTier: 3,
        opponentTier: 3,
        playerRank: 120,
        opponentRank: 40,
        currentWinStreak: 1,
        matchesBetweenPairToday: 0,
      });

      expect(res.isUpset).toBe(true);
      expect(res.upsetBonusEP).toBe(25);
      expect(res.totalEP).toBe(75);
    });

    it("does not award upset bonus on loss or equal rank", () => {
      const res = calculateArenaMatchEP({
        outcome: "loss",
        playerTier: 2,
        opponentTier: 5,
        currentWinStreak: 0,
        matchesBetweenPairToday: 0,
      });

      expect(res.isUpset).toBe(false);
      expect(res.upsetBonusEP).toBe(0);
      expect(res.totalEP).toBe(5);
    });
  });

  describe("Win Streak Milestone Bonuses", () => {
    it("awards +30 EP on 3 consecutive wins", () => {
      const res = calculateArenaMatchEP({
        outcome: "win",
        playerTier: 3,
        opponentTier: 3,
        currentWinStreak: 2, // Will become 3
        matchesBetweenPairToday: 0,
      });

      expect(res.newWinStreak).toBe(3);
      expect(res.streakBonusEP).toBe(30);
      expect(res.totalEP).toBe(80); // 50 base + 30 streak
    });

    it("awards +75 EP on 5 consecutive wins", () => {
      const res = calculateArenaMatchEP({
        outcome: "win",
        playerTier: 3,
        opponentTier: 3,
        currentWinStreak: 4, // Will become 5
        matchesBetweenPairToday: 0,
      });

      expect(res.newWinStreak).toBe(5);
      expect(res.streakBonusEP).toBe(75);
      expect(res.totalEP).toBe(125); // 50 base + 75 streak
    });

    it("awards +200 EP on 10 consecutive wins", () => {
      const res = calculateArenaMatchEP({
        outcome: "win",
        playerTier: 3,
        opponentTier: 3,
        currentWinStreak: 9, // Will become 10
        matchesBetweenPairToday: 0,
      });

      expect(res.newWinStreak).toBe(10);
      expect(res.streakBonusEP).toBe(200);
      expect(res.totalEP).toBe(250); // 50 base + 200 streak
    });
  });

  describe("Anti-Collusion Safeguard (PRD Section 4: Abuse Vector 5)", () => {
    it("throttles EP to 0 once 2 matches between the same pair have occurred in 24 hours", () => {
      const res = calculateArenaMatchEP({
        outcome: "win",
        playerTier: 2,
        opponentTier: 4,
        currentWinStreak: 2,
        matchesBetweenPairToday: 2, // Cap reached
      });

      expect(res.cappedByCollusion).toBe(true);
      expect(res.baseEP).toBe(0);
      expect(res.upsetBonusEP).toBe(0);
      expect(res.streakBonusEP).toBe(0);
      expect(res.totalEP).toBe(0);
    });
  });

  describe("Matchmaking Fair Play (PRD Section 5.2)", () => {
    it("allows pairings within +/- 1 league tier", () => {
      expect(isMatchmakingEligible(1, 1)).toBe(true);
      expect(isMatchmakingEligible(3, 4)).toBe(true);
      expect(isMatchmakingEligible(5, 4)).toBe(true);
    });

    it("rejects pairings greater than 1 league tier difference", () => {
      expect(isMatchmakingEligible(1, 3)).toBe(false);
      expect(isMatchmakingEligible(2, 5)).toBe(false);
    });
  });
});

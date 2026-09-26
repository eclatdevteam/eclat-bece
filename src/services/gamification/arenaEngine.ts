/**
 * Éclat Head-to-Head Arena (Duel of Minds) Point Economy Engine
 * Implements PRD Section 3.9, 4 (Abuse Vector 5), 5.2, and Epic ARE-01
 */

import {
  ArenaMatchInput,
  ArenaMatchResult,
  PointBreakdownItem,
} from "./types";

export const ARENA_BASE_REWARDS = {
  win: 50,
  draw: 20,
  loss: 5,
} as const;

export const UPSET_VICTORY_BONUS_EP = 25;
export const MAX_DAILY_MATCHES_PER_PAIR = 2; // PRD Section 4: Abuse Vector 5

export const WIN_STREAK_BONUSES: Record<number, number> = {
  3: 30,
  5: 75,
  10: 200,
};

/**
 * Evaluates points earned from a Head-to-Head match according to PRD formulas.
 */
export function calculateArenaMatchEP(input: ArenaMatchInput): ArenaMatchResult {
  const {
    outcome,
    playerTier,
    opponentTier,
    playerRank,
    opponentRank,
    currentWinStreak,
    matchesBetweenPairToday,
  } = input;

  const breakdown: PointBreakdownItem[] = [];

  // 1. Anti-Collusion Cap Check (PRD Section 4: Abuse Vector 5)
  if (matchesBetweenPairToday >= MAX_DAILY_MATCHES_PER_PAIR) {
    let newStreak = currentWinStreak;
    if (outcome === "win") newStreak += 1;
    else if (outcome === "loss") newStreak = 0;

    return {
      outcome,
      baseEP: 0,
      upsetBonusEP: 0,
      streakBonusEP: 0,
      totalEP: 0,
      newWinStreak: newStreak,
      isUpset: false,
      cappedByCollusion: true,
      breakdown: [
        {
          category: "session_bonus",
          label: "Anti-Collusion Cap Reached",
          amount: 0,
          description: `Daily limit of ${MAX_DAILY_MATCHES_PER_PAIR} matches between this pair reached. Further matches today yield 0 EP.`,
        },
      ],
    };
  }

  // 2. Base Match EP
  const baseEP = ARENA_BASE_REWARDS[outcome];
  const outcomeLabel =
    outcome === "win"
      ? "Arena Victory (+50 EP)"
      : outcome === "draw"
      ? "Arena Tie (+20 EP)"
      : "Arena Participation (+5 EP)";

  breakdown.push({
    category: "base",
    label: outcomeLabel,
    amount: baseEP,
    description: `Match result: ${outcome.toUpperCase()}`,
  });

  // 3. Upset Victory Bonus (+25 EP)
  let upsetBonusEP = 0;
  let isUpset = false;
  if (outcome === "win") {
    const tierDifference = opponentTier - playerTier;
    const rankDifference =
      playerRank && opponentRank && playerRank > 0 && opponentRank > 0
        ? playerRank - opponentRank
        : 0;

    if (tierDifference >= 2 || rankDifference >= 50) {
      isUpset = true;
      upsetBonusEP = UPSET_VICTORY_BONUS_EP;
      breakdown.push({
        category: "session_bonus",
        label: "Upset Victory Bonus (+25 EP)",
        amount: UPSET_VICTORY_BONUS_EP,
        description:
          tierDifference >= 2
            ? `Defeated opponent ${tierDifference} leagues above you!`
            : `Defeated opponent ranked ${rankDifference} spots higher on the leaderboard!`,
      });
    }
  }

  // 4. Win Streak Calculation
  let newWinStreak = currentWinStreak;
  let streakBonusEP = 0;

  if (outcome === "win") {
    newWinStreak = currentWinStreak + 1;
    if (WIN_STREAK_BONUSES[newWinStreak]) {
      streakBonusEP = WIN_STREAK_BONUSES[newWinStreak];
      breakdown.push({
        category: "streak_bonus",
        label: `Arena Win Streak (${newWinStreak} in a row)`,
        amount: streakBonusEP,
        description: `Dominant competitive form: ${newWinStreak} consecutive duel victories!`,
      });
    }
  } else if (outcome === "loss") {
    newWinStreak = 0;
  }
  // On draw, win streak remains untouched

  const totalEP = baseEP + upsetBonusEP + streakBonusEP;

  return {
    outcome,
    baseEP,
    upsetBonusEP,
    streakBonusEP,
    totalEP,
    newWinStreak,
    isUpset,
    cappedByCollusion: false,
    breakdown,
  };
}

/**
 * Checks if two students are within fair matchmaking range (+/- 1 league tier)
 */
export function isMatchmakingEligible(tierA: number, tierB: number): boolean {
  return Math.abs(tierA - tierB) <= 1;
}

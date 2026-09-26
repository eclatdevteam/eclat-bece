/**
 * Éclat League Engine
 * Implements PRD Section 5 & Module 3: 8-Tier Competitive Leagues System
 * 30-Player Weekly Cohorts, Sunday 23:59 UTC Evaluation, and Promotion/Relegation Rules
 */

import {
  LeagueTierConfig,
  LeagueTierNumber,
  CohortZone,
  WeeklyLeagueOutcome,
  WeeklyLeagueEvaluation,
  WeeklyCohortWindow,
} from "./types";

export const LEAGUE_TIERS: Record<LeagueTierNumber, LeagueTierConfig> = {
  1: {
    tier: 1,
    name: "Starter League",
    badge: "🌱",
    color: "text-slate-600 dark:text-slate-400",
    borderColor: "border-slate-300 dark:border-slate-700",
    bgColor: "bg-slate-500/10",
    description: "Welcome to the arena! Begin your competitive journey here.",
    minLevel: 1,
  },
  2: {
    tier: 2,
    name: "Bronze League",
    badge: "🥉",
    color: "text-amber-700 dark:text-amber-600",
    borderColor: "border-amber-700/30",
    bgColor: "bg-amber-700/10",
    description: "Foundational competitive tier. Relegation protected.",
    minLevel: 5,
  },
  3: {
    tier: 3,
    name: "Silver League",
    badge: "🥈",
    color: "text-slate-400 dark:text-slate-300",
    borderColor: "border-slate-400/40",
    bgColor: "bg-slate-400/10",
    description: "Rising contenders building sustained consistency.",
    minLevel: 8,
  },
  4: {
    tier: 4,
    name: "Gold League",
    badge: "🥇",
    color: "text-yellow-500 dark:text-yellow-400",
    borderColor: "border-yellow-500/40",
    bgColor: "bg-yellow-500/10",
    description: "Experienced scholars with formidable subject mastery.",
    minLevel: 12,
  },
  5: {
    tier: 5,
    name: "Platinum League",
    badge: "💠",
    color: "text-cyan-500 dark:text-cyan-400",
    borderColor: "border-cyan-500/40",
    bgColor: "bg-cyan-500/10",
    description: "High-velocity practitioners operating with razor-sharp precision.",
    minLevel: 16,
  },
  6: {
    tier: 6,
    name: "Diamond League",
    badge: "💎",
    color: "text-blue-500 dark:text-blue-400",
    borderColor: "border-blue-500/40",
    bgColor: "bg-blue-500/10",
    description: "Elite performers holding the upper echelon of academic rigor.",
    minLevel: 20,
  },
  7: {
    tier: 7,
    name: "Élite League",
    badge: "👑",
    color: "text-purple-500 dark:text-purple-400",
    borderColor: "border-purple-500/40",
    bgColor: "bg-purple-500/10",
    description: "Renowned academic masters standing one step away from legend.",
    minLevel: 25,
  },
  8: {
    tier: 8,
    name: "Éclat Champion",
    badge: "🌌",
    color: "text-amber-400 dark:text-amber-300",
    borderColor: "border-amber-400/60",
    bgColor: "bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-blue-500/20",
    description: "The pinnacle tier of top-performing students nationwide.",
    minLevel: 30,
  },
};

export const MAX_COHORT_SIZE = 30;
export const PROMOTION_CUTOFF_RANK = 5; // Ranks 1 to 5 (Top ~16%)
export const RELEGATION_START_RANK = 26; // Ranks 26 to 30 (Bottom ~16%)

/**
 * Returns the tier configuration for a given tier number (1-8).
 */
export function getLeagueTierConfig(tier: number): LeagueTierConfig {
  const clamped = Math.max(1, Math.min(8, Math.round(tier || 1))) as LeagueTierNumber;
  return LEAGUE_TIERS[clamped];
}

/**
 * Classifies a student's cohort zone based on their rank and tier.
 * Note: Starter (Tier 1) and Bronze (Tier 2) are exempt from relegation.
 */
export function getCohortZone(rank: number, tier: LeagueTierNumber): CohortZone {
  if (rank >= 1 && rank <= PROMOTION_CUTOFF_RANK) {
    return "promotion";
  }

  if (rank >= RELEGATION_START_RANK) {
    // Tiers 1 & 2 are exempt from relegation
    if (tier === 1 || tier === 2) {
      return "retained";
    }
    return "relegation";
  }

  return "retained";
}

/**
 * Evaluates the weekly league outcome and new tier at the Sunday 23:59 UTC boundary.
 */
export function evaluateWeeklyLeaguePromotion(
  currentTier: LeagueTierNumber,
  rank: number,
  cohortSize: number = MAX_COHORT_SIZE
): WeeklyLeagueEvaluation {
  const safeTier = Math.max(1, Math.min(8, currentTier)) as LeagueTierNumber;

  // Top 5 -> Promoted
  if (rank >= 1 && rank <= PROMOTION_CUTOFF_RANK) {
    if (safeTier === 8) {
      return {
        previousTier: 8,
        newTier: 8,
        outcome: "champion_retained",
        rank,
        cohortSize,
        summaryMessage: "You finished at the summit! Retained Éclat Champion pinnacle status.",
      };
    }

    const nextTier = (safeTier + 1) as LeagueTierNumber;
    return {
      previousTier: safeTier,
      newTier: nextTier,
      outcome: "promoted",
      rank,
      cohortSize,
      summaryMessage: `Promotion triumph! Advanced from ${LEAGUE_TIERS[safeTier].name} to ${LEAGUE_TIERS[nextTier].name}.`,
    };
  }

  // Ranks 26 to 30 -> Relegation check
  if (rank >= RELEGATION_START_RANK) {
    // Starter (Tier 1) and Bronze (Tier 2) are exempt from relegation
    if (safeTier <= 2) {
      return {
        previousTier: safeTier,
        newTier: safeTier,
        outcome: "retained",
        rank,
        cohortSize,
        summaryMessage: `${LEAGUE_TIERS[safeTier].name} is protected from relegation. Retained for next week.`,
      };
    }

    const lowerTier = (safeTier - 1) as LeagueTierNumber;
    return {
      previousTier: safeTier,
      newTier: lowerTier,
      outcome: "relegated",
      rank,
      cohortSize,
      summaryMessage: `Relegated from ${LEAGUE_TIERS[safeTier].name} to ${LEAGUE_TIERS[lowerTier].name}. Train hard to climb back!`,
    };
  }

  // Middle 68% (Ranks 6 to 25) -> Retained in current league
  return {
    previousTier: safeTier,
    newTier: safeTier,
    outcome: "retained",
    rank,
    cohortSize,
    summaryMessage: `Safe finish! Retained standing in ${LEAGUE_TIERS[safeTier].name}.`,
  };
}

/**
 * Computes the weekly cohort UTC time window, start Monday 00:00 UTC to Sunday 23:59:59 UTC.
 */
export function getWeeklyCohortWindow(referenceDate: Date = new Date()): WeeklyCohortWindow {
  const utcNow = new Date(referenceDate.toISOString());

  // In JS getUTCDay(): 0 is Sunday, 1 is Monday, ..., 6 is Saturday
  const day = utcNow.getUTCDay();
  // Distance back to current week's Monday (if Sunday (0), distance is 6 days back)
  const diffToMonday = day === 0 ? 6 : day - 1;

  const monday = new Date(Date.UTC(
    utcNow.getUTCFullYear(),
    utcNow.getUTCMonth(),
    utcNow.getUTCDate() - diffToMonday,
    0, 0, 0, 0
  ));

  const sunday = new Date(Date.UTC(
    monday.getUTCFullYear(),
    monday.getUTCMonth(),
    monday.getUTCDate() + 6,
    23, 59, 59, 999
  ));

  const remainingMs = Math.max(0, sunday.getTime() - utcNow.getTime());
  const remainingSeconds = Math.floor(remainingMs / 1000);

  const daysRemaining = Math.floor(remainingSeconds / 86400);
  const hoursRemaining = Math.floor((remainingSeconds % 86400) / 3600);
  const minutesRemaining = Math.floor((remainingSeconds % 3600) / 60);

  let formattedCountdown = `${daysRemaining}d ${hoursRemaining}h remaining`;
  if (daysRemaining === 0) {
    formattedCountdown = `${hoursRemaining}h ${minutesRemaining}m remaining`;
  }

  const pad = (n: number) => n.toString().padStart(2, "0");
  const weekStartDate = `${monday.getUTCFullYear()}-${pad(monday.getUTCMonth() + 1)}-${pad(monday.getUTCDate())}`;
  const weekEndDate = `${sunday.getUTCFullYear()}-${pad(sunday.getUTCMonth() + 1)}-${pad(sunday.getUTCDate())}`;

  return {
    weekStartDate,
    weekEndDate,
    timeRemainingSeconds: remainingSeconds,
    formattedCountdown,
    isResetDay: day === 0, // Sunday
  };
}

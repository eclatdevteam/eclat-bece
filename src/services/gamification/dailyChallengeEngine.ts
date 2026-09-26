/**
 * Daily Challenge Calculation Engine
 * Implements Section 3.6 of the Éclat Platform Specification PRD
 */

import {
  DailyChallengeInput,
  DailyChallengeResult,
} from "./types";

export const DAILY_CHALLENGE_TOTAL_QUESTIONS = 10;
export const BASE_COMPLETION_EP = 20;

export const ACCURACY_TIER_70_89_EP = 10; // +30 EP total
export const ACCURACY_TIER_90_99_EP = 20; // +40 EP total
export const ACCURACY_TIER_100_EP = 30; // +50 EP total

/**
 * Evaluates Daily Challenge completion rewards
 */
export function evaluateDailyChallenge(input: DailyChallengeInput): DailyChallengeResult {
  const { completedQuestions, scorePercentage, alreadyCompletedToday } = input;

  if (alreadyCompletedToday) {
    return {
      eligible: false,
      baseCompletionEP: 0,
      accuracyTierEP: 0,
      totalEP: 0,
      reason: "Daily challenge bonus can only be claimed once per calendar day.",
    };
  }

  if (completedQuestions < DAILY_CHALLENGE_TOTAL_QUESTIONS) {
    return {
      eligible: false,
      baseCompletionEP: 0,
      accuracyTierEP: 0,
      totalEP: 0,
      reason: `Must complete all ${DAILY_CHALLENGE_TOTAL_QUESTIONS} questions to claim daily challenge reward.`,
    };
  }

  let accuracyTierEP = 0;
  if (scorePercentage >= 100) {
    accuracyTierEP = ACCURACY_TIER_100_EP;
  } else if (scorePercentage >= 90) {
    accuracyTierEP = ACCURACY_TIER_90_99_EP;
  } else if (scorePercentage >= 70) {
    accuracyTierEP = ACCURACY_TIER_70_89_EP;
  }

  const totalEP = BASE_COMPLETION_EP + accuracyTierEP;

  return {
    eligible: true,
    baseCompletionEP: BASE_COMPLETION_EP,
    accuracyTierEP,
    totalEP,
    reason: `Claimed Daily Challenge reward: +${BASE_COMPLETION_EP} EP completion + ${accuracyTierEP} EP accuracy tier.`,
  };
}

/**
 * Calculates time remaining until the next 00:00 UTC Daily Challenge reset
 */
export function getDailyChallengeCountdown(referenceDate: Date = new Date()): {
  remainingSeconds: number;
  remainingHours: number;
  remainingMinutes: number;
  formattedCountdown: string;
} {
  const utcNow = new Date(referenceDate.toISOString());
  const tomorrowUTC = new Date(Date.UTC(
    utcNow.getUTCFullYear(),
    utcNow.getUTCMonth(),
    utcNow.getUTCDate() + 1,
    0, 0, 0, 0
  ));

  const diffMs = Math.max(0, tomorrowUTC.getTime() - utcNow.getTime());
  const remainingSeconds = Math.floor(diffMs / 1000);
  const remainingHours = Math.floor(remainingSeconds / 3600);
  const remainingMinutes = Math.floor((remainingSeconds % 3600) / 60);

  const formattedCountdown = `${remainingHours}h ${remainingMinutes}m`;

  return {
    remainingSeconds,
    remainingHours,
    remainingMinutes,
    formattedCountdown,
  };
}

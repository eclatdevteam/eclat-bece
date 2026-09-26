/**
 * Éclat Points (EP) Calculation Engine
 * Implements Section 3 of the Éclat Platform Specification PRD
 */

import {
  DifficultyLevel,
  SessionQuestionInput,
  SessionPointResult,
  PointBreakdownItem,
} from "./types";

/**
 * Base EP by Difficulty Level (PRD Section 3.1)
 */
export const BASE_EP_MAP: Record<DifficultyLevel, number> = {
  easy: 5,
  medium: 10,
  hard: 20,
  challenge: 30,
};

/**
 * Speed bonus constants (PRD Section 3.7)
 */
export const SPEED_BONUS_TIER1_EP = 3; // <= 50% expected time
export const SPEED_BONUS_TIER2_EP = 1; // 51% - 75% expected time
export const SPEED_BONUS_MIN_SECONDS = 3.0; // Anti-guessing floor (< 3.0s disqualified)
export const SPEED_BONUS_SESSION_CAP = 30; // Max speed bonus per session

/**
 * Focus area constants (PRD Section 3.3)
 */
export const FOCUS_QUESTION_MULTIPLIER = 0.25; // +25% Focus Bonus on correct answer
export const FOCUS_SESSION_MIN_QUESTIONS = 10;
export const FOCUS_SESSION_MIN_ACCURACY = 70; // 70%
export const FOCUS_SESSION_COMPLETION_BONUS_EP = 30;

/**
 * Minimum questions required for Session Accuracy Multiplier (PRD Section 3.2)
 */
export const MIN_QUESTIONS_FOR_ACCURACY_MULTIPLIER = 5;

/**
 * Get accuracy multiplier percentage according to PRD Section 3.2
 */
export function getAccuracyMultiplier(accuracyPercent: number): number {
  if (accuracyPercent >= 100) return 0.30;
  if (accuracyPercent >= 90) return 0.20;
  if (accuracyPercent >= 80) return 0.15;
  if (accuracyPercent >= 70) return 0.10;
  if (accuracyPercent >= 50) return 0.05;
  return 0.0;
}

/**
 * Calculate single question speed bonus
 */
export function calculateQuestionSpeedBonus(
  isCorrect: boolean,
  timeSpentSeconds?: number,
  expectedTimeSeconds?: number
): number {
  if (!isCorrect) return 0;
  if (timeSpentSeconds === undefined || expectedTimeSeconds === undefined) return 0;
  if (expectedTimeSeconds <= 0) return 0;

  // Anti-guessing floor: under 3.0 seconds is immediately disqualified
  if (timeSpentSeconds < SPEED_BONUS_MIN_SECONDS) {
    return 0;
  }

  const ratio = timeSpentSeconds / expectedTimeSeconds;
  if (ratio <= 0.50) {
    return SPEED_BONUS_TIER1_EP;
  }
  if (ratio <= 0.75) {
    return SPEED_BONUS_TIER2_EP;
  }

  return 0;
}

/**
 * Evaluates a complete practice session and generates an itemized points ledger
 */
export function calculateSessionPoints(
  questions: SessionQuestionInput[],
  isDedicatedFocusSession: boolean = false
): SessionPointResult {
  const breakdown: PointBreakdownItem[] = [];

  let rawBaseEP = 0;
  let rawFocusBonus = 0;
  let rawSpeedBonus = 0;
  let correctCount = 0;

  questions.forEach((q, index) => {
    if (q.isCorrect) {
      correctCount += 1;
      const baseForQ = BASE_EP_MAP[q.difficulty] ?? 10;
      rawBaseEP += baseForQ;

      // Focus area question bonus (+25% of base EP)
      if (q.isFocusArea) {
        const focusForQ = Math.round(baseForQ * FOCUS_QUESTION_MULTIPLIER);
        rawFocusBonus += focusForQ;
      }

      // Speed bonus
      const speedForQ = calculateQuestionSpeedBonus(
        q.isCorrect,
        q.timeSpentSeconds,
        q.expectedTimeSeconds
      );
      rawSpeedBonus += speedForQ;
    }
  });

  // Apply speed bonus session cap (+30 EP max)
  const cappedSpeedBonus = Math.min(rawSpeedBonus, SPEED_BONUS_SESSION_CAP);

  // Add Base EP to breakdown
  if (rawBaseEP > 0) {
    breakdown.push({
      category: "base",
      label: "Base Question Points",
      amount: rawBaseEP,
      description: `${correctCount} correct questions answered`,
    });
  }

  // Calculate session accuracy
  const totalQuestions = questions.length;
  const accuracyPercentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

  // Calculate Accuracy Multiplier Bonus (applied to session base EP for >= 5 questions)
  let accuracyMultiplierBonus = 0;
  if (totalQuestions >= MIN_QUESTIONS_FOR_ACCURACY_MULTIPLIER) {
    const multiplier = getAccuracyMultiplier(accuracyPercentage);
    if (multiplier > 0) {
      accuracyMultiplierBonus = Math.round(rawBaseEP * multiplier);
      breakdown.push({
        category: "accuracy_multiplier",
        label: `Accuracy Multiplier (+${Math.round(multiplier * 100)}%)`,
        amount: accuracyMultiplierBonus,
        description: `Achieved ${Math.round(accuracyPercentage)}% session accuracy`,
      });
    }
  }

  // Add Focus Question Bonus to breakdown
  if (rawFocusBonus > 0) {
    breakdown.push({
      category: "focus_bonus",
      label: "Weak-Topic Focus Bonus (+25%)",
      amount: rawFocusBonus,
      description: "Answered questions in designated Focus Areas",
    });
  }

  // Add Speed Bonus to breakdown
  if (cappedSpeedBonus > 0) {
    breakdown.push({
      category: "speed_bonus",
      label: "Calibrated Speed Bonus",
      amount: cappedSpeedBonus,
      description: rawSpeedBonus > SPEED_BONUS_SESSION_CAP 
        ? `Fast & accurate answers (capped at +${SPEED_BONUS_SESSION_CAP} EP)`
        : "Fast & accurate cognitive fluency bonuses",
    });
  }

  // Targeted Focus Session Completion Bonus (+30 EP flat for >=10 Qs at >=70%)
  let sessionBonus = 0;
  if (
    isDedicatedFocusSession &&
    totalQuestions >= FOCUS_SESSION_MIN_QUESTIONS &&
    accuracyPercentage >= FOCUS_SESSION_MIN_ACCURACY
  ) {
    sessionBonus += FOCUS_SESSION_COMPLETION_BONUS_EP;
    breakdown.push({
      category: "session_bonus",
      label: "Focus Area Mastery Completion",
      amount: FOCUS_SESSION_COMPLETION_BONUS_EP,
      description: `Completed 10+ focus questions with ${Math.round(accuracyPercentage)}% accuracy`,
    });
  }

  const totalEP = rawBaseEP + accuracyMultiplierBonus + rawFocusBonus + cappedSpeedBonus + sessionBonus;

  return {
    baseEP: rawBaseEP,
    accuracyMultiplierBonus,
    accuracyPercentage,
    focusBonus: rawFocusBonus,
    speedBonus: cappedSpeedBonus,
    sessionBonus,
    totalEP,
    breakdown,
  };
}

/**
 * Topic Mastery & Diagnostic Engine
 * Implements Section 2, Section 3.3, and Section 3.4 of the Éclat Platform Specification PRD
 */

import {
  TopicStatus,
  TopicMasteryState,
  MasteryEvaluationResult,
  ComebackCheckInput,
} from "./types";

export const ROLLING_WINDOW_SIZE = 30;
export const MIN_ATTEMPTS_FOR_WEAK_FLAG = 10;
export const WEAK_ACCURACY_CEILING = 60.0; // < 60% is Weak
export const STRONG_ACCURACY_FLOOR = 80.0; // >= 80% is Strong

export const WEAK_TO_DEVELOPING_BONUS_EP = 75;
export const DEVELOPING_TO_STRONG_BONUS_EP = 100;
export const MASTERY_JUMP_THRESHOLD_POINTS = 15;
export const MASTERY_JUMP_BONUS_EP = 50;

export const COMEBACK_BONUS_EP = 50;
export const COMEBACK_QUALIFYING_MIN_QUESTIONS = 10;
export const COMEBACK_QUALIFYING_MIN_ACCURACY = 75;
export const COMEBACK_WINDOW_DAYS = 14;

/**
 * Classifies a topic into 'weak' | 'developing' | 'strong'
 */
export function classifyTopicStatus(
  accuracyPercentage: number,
  totalAttempts: number
): TopicStatus {
  if (accuracyPercentage >= STRONG_ACCURACY_FLOOR) {
    return "strong";
  }
  if (totalAttempts >= MIN_ATTEMPTS_FOR_WEAK_FLAG && accuracyPercentage < WEAK_ACCURACY_CEILING) {
    return "weak";
  }
  return "developing";
}

/**
 * Updates a topic's rolling buffer with new answers and determines any graduation or jump bonuses
 */
export function updateTopicMastery(
  currentState: TopicMasteryState,
  newAnswers: boolean[]
): MasteryEvaluationResult {
  const previousStatus = currentState.status;
  const previousAccuracy = currentState.rollingAccuracy;

  // Append new answers to the rolling buffer (keep last 30)
  const combined = [...currentState.rollingAnswers, ...newAnswers];
  const updatedRollingAnswers = combined.slice(-ROLLING_WINDOW_SIZE);
  const totalAttempted = currentState.totalAttempted + newAnswers.length;

  const correctCount = updatedRollingAnswers.filter(Boolean).length;
  const newAccuracy = updatedRollingAnswers.length > 0 
    ? Math.round((correctCount / updatedRollingAnswers.length) * 100) 
    : 0;

  const newStatus = classifyTopicStatus(newAccuracy, totalAttempted);
  const accuracyDelta = newAccuracy - previousAccuracy;

  let statusGraduationBonusEP = 0;
  const statusChanged = previousStatus !== newStatus;

  // Weak -> Developing (+75 EP)
  if (previousStatus === "weak" && (newStatus === "developing" || newStatus === "strong")) {
    statusGraduationBonusEP += WEAK_TO_DEVELOPING_BONUS_EP;
  }

  // Developing -> Strong (+100 EP)
  if ((previousStatus === "weak" || previousStatus === "developing") && newStatus === "strong") {
    statusGraduationBonusEP += DEVELOPING_TO_STRONG_BONUS_EP;
  }

  // Material Mastery Jump (>= 15 percentage points gain)
  let masteryJumpBonusEP = 0;
  if (accuracyDelta >= MASTERY_JUMP_THRESHOLD_POINTS && previousAccuracy > 0) {
    masteryJumpBonusEP += MASTERY_JUMP_BONUS_EP;
  }

  const totalBonusEP = statusGraduationBonusEP + masteryJumpBonusEP;

  return {
    previousStatus,
    newStatus,
    previousAccuracy,
    newAccuracy,
    accuracyDelta,
    statusGraduationBonusEP,
    masteryJumpBonusEP,
    totalBonusEP,
    updatedRollingAnswers,
    statusChanged,
  };
}

/**
 * Evaluates whether a session triggers the Comeback Recovery Bonus (PRD Section 3.4)
 */
export function evaluateComebackBonus(input: ComebackCheckInput): {
  eligible: boolean;
  bonusEP: number;
  reason?: string;
} {
  // Condition 1: Previous score was < 50%
  if (input.previousScorePercentage >= 50) {
    return { eligible: false, bonusEP: 0, reason: "Previous score was not < 50%" };
  }

  // Condition 2: Current session is at least 10 questions
  if (input.currentSessionQuestionCount < COMEBACK_QUALIFYING_MIN_QUESTIONS) {
    return { eligible: false, bonusEP: 0, reason: "Current session must have at least 10 questions" };
  }

  // Condition 3: Current session accuracy is >= 75%
  if (input.currentScorePercentage < COMEBACK_QUALIFYING_MIN_ACCURACY) {
    return { eligible: false, bonusEP: 0, reason: "Current session score must be >= 75%" };
  }

  // Condition 4: Within 14-day window
  const prevDate = new Date(input.previousAssessedAt).getTime();
  const currDate = new Date(input.currentAssessedAt).getTime();
  const daysDiff = (currDate - prevDate) / (1000 * 60 * 60 * 24);

  if (daysDiff < 0 || daysDiff > COMEBACK_WINDOW_DAYS) {
    return { eligible: false, bonusEP: 0, reason: "Session fell outside 14-day comeback window" };
  }

  // Condition 5: 14-day cooldown check since last comeback bonus
  if (input.lastComebackAwardedAt) {
    const lastAwardDate = new Date(input.lastComebackAwardedAt).getTime();
    const cooldownDaysDiff = (currDate - lastAwardDate) / (1000 * 60 * 60 * 24);
    if (cooldownDaysDiff < COMEBACK_WINDOW_DAYS) {
      return { eligible: false, bonusEP: 0, reason: "Comeback bonus is on cooldown (max once per 14-day window)" };
    }
  }

  return {
    eligible: true,
    bonusEP: COMEBACK_BONUS_EP,
    reason: "Resilience verified! Scored <50% previously and bounced back with >=75% on 10+ questions.",
  };
}

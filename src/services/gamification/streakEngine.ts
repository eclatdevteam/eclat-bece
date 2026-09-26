/**
 * Daily Practice Streaks & Streak Shields Engine
 * Implements Section 3.5 of the Éclat Platform Specification PRD
 */

import {
  StreakState,
  StreakEvaluationInput,
  StreakEvaluationResult,
} from "./types";

export const STREAK_QUALIFYING_MIN_QUESTIONS = 10;
export const MAX_STREAK_SHIELDS = 2;

export interface StreakMilestone {
  bonusEP: number;
  label: string;
}

export const STREAK_MILESTONE_MAP: Record<number, StreakMilestone> = {
  2: { bonusEP: 10, label: "Habit Initiation" },
  3: { bonusEP: 15, label: "Early Momentum" },
  5: { bonusEP: 30, label: "Workweek Dedication" },
  7: { bonusEP: 50, label: "One Week Strong" },
  14: { bonusEP: 100, label: "Two Weeks Locked In" },
  30: { bonusEP: 250, label: "Monthly Master" },
  60: { bonusEP: 500, label: "Study Machine" },
  100: { bonusEP: 1000, label: "Century Club Elite" },
};

export const SUSTAINED_STREAK_DAILY_EP = 25; // Day 101+

/**
 * Calculates day difference between two UTC calendar date strings (YYYY-MM-DD)
 */
export function getCalendarDayDifference(earlierDateStr: string, laterDateStr: string): number {
  const d1 = new Date(`${earlierDateStr}T00:00:00Z`).getTime();
  const d2 = new Date(`${laterDateStr}T00:00:00Z`).getTime();
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}

/**
 * Get milestone bonus and label for a given consecutive day count
 */
export function getStreakMilestoneBonus(streakDay: number): StreakMilestone | null {
  if (STREAK_MILESTONE_MAP[streakDay]) {
    return STREAK_MILESTONE_MAP[streakDay];
  }
  if (streakDay > 100) {
    return {
      bonusEP: SUSTAINED_STREAK_DAILY_EP,
      label: "Maintenance Floor",
    };
  }
  return null;
}

/**
 * Evaluates a daily activity against the student's streak state
 */
export function evaluateDailyStreak(input: StreakEvaluationInput): StreakEvaluationResult {
  const { currentState, dateUTC, questionsAnsweredToday, dailyChallengeCompletedToday } = input;

  // Verify minimum qualifying activity (10 questions or 1 Daily Challenge)
  const isQualifying = questionsAnsweredToday >= STREAK_QUALIFYING_MIN_QUESTIONS || !!dailyChallengeCompletedToday;

  if (!isQualifying) {
    return {
      newState: { ...currentState },
      streakIncremented: false,
      streakPreservedByShield: false,
      streakBroken: false,
      streakBonusEP: 0,
    };
  }

  // If this is the student's very first qualifying activity
  if (!currentState.lastQualifyingDate) {
    const newState: StreakState = {
      currentStreak: 1,
      longestStreak: Math.max(currentState.longestStreak, 1),
      lastQualifyingDate: dateUTC,
      streakShields: currentState.streakShields,
    };
    return {
      newState,
      streakIncremented: true,
      streakPreservedByShield: false,
      streakBroken: false,
      streakBonusEP: 0,
    };
  }

  const daysDiff = getCalendarDayDifference(currentState.lastQualifyingDate, dateUTC);

  // Activity already recorded for this calendar day: no increment
  if (daysDiff === 0) {
    return {
      newState: { ...currentState },
      streakIncremented: false,
      streakPreservedByShield: false,
      streakBroken: false,
      streakBonusEP: 0,
    };
  }

  // Exactly next calendar day: consecutive streak continues
  if (daysDiff === 1) {
    const nextStreak = currentState.currentStreak + 1;
    const milestone = getStreakMilestoneBonus(nextStreak);

    // Check if hitting a multiple of 30 days awards a streak shield
    let shields = currentState.streakShields;
    if (nextStreak % 30 === 0 && shields < MAX_STREAK_SHIELDS) {
      shields += 1;
    }

    const newState: StreakState = {
      currentStreak: nextStreak,
      longestStreak: Math.max(currentState.longestStreak, nextStreak),
      lastQualifyingDate: dateUTC,
      streakShields: shields,
    };

    return {
      newState,
      streakIncremented: true,
      streakPreservedByShield: false,
      streakBroken: false,
      streakBonusEP: milestone?.bonusEP ?? 0,
      milestoneClassification: milestone?.label,
    };
  }

  // Missed one calendar day (daysDiff === 2): check for Streak Shield
  if (daysDiff === 2 && currentState.streakShields > 0) {
    // Shield auto-consumes to save streak, and the streak advances
    const nextStreak = currentState.currentStreak + 1;
    const milestone = getStreakMilestoneBonus(nextStreak);

    const newState: StreakState = {
      currentStreak: nextStreak,
      longestStreak: Math.max(currentState.longestStreak, nextStreak),
      lastQualifyingDate: dateUTC,
      streakShields: currentState.streakShields - 1, // Consume shield
    };

    return {
      newState,
      streakIncremented: true,
      streakPreservedByShield: true,
      streakBroken: false,
      streakBonusEP: milestone?.bonusEP ?? 0,
      milestoneClassification: milestone?.label,
    };
  }

  // Streak broken (gap > 1 day with no shields): resets to 1
  const newState: StreakState = {
    currentStreak: 1,
    longestStreak: currentState.longestStreak,
    lastQualifyingDate: dateUTC,
    streakShields: currentState.streakShields,
  };

  return {
    newState,
    streakIncremented: true,
    streakPreservedByShield: false,
    streakBroken: true,
    streakBonusEP: 0,
  };
}

/**
 * Handles awarding a Streak Shield through academic milestones
 */
export function awardStreakShield(
  currentShields: number,
  weakTopicsToStrongCount: number
): { shieldsAwarded: number; newShieldCount: number } {
  if (currentShields >= MAX_STREAK_SHIELDS) {
    return { shieldsAwarded: 0, newShieldCount: currentShields };
  }

  // 1 shield awarded for every 3 weak topics transitioned to 'Strong' status
  if (weakTopicsToStrongCount > 0 && weakTopicsToStrongCount % 3 === 0) {
    const newShieldCount = Math.min(MAX_STREAK_SHIELDS, currentShields + 1);
    return { shieldsAwarded: newShieldCount - currentShields, newShieldCount };
  }

  return { shieldsAwarded: 0, newShieldCount: currentShields };
}

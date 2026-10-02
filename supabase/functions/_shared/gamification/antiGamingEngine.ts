/**
 * Anti-Gaming & Integrity Enforcement Engine
 * Implements Section 4 of the Éclat Platform Specification PRD
 */

export interface AntiGamingContext {
  studentClassYear?: "year_6" | "year_9" | null;
  questionClassYear?: "year_6" | "year_9" | null;
  hasStrongMasteryInSubject?: boolean; // >=80%
  downTierQuestionsAnsweredToday?: number;
  lastAttemptedAt?: string | number | Date | null;
  timeSpentSeconds?: number;
}

export interface AntiGamingQuestionResult {
  allowed: boolean;
  epMultiplier: number; // 1.0 (full), 0.5 (decay), 0.0 (blocked)
  flaggedReason?: "rapid_guessing" | "down_tier_decay" | "down_tier_ceiling" | "duplicate_cooldown";
}

export const RAPID_GUESSING_THRESHOLD_SECONDS = 2.5; // PRD §4.3
export const DUPLICATE_COOLDOWN_HOURS = 4; // PRD §4.4: 4 hours
export const DOWN_TIER_FULL_LIMIT = 15; // PRD §4.1: full EP up to 15 questions
export const DOWN_TIER_DECAY_LIMIT = 30; // PRD §4.1: 50% EP up to 30 questions, 0% after
export const DAILY_SPEED_BONUS_CAP = 50; // PRD §4.6: Max 50 EP speed bonus per day
export const MAX_HEAD_TO_HEAD_COLLUSION_MATCHES = 2; // PRD §4.5: Max 2 point-yielding matches per pair/day

/**
 * Evaluates a single question attempt for anti-gaming rules
 */
export function evaluateQuestionAttemptAntiGaming(
  context: AntiGamingContext
): AntiGamingQuestionResult {
  // 1. Rapid Guessing / Botting (< 2.5 seconds)
  if (context.timeSpentSeconds !== undefined && context.timeSpentSeconds < RAPID_GUESSING_THRESHOLD_SECONDS) {
    return {
      allowed: true,
      epMultiplier: 0.0,
      flaggedReason: "rapid_guessing",
    };
  }

  // 2. Duplicate Question Repetition (within 4 hours)
  if (context.lastAttemptedAt) {
    const lastAttemptTime = new Date(context.lastAttemptedAt).getTime();
    const now = Date.now();
    const elapsedHours = (now - lastAttemptTime) / (1000 * 60 * 60);

    if (elapsedHours < DUPLICATE_COOLDOWN_HOURS) {
      return {
        allowed: true,
        epMultiplier: 0.0,
        flaggedReason: "duplicate_cooldown",
      };
    }
  }

  // 3. Down-Tier Farming (Year 9 student answering Year 6 questions with Strong mastery)
  const isDownTier =
    context.studentClassYear === "year_9" &&
    context.questionClassYear === "year_6" &&
    !!context.hasStrongMasteryInSubject;

  if (isDownTier) {
    const currentDownTierCount = context.downTierQuestionsAnsweredToday ?? 0;
    if (currentDownTierCount >= DOWN_TIER_DECAY_LIMIT) {
      return {
        allowed: true,
        epMultiplier: 0.0,
        flaggedReason: "down_tier_ceiling",
      };
    }
    if (currentDownTierCount >= DOWN_TIER_FULL_LIMIT) {
      return {
        allowed: true,
        epMultiplier: 0.5,
        flaggedReason: "down_tier_decay",
      };
    }
  }

  return {
    allowed: true,
    epMultiplier: 1.0,
  };
}

/**
 * Question Churning & Refresh Check (PRD §4.2)
 * Triggers 10-minute cooldown if student abandons >5 sessions in 2 minutes
 */
export function checkQuestionChurningCooldown(
  abandonedTimestamps: (number | Date)[]
): { inCooldown: boolean; remainingCooldownSeconds: number } {
  const now = Date.now();
  const twoMinutesAgo = now - 2 * 60 * 1000;

  // Filter abandons within last 2 minutes
  const recentAbandons = abandonedTimestamps
    .map((t) => (typeof t === "number" ? t : new Date(t).getTime()))
    .filter((t) => t >= twoMinutesAgo);

  if (recentAbandons.length > 5) {
    // 10-minute cooldown from the most recent abandon
    const latestAbandon = Math.max(...recentAbandons);
    const cooldownExpiresAt = latestAbandon + 10 * 60 * 1000;
    const remainingMs = cooldownExpiresAt - now;

    if (remainingMs > 0) {
      return {
        inCooldown: true,
        remainingCooldownSeconds: Math.ceil(remainingMs / 1000),
      };
    }
  }

  return { inCooldown: false, remainingCooldownSeconds: 0 };
}

/**
 * Head-to-head collusion check (PRD §4.5)
 * Limits point yield to max 2 matches between same pair per 24 hours
 */
export function isHeadToHeadMatchEligibleForPoints(
  matchesAgainstOpponentInLast24h: number
): boolean {
  return matchesAgainstOpponentInLast24h < MAX_HEAD_TO_HEAD_COLLUSION_MATCHES;
}

/**
 * Daily Speed Bonus Cap Check (PRD §4.6)
 */
export function applyDailySpeedBonusCap(
  speedBonusEarnedToday: number,
  prospectiveSpeedBonus: number
): number {
  const remainingAllowance = Math.max(0, DAILY_SPEED_BONUS_CAP - speedBonusEarnedToday);
  return Math.min(prospectiveSpeedBonus, remainingAllowance);
}

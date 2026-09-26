/**
 * Éclat Platform Gamification Types
 * Implements the 19-Page Éclat Platform Specification PRD
 */

export type DifficultyLevel = "easy" | "medium" | "hard" | "challenge";

export interface SessionQuestionInput {
  questionId: string;
  difficulty: DifficultyLevel;
  isCorrect: boolean;
  timeSpentSeconds?: number;
  expectedTimeSeconds?: number;
  isFocusArea?: boolean;
}

export interface PointBreakdownItem {
  category: "base" | "accuracy_multiplier" | "focus_bonus" | "speed_bonus" | "session_bonus" | "streak_bonus" | "challenge_bonus" | "milestone_bonus";
  label: string;
  amount: number;
  description?: string;
}

export interface SessionPointResult {
  baseEP: number;
  accuracyMultiplierBonus: number;
  accuracyPercentage: number;
  focusBonus: number;
  speedBonus: number;
  sessionBonus: number;
  totalEP: number;
  breakdown: PointBreakdownItem[];
}

export type TopicStatus = "weak" | "developing" | "strong";

export interface TopicMasteryState {
  subject: string;
  topic: string;
  rollingAnswers: boolean[]; // Max 30 recent answers
  rollingAccuracy: number;
  status: TopicStatus;
  totalAttempted: number;
  lastAssessedAt?: string;
}

export interface MasteryEvaluationResult {
  previousStatus: TopicStatus;
  newStatus: TopicStatus;
  previousAccuracy: number;
  newAccuracy: number;
  accuracyDelta: number;
  statusGraduationBonusEP: number;
  masteryJumpBonusEP: number;
  totalBonusEP: number;
  updatedRollingAnswers: boolean[];
  statusChanged: boolean;
}

export interface ComebackCheckInput {
  previousScorePercentage: number;
  previousAssessedAt: string; // ISO string
  currentSessionQuestionCount: number;
  currentScorePercentage: number;
  currentAssessedAt: string; // ISO string
  lastComebackAwardedAt?: string | null;
}

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastQualifyingDate: string | null; // YYYY-MM-DD (UTC)
  streakShields: number; // 0, 1, or 2
}

export interface StreakEvaluationInput {
  currentState: StreakState;
  dateUTC: string; // YYYY-MM-DD
  questionsAnsweredToday: number;
  dailyChallengeCompletedToday?: boolean;
}

export interface StreakEvaluationResult {
  newState: StreakState;
  streakIncremented: boolean;
  streakPreservedByShield: boolean;
  streakBroken: boolean;
  streakBonusEP: number;
  milestoneClassification?: string;
}

export interface DailyChallengeInput {
  completedQuestions: number; // Must be 10
  scorePercentage: number;
  alreadyCompletedToday: boolean;
}

export interface DailyChallengeResult {
  eligible: boolean;
  baseCompletionEP: number;
  accuracyTierEP: number;
  totalEP: number;
  reason?: string;
}

export interface StudentLevelInfo {
  level: number;
  lifetimeEP: number;
  currentLevelMinEP: number;
  nextLevelMinEP: number;
  progressPercent: number;
  title?: string;
  unlockedFeatures: string[];
}

export type LeagueTierNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface LeagueTierConfig {
  tier: LeagueTierNumber;
  name: string;
  badge: string;
  color: string;
  borderColor: string;
  bgColor: string;
  description: string;
  minLevel: number;
}

export type CohortZone = "promotion" | "retained" | "relegation";

export type WeeklyLeagueOutcome = "promoted" | "retained" | "relegated" | "champion_retained";

export interface CohortMember {
  studentId: string;
  name: string;
  username?: string;
  avatarUrl?: string;
  schoolName?: string;
  weeklyEP: number;
  rank: number;
  zone: CohortZone;
  isCurrentUser?: boolean;
}

export interface WeeklyLeagueEvaluation {
  previousTier: LeagueTierNumber;
  newTier: LeagueTierNumber;
  outcome: WeeklyLeagueOutcome;
  rank: number;
  cohortSize: number;
  summaryMessage: string;
}

export interface WeeklyCohortWindow {
  weekStartDate: string; // YYYY-MM-DD
  weekEndDate: string; // YYYY-MM-DD (Sunday)
  timeRemainingSeconds: number;
  formattedCountdown: string;
  isResetDay: boolean;
}

export type ArenaMatchOutcome = "win" | "draw" | "loss";

export interface ArenaMatchInput {
  outcome: ArenaMatchOutcome;
  playerTier: number;
  opponentTier: number;
  playerRank?: number;
  opponentRank?: number;
  currentWinStreak: number;
  matchesBetweenPairToday: number;
}

export interface ArenaMatchResult {
  outcome: ArenaMatchOutcome;
  baseEP: number;
  upsetBonusEP: number;
  streakBonusEP: number;
  totalEP: number;
  newWinStreak: number;
  isUpset: boolean;
  cappedByCollusion: boolean;
  breakdown: PointBreakdownItem[];
}

export interface ArenaChallenge {
  id: string;
  challengerId: string;
  opponentId: string;
  challengerName: string;
  opponentName: string;
  challengerSchool?: string;
  opponentSchool?: string;
  subject: string;
  topic?: string;
  numberOfQuestions: number;
  maxTimeSeconds: number;
  status: "pending" | "accepted" | "declined" | "completed" | "expired";
  challengerScore?: number;
  challengerTimeSeconds?: number;
  opponentScore?: number;
  opponentTimeSeconds?: number;
  winnerId?: string | null;
  challengerEP?: number;
  opponentEP?: number;
  createdAt: string;
  completedAt?: string;
}

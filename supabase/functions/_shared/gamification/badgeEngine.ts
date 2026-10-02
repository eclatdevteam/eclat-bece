/**
 * Core Badge Evaluation Engine (18 Initial Launch Badges)
 * Implements Section 8, Section 11.1 (Epic BDG-01) of the Éclat Platform Specification PRD
 */

export type BadgeRarity = "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";

export interface BadgeDefinition {
  id: string;
  title: string;
  category: string;
  rarity: BadgeRarity;
  rewardEP: number;
  triggerCriteria: string;
  celebrationCopy: string;
  icon: string;
}

export const INITIAL_18_BADGES: BadgeDefinition[] = [
  // Category 1: Subject & Topic Mastery
  {
    id: "number_ninja",
    title: "Number Ninja",
    category: "Subject & Topic Mastery",
    rarity: "uncommon",
    rewardEP: 100,
    triggerCriteria: "Achieve 80%+ mastery across 5 Number/Arithmetic topics.",
    celebrationCopy: "Master of operations! Your number sense is razor-sharp.",
    icon: "🧮",
  },
  {
    id: "grammar_guardian",
    title: "Grammar Guardian",
    category: "Subject & Topic Mastery",
    rarity: "uncommon",
    rewardEP: 100,
    triggerCriteria: "Achieve 80%+ mastery across 5 English Grammar topics.",
    celebrationCopy: "Flawless structure! You are the protector of proper grammar.",
    icon: "🛡️",
  },
  {
    id: "algebra_ace",
    title: "Algebra Ace",
    category: "Subject & Topic Mastery",
    rarity: "rare",
    rewardEP: 150,
    triggerCriteria: "Achieve 80%+ mastery across all BECE Algebra units.",
    celebrationCopy: "Equations conquered! You solve for X without breaking a sweat.",
    icon: "📐",
  },

  // Category 2: Weakness-Conquest
  {
    id: "weakness_hunter",
    title: "Weakness Hunter",
    category: "Weakness-Conquest",
    rarity: "common",
    rewardEP: 50,
    triggerCriteria: "Transition 1 identified weak topic to 'Developing' status.",
    celebrationCopy: "First target down! You confronted your weakness directly.",
    icon: "🎯",
  },
  {
    id: "no_longer_weak",
    title: "No Longer Weak",
    category: "Weakness-Conquest",
    rarity: "rare",
    rewardEP: 150,
    triggerCriteria: "Complete a full transformation of 1 weak topic into 'Strong' (>=80%).",
    celebrationCopy: "Total turnaround! A former struggle is now a signature strength.",
    icon: "💪",
  },
  {
    id: "comeback_kid",
    title: "Comeback Kid",
    category: "Weakness-Conquest",
    rarity: "uncommon",
    rewardEP: 100,
    triggerCriteria: "Improve a topic's assessment score by >=30 percentage points.",
    celebrationCopy: "Resilience defined! You bounced back from a setback with authority.",
    icon: "🚀",
  },

  // Category 3: Daily Consistency & Habit
  {
    id: "first_step",
    title: "First Step",
    category: "Daily Consistency & Habit",
    rarity: "common",
    rewardEP: 25,
    triggerCriteria: "Complete your very first practice session on Éclat.",
    celebrationCopy: "Your journey begins! Welcome to deliberate practice.",
    icon: "🌱",
  },
  {
    id: "getting_serious",
    title: "Getting Serious",
    category: "Daily Consistency & Habit",
    rarity: "common",
    rewardEP: 50,
    triggerCriteria: "Maintain a 3-day continuous practice streak.",
    celebrationCopy: "Three days in a row! You are building momentum.",
    icon: "🔥",
  },
  {
    id: "one_week_strong",
    title: "One Week Strong",
    category: "Daily Consistency & Habit",
    rarity: "uncommon",
    rewardEP: 100,
    triggerCriteria: "Maintain a 7-day continuous practice streak.",
    celebrationCopy: "A full week of non-stop learning! The habit is taking root.",
    icon: "⚡",
  },

  // Category 4: Precision & Accuracy
  {
    id: "sharp_shooter",
    title: "Sharp Shooter",
    category: "Precision & Accuracy",
    rarity: "common",
    rewardEP: 50,
    triggerCriteria: "Achieve 80%+ accuracy in any session of 10+ questions.",
    celebrationCopy: "Bullseye! Sharp thinking and high accuracy.",
    icon: "🏹",
  },
  {
    id: "almost_perfect",
    title: "Almost Perfect",
    category: "Precision & Accuracy",
    rarity: "uncommon",
    rewardEP: 100,
    triggerCriteria: "Score 90%+ across 5 qualifying sessions of 10+ questions.",
    celebrationCopy: "Near perfection! Your accuracy is consistently stellar.",
    icon: "✨",
  },
  {
    id: "perfectionist",
    title: "Perfectionist",
    category: "Precision & Accuracy",
    rarity: "rare",
    rewardEP: 150,
    triggerCriteria: "Score 100% on any qualifying challenge of 10+ questions.",
    celebrationCopy: "Zero mistakes! Flawless execution from start to finish.",
    icon: "💎",
  },

  // Category 6: Difficulty & Bravery
  {
    id: "brave_one",
    title: "Brave One",
    category: "Difficulty & Bravery",
    rarity: "common",
    rewardEP: 50,
    triggerCriteria: "Complete your first Hard-difficulty practice set.",
    celebrationCopy: "Fearless start! You didn't settle for easy points.",
    icon: "🦁",
  },

  // Category 7: Subject Balance
  {
    id: "double_threat",
    title: "Double Threat",
    category: "Subject Balance",
    rarity: "uncommon",
    rewardEP: 100,
    triggerCriteria: "Achieve 70%+ mastery in both Mathematics and English.",
    celebrationCopy: "No blind spots! You excel with numbers and words alike.",
    icon: "⚖️",
  },

  // Category 8: Personal Improvement
  {
    id: "level_up",
    title: "Level Up",
    category: "Personal Improvement",
    rarity: "common",
    rewardEP: 50,
    triggerCriteria: "Improve your overall platform accuracy by 10 percentage points.",
    celebrationCopy: "Tangible progress! Your accuracy curve is rising.",
    icon: "📈",
  },

  // Category 9: Exploration & Curiosity
  {
    id: "explorer",
    title: "Explorer",
    category: "Exploration & Curiosity",
    rarity: "common",
    rewardEP: 50,
    triggerCriteria: "Attempt questions across 5 distinct syllabus topics.",
    celebrationCopy: "Curiosity engaged! You are broadening your horizons.",
    icon: "🧭",
  },

  // Category 5: Competitive & Arena
  {
    id: "first_blood",
    title: "First Blood",
    category: "Competitive & Arena",
    rarity: "common",
    rewardEP: 50,
    triggerCriteria: "Win your first head-to-head competitive challenge.",
    celebrationCopy: "Victory! You tasted your first arena triumph.",
    icon: "⚔️",
  },
  {
    id: "top_100",
    title: "Top 100",
    category: "Competitive & Arena",
    rarity: "rare",
    rewardEP: 150,
    triggerCriteria: "Finish within the Top 100 on an official weekly leaderboard.",
    celebrationCopy: "Ranked among the nation's Top 100 scholars.",
    icon: "🏆",
  },
];

// Category 12: Ultra-Rare Mythic Achievements (PRD Section 8.3 & Section 11.3)
export const MYTHIC_BADGES: BadgeDefinition[] = [
  {
    id: "perfect_week",
    title: "Perfect Week",
    category: "Category 12: Mythic Achievements",
    rarity: "mythic",
    rewardEP: 500,
    triggerCriteria: "Complete 7 Daily Challenges in a single week with 95%+ accuracy.",
    celebrationCopy: "Immaculate consistency! 7 flawless daily challenges in 7 days.",
    icon: "👑",
  },
  {
    id: "grandmaster",
    title: "Grandmaster",
    category: "Category 12: Mythic Achievements",
    rarity: "mythic",
    rewardEP: 750,
    triggerCriteria: "Achieve promotion to League Tier 8 (Éclat Champion).",
    celebrationCopy: "Peak academic elite! You stand in the highest league tier in the country.",
    icon: "🏆",
  },
  {
    id: "double_grandmaster",
    title: "Double Grandmaster",
    category: "Category 12: Mythic Achievements",
    rarity: "mythic",
    rewardEP: 1000,
    triggerCriteria: "Achieve 90%+ curriculum mastery across both Mathematics and English Language.",
    celebrationCopy: "Bilingual genius of equations and language! Total mastery of core disciplines.",
    icon: "⚡",
  },
  {
    id: "the_one_percent",
    title: "The One Percent",
    category: "Category 12: Mythic Achievements",
    rarity: "mythic",
    rewardEP: 1000,
    triggerCriteria: "Rank within the top 1% nationally in an official term or national championship.",
    celebrationCopy: "One in a hundred! You are among the top 1% of all scholars nationally.",
    icon: "🌌",
  },
  {
    id: "invincible",
    title: "Invincible",
    category: "Category 12: Mythic Achievements",
    rarity: "mythic",
    rewardEP: 750,
    triggerCriteria: "Win 20 consecutive arena duel matches without a single defeat.",
    celebrationCopy: "Undefeated champion! 20 consecutive arena duel victories.",
    icon: "⚔️",
  },
  {
    id: "eclat_legend",
    title: "Éclat Legend",
    category: "Category 12: Mythic Achievements",
    rarity: "mythic",
    rewardEP: 2000,
    triggerCriteria: "Reach Student Level 50, maintain 90%+ overall mastery, and hold Champion League status.",
    celebrationCopy: "The pinnacle of educational excellence. Your name is etched in Éclat history.",
    icon: "🌟",
  },
];

export const ALL_BADGES: BadgeDefinition[] = [...INITIAL_18_BADGES, ...MYTHIC_BADGES];

export interface StudentContextData {
  totalSessionsCompleted: number;
  currentStreak: number;
  sessionQuestionsCount?: number;
  sessionAccuracyPercent?: number;
  isHardDifficultySession?: boolean;
  sessionsWith90PlusAccuracyCount?: number;
  mathMasteryPercent?: number;
  englishMasteryPercent?: number;
  distinctTopicsAttemptedCount?: number;
  weakTopicsTurnedDevelopingCount?: number;
  weakTopicsTurnedStrongCount?: number;
  maxScoreImprovementPercentagePoints?: number;
  competitiveWinsCount?: number;
  weeklyLeaderboardRank?: number;
  overallAccuracyImprovementPercent?: number;
  // Category 12 Mythic Context Fields
  consecutiveDailyChallenge95PlusCount?: number;
  leagueTier?: number;
  consecutiveArenaWinsCount?: number;
  nationalPercentileRank?: number; // e.g. <= 1 for top 1%
  currentLevel?: number;
  overallMasteryPercent?: number;
}

/**
 * Checks all available badges (initial 18 + Category 12 Mythic) against current student context data
 * Returns any newly unlocked badges that have not yet been earned
 */
export function evaluateBadgesToUnlock(
  context: StudentContextData,
  alreadyEarnedBadgeIds: string[],
  badgeList: BadgeDefinition[] = ALL_BADGES
): BadgeDefinition[] {
  const earnedSet = new Set(alreadyEarnedBadgeIds);
  const newlyUnlocked: BadgeDefinition[] = [];

  for (const badge of badgeList) {
    if (earnedSet.has(badge.id)) continue;

    let unlocked = false;

    switch (badge.id) {
      case "first_step":
        unlocked = context.totalSessionsCompleted >= 1;
        break;
      case "getting_serious":
        unlocked = context.currentStreak >= 3;
        break;
      case "one_week_strong":
        unlocked = context.currentStreak >= 7;
        break;
      case "sharp_shooter":
        unlocked = (context.sessionQuestionsCount ?? 0) >= 10 && (context.sessionAccuracyPercent ?? 0) >= 80;
        break;
      case "perfectionist":
        unlocked = (context.sessionQuestionsCount ?? 0) >= 10 && (context.sessionAccuracyPercent ?? 0) === 100;
        break;
      case "almost_perfect":
        unlocked = (context.sessionsWith90PlusAccuracyCount ?? 0) >= 5;
        break;
      case "brave_one":
        unlocked = !!context.isHardDifficultySession;
        break;
      case "double_threat":
        unlocked = (context.mathMasteryPercent ?? 0) >= 70 && (context.englishMasteryPercent ?? 0) >= 70;
        break;
      case "explorer":
        unlocked = (context.distinctTopicsAttemptedCount ?? 0) >= 5;
        break;
      case "weakness_hunter":
        unlocked = (context.weakTopicsTurnedDevelopingCount ?? 0) >= 1;
        break;
      case "no_longer_weak":
        unlocked = (context.weakTopicsTurnedStrongCount ?? 0) >= 1;
        break;
      case "comeback_kid":
        unlocked = (context.maxScoreImprovementPercentagePoints ?? 0) >= 30;
        break;
      case "first_blood":
        unlocked = (context.competitiveWinsCount ?? 0) >= 1;
        break;
      case "top_100":
        unlocked = (context.weeklyLeaderboardRank ?? 0) > 0 && (context.weeklyLeaderboardRank ?? 0) <= 100;
        break;
      case "level_up":
        unlocked = (context.overallAccuracyImprovementPercent ?? 0) >= 10;
        break;
      // Category 12 Ultra-Rare Mythic Achievements
      case "perfect_week":
        unlocked = (context.consecutiveDailyChallenge95PlusCount ?? 0) >= 7;
        break;
      case "grandmaster":
        unlocked = (context.leagueTier ?? 1) >= 8;
        break;
      case "double_grandmaster":
        unlocked = (context.mathMasteryPercent ?? 0) >= 90 && (context.englishMasteryPercent ?? 0) >= 90;
        break;
      case "the_one_percent":
        unlocked = (context.nationalPercentileRank !== undefined && context.nationalPercentileRank <= 1);
        break;
      case "invincible":
        unlocked = (context.consecutiveArenaWinsCount ?? 0) >= 20;
        break;
      case "eclat_legend":
        unlocked =
          (context.currentLevel ?? 1) >= 50 &&
          (context.overallMasteryPercent ?? 0) >= 90 &&
          (context.leagueTier ?? 1) >= 8;
        break;
      default:
        break;
    }

    if (unlocked) {
      newlyUnlocked.push(badge);
    }
  }

  return newlyUnlocked;
}

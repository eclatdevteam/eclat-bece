/**
 * Permanent Lifetime Level Progression Engine
 * Implements Section 6 of the Éclat Platform Specification PRD
 */

import { StudentLevelInfo } from "./types";

interface MilestoneConfig {
  minEP: number;
  title?: string;
  unlockedFeatures: string[];
}

export const LEVEL_MILESTONES: Record<number, MilestoneConfig> = {
  1: { minEP: 0, title: "Scholar", unlockedFeatures: ["Basic practice"] },
  2: { minEP: 250, title: "Scholar", unlockedFeatures: ["Daily challenge"] },
  3: { minEP: 600, title: "Scholar", unlockedFeatures: ["Badge Showcase slot #1"] },
  4: { minEP: 1200, title: "Competitor", unlockedFeatures: ["Head-to-head competitive mode"] },
  5: { minEP: 2000, title: "Competitor", unlockedFeatures: ["Bronze League qualification", "Showcase slot #2"] },
  10: { minEP: 10000, title: "Honor Student", unlockedFeatures: ["Full 5-slot Badge Showcase", "Custom avatar frames"] },
  20: { minEP: 35000, title: "Senior Scholar", unlockedFeatures: ["Senior Scholar title"] },
  30: { minEP: 75000, title: "Master Academic", unlockedFeatures: ["Master Academic title"] },
  50: { minEP: 200000, title: "Éclat Legend", unlockedFeatures: ["Hall of Fame prestige", "Éclat Legend title"] },
};

/**
 * Returns minimum required lifetime EP for any level between 1 and 100
 */
export function getRequiredEPForLevel(level: number): number {
  if (level <= 1) return 0;
  if (level === 2) return 250;
  if (level === 3) return 600;
  if (level === 4) return 1200;
  if (level === 5) return 2000;
  if (level < 10) {
    // Interpolate levels 6 to 9 smoothly between 2,000 and 10,000
    const step = (10000 - 2000) / 5;
    return Math.round(2000 + step * (level - 5));
  }
  if (level === 10) return 10000;
  if (level < 20) {
    // Interpolate levels 11 to 19 between 10,000 and 35,000
    const step = (35000 - 10000) / 10;
    return Math.round(10000 + step * (level - 10));
  }
  if (level === 20) return 35000;
  if (level < 30) {
    // Interpolate levels 21 to 29 between 35,000 and 75,000
    const step = (75000 - 35000) / 10;
    return Math.round(35000 + step * (level - 20));
  }
  if (level === 30) return 75000;
  if (level < 50) {
    // Interpolate levels 31 to 49 between 75,000 and 200,000
    const step = (200000 - 75000) / 20;
    return Math.round(75000 + step * (level - 30));
  }
  if (level === 50) return 200000;

  // Levels 51 - 100: +15,000 EP per level
  const clampedLevel = Math.min(100, level);
  return 200000 + (clampedLevel - 50) * 15000;
}

/**
 * Calculates current student Level, progression progress %, and unlocked perks from lifetime EP
 */
export function calculateStudentLevel(lifetimeEP: number): StudentLevelInfo {
  const safeEP = Math.max(0, lifetimeEP);

  let currentLevel = 1;
  for (let lvl = 1; lvl <= 100; lvl++) {
    if (safeEP >= getRequiredEPForLevel(lvl)) {
      currentLevel = lvl;
    } else {
      break;
    }
  }

  const currentLevelMinEP = getRequiredEPForLevel(currentLevel);
  const nextLevel = Math.min(100, currentLevel + 1);
  const nextLevelMinEP = getRequiredEPForLevel(nextLevel);

  let progressPercent = 100;
  if (currentLevel < 100 && nextLevelMinEP > currentLevelMinEP) {
    const earnedInCurrentLevel = safeEP - currentLevelMinEP;
    const requiredForNext = nextLevelMinEP - currentLevelMinEP;
    progressPercent = Math.min(100, Math.max(0, Math.round((earnedInCurrentLevel / requiredForNext) * 100)));
  }

  // Aggregate unlocked features up to current level
  const unlockedFeatures: string[] = [];
  let title = "Scholar";

  Object.entries(LEVEL_MILESTONES).forEach(([lvlStr, milestone]) => {
    const lvl = Number(lvlStr);
    if (currentLevel >= lvl) {
      unlockedFeatures.push(...milestone.unlockedFeatures);
      if (milestone.title) {
        title = milestone.title;
      }
    }
  });

  return {
    level: currentLevel,
    lifetimeEP: safeEP,
    currentLevelMinEP,
    nextLevelMinEP,
    progressPercent,
    title,
    unlockedFeatures,
  };
}

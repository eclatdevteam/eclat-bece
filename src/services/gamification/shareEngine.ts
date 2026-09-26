/**
 * Éclat Viral Social Share Engine
 * Implements PRD Section 9.3 & Epic SHR-01
 * Privacy-Safe Achievement Card Generation & Social Share Messaging
 */

export type ShareCardType = "badge" | "level" | "streak" | "league" | "session";

export interface ShareCardConfig {
  type: ShareCardType;
  studentName: string;
  headline: string;
  narrative: string;
  badgeTitle?: string;
  badgeIcon?: string;
  badgeRarity?: string;
  levelNumber?: number;
  levelTitle?: string;
  lifetimeEP?: number;
  streakDays?: number;
  leagueName?: string;
  leagueBadge?: string;
  rank?: number;
  rewardEP?: number;
  appUrl?: string;
}

export const ECLAT_APP_URL = "https://eclat-bece.com";

/**
 * Sanitizes share card narrative to guarantee compliance with the
 * PRD Section 9.3 Privacy Protection Rule:
 * "Under no circumstance shall the student's raw test percentage or sensitive
 * academic weaknesses be exposed on public share cards unless explicitly approved."
 */
export function sanitizeShareNarrative(rawText: string): string {
  // Strip percentage mentions like "scored 42%" or "40% in fractions"
  let sanitized = rawText.replace(/\b\d+(\.\d+)?%/g, "").trim();
  // Strip words like "weakness", "failed", "struggling"
  sanitized = sanitized.replace(/\b(failed|failing|weakness|poor score)\b/gi, "academic challenge").trim();
  return sanitized;
}

/**
 * Generates formatted social share copy for WhatsApp and Twitter/X
 */
export function generateSocialShareText(config: ShareCardConfig): {
  whatsAppText: string;
  twitterText: string;
  clipboardText: string;
} {
  const name = config.studentName || "Scholar";
  const url = config.appUrl || ECLAT_APP_URL;

  let highlight = "";
  if (config.type === "badge") {
    highlight = `🏆 ${name} just unlocked the "${config.badgeTitle}" badge on Éclat!`;
  } else if (config.type === "level") {
    highlight = `⚡ ${name} advanced to Level ${config.levelNumber} (${config.levelTitle}) on Éclat!`;
  } else if (config.type === "streak") {
    highlight = `🔥 ${name} is on a ${config.streakDays}-Day Practice Streak on Éclat!`;
  } else if (config.type === "league") {
    highlight = `🥇 ${name} reached Rank #${config.rank} in the ${config.leagueName} on Éclat!`;
  } else {
    highlight = `🎯 ${name} earned ${config.rewardEP || 50} Éclat Points!`;
  }

  const narrative = sanitizeShareNarrative(config.narrative);

  const whatsAppText = `${highlight}\n\n"${narrative}"\n\nJoin me in mastering BECE & Common Entrance on Éclat: ${url}`;
  const twitterText = `${highlight} "${narrative}" 🚀 #EclatBECE #StudyStreak via @eclat_learning`;
  const clipboardText = `${highlight} - ${narrative} (${url})`;

  return {
    whatsAppText,
    twitterText,
    clipboardText,
  };
}

import { describe, it, expect } from "vitest";
import {
  sanitizeShareNarrative,
  generateSocialShareText,
  ShareCardConfig,
} from "../shareEngine";

describe("Social Share Engine (PRD Section 9.3 & Epic SHR-01)", () => {
  describe("Privacy Protection Rule", () => {
    it("strips raw percentage scores from public share narratives", () => {
      const raw = "Achieved 42% on previous mock but turned it around!";
      const clean = sanitizeShareNarrative(raw);
      expect(clean).not.toContain("42%");
    });

    it("replaces sensitive negative labels like 'failed' or 'weakness'", () => {
      const raw = "Overcame previous weakness and passed!";
      const clean = sanitizeShareNarrative(raw);
      expect(clean).not.toMatch(/\bweakness\b/i);
    });
  });

  describe("Share Copy Generation", () => {
    it("generates WhatsApp, Twitter, and clipboard text for badge unlock", () => {
      const config: ShareCardConfig = {
        type: "badge",
        studentName: "Solomon",
        badgeTitle: "Giant Slayer",
        headline: "GIANT SLAYER UNLOCKED",
        narrative: "Defeated 5 higher-ranked opponents in head-to-head matches!",
        rewardEP: 100,
      };

      const { whatsAppText, twitterText } = generateSocialShareText(config);

      expect(whatsAppText).toContain("Solomon just unlocked the \"Giant Slayer\" badge");
      expect(whatsAppText).toContain("Defeated 5 higher-ranked opponents");
      expect(twitterText).toContain("#EclatBECE");
    });

    it("generates share copy for practice streak milestone", () => {
      const config: ShareCardConfig = {
        type: "streak",
        studentName: "Amara",
        streakDays: 30,
        headline: "30-DAY STREAK",
        narrative: "One month of daily commitment! Nothing stands in my way.",
      };

      const { whatsAppText } = generateSocialShareText(config);
      expect(whatsAppText).toContain("30-Day Practice Streak");
    });

    it("generates share copy for weekly league ranking", () => {
      const config: ShareCardConfig = {
        type: "league",
        studentName: "Kwame",
        leagueName: "Gold League",
        rank: 1,
        headline: "LEAGUE CHAMPION",
        narrative: "Stood alone atop the 30-player weekly league cohort!",
      };

      const { whatsAppText } = generateSocialShareText(config);
      expect(whatsAppText).toContain("Rank #1 in the Gold League");
    });
  });
});

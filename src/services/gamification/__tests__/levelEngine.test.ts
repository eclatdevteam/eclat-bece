import { describe, it, expect } from "vitest";
import {
  calculateStudentLevel,
  getRequiredEPForLevel,
} from "../levelEngine";

describe("Section 6: Permanent Lifetime Level Progression Engine", () => {
  it("maps key PRD milestone levels correctly", () => {
    expect(getRequiredEPForLevel(1)).toBe(0);
    expect(getRequiredEPForLevel(2)).toBe(250);
    expect(getRequiredEPForLevel(3)).toBe(600);
    expect(getRequiredEPForLevel(4)).toBe(1200);
    expect(getRequiredEPForLevel(5)).toBe(2000);
    expect(getRequiredEPForLevel(10)).toBe(10000);
    expect(getRequiredEPForLevel(20)).toBe(35000);
    expect(getRequiredEPForLevel(30)).toBe(75000);
    expect(getRequiredEPForLevel(50)).toBe(200000);
    expect(getRequiredEPForLevel(51)).toBe(215000); // 200k + 15k
    expect(getRequiredEPForLevel(100)).toBe(950000); // 200k + 50 * 15k
  });

  it("calculates student level and feature unlocks accurately", () => {
    // Brand new student (0 EP)
    const lvl1 = calculateStudentLevel(0);
    expect(lvl1.level).toBe(1);
    expect(lvl1.title).toBe("Scholar");
    expect(lvl1.unlockedFeatures).toContain("Basic practice");
    expect(lvl1.progressPercent).toBe(0);

    // 500 EP -> Level 2 (250 <= 500 < 600)
    const lvl2 = calculateStudentLevel(500);
    expect(lvl2.level).toBe(2);
    expect(lvl2.unlockedFeatures).toContain("Daily challenge");
    // (500 - 250) / (600 - 250) = 250 / 350 = 71%
    expect(lvl2.progressPercent).toBe(71);

    // 10,000 EP -> Level 10
    const lvl10 = calculateStudentLevel(10000);
    expect(lvl10.level).toBe(10);
    expect(lvl10.unlockedFeatures).toContain("Full 5-slot Badge Showcase");

    // 200,000 EP -> Level 50 (Éclat Legend)
    const lvl50 = calculateStudentLevel(200000);
    expect(lvl50.level).toBe(50);
    expect(lvl50.title).toBe("Éclat Legend");
    expect(lvl50.unlockedFeatures).toContain("Hall of Fame prestige");
  });
});

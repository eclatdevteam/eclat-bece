import { describe, it, expect } from "vitest";
import {
  evaluateBadgesToUnlock,
  INITIAL_18_BADGES,
} from "../badgeEngine";

describe("Epic BDG-01: Core Badge Evaluation Engine", () => {
  it("includes all 18 Initial Launch Badges specified in PRD Section 11.1", () => {
    expect(INITIAL_18_BADGES.length).toBe(18);
    const ids = INITIAL_18_BADGES.map((b) => b.id);
    expect(ids).toContain("first_step");
    expect(ids).toContain("getting_serious");
    expect(ids).toContain("one_week_strong");
    expect(ids).toContain("sharp_shooter");
    expect(ids).toContain("almost_perfect");
    expect(ids).toContain("perfectionist");
    expect(ids).toContain("weakness_hunter");
    expect(ids).toContain("no_longer_weak");
    expect(ids).toContain("comeback_kid");
    expect(ids).toContain("number_ninja");
    expect(ids).toContain("grammar_guardian");
    expect(ids).toContain("algebra_ace");
    expect(ids).toContain("brave_one");
    expect(ids).toContain("double_threat");
    expect(ids).toContain("level_up");
    expect(ids).toContain("explorer");
    expect(ids).toContain("first_blood");
    expect(ids).toContain("top_100");
  });

  it("unlocks First Step upon completing first practice session", () => {
    const unlocked = evaluateBadgesToUnlock(
      { totalSessionsCompleted: 1, currentStreak: 1 },
      []
    );
    expect(unlocked.some((b) => b.id === "first_step")).toBe(true);
  });

  it("does not re-unlock badges that were already earned", () => {
    const unlocked = evaluateBadgesToUnlock(
      { totalSessionsCompleted: 5, currentStreak: 3 },
      ["first_step", "getting_serious"]
    );
    expect(unlocked.some((b) => b.id === "first_step")).toBe(false);
    expect(unlocked.some((b) => b.id === "getting_serious")).toBe(false);
  });

  it("unlocks Sharp Shooter on session of 10+ questions at >=80% accuracy", () => {
    const unlocked = evaluateBadgesToUnlock(
      {
        totalSessionsCompleted: 3,
        currentStreak: 2,
        sessionQuestionsCount: 10,
        sessionAccuracyPercent: 85,
      },
      []
    );
    expect(unlocked.some((b) => b.id === "sharp_shooter")).toBe(true);
  });

  it("unlocks Weakness Hunter when transitioning a weak topic to Developing", () => {
    const unlocked = evaluateBadgesToUnlock(
      {
        totalSessionsCompleted: 10,
        currentStreak: 4,
        weakTopicsTurnedDevelopingCount: 1,
      },
      []
    );
    expect(unlocked.some((b) => b.id === "weakness_hunter")).toBe(true);
  });

  it("unlocks Double Threat when student achieves >=70% mastery in both Maths and English", () => {
    const unlocked = evaluateBadgesToUnlock(
      {
        totalSessionsCompleted: 15,
        currentStreak: 5,
        mathMasteryPercent: 75,
        englishMasteryPercent: 80,
      },
      []
    );
    expect(unlocked.some((b) => b.id === "double_threat")).toBe(true);
  });
});

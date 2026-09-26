import { describe, it, expect } from "vitest";
import {
  calculateSessionPoints,
  calculateQuestionSpeedBonus,
  getAccuracyMultiplier,
  BASE_EP_MAP,
} from "../pointsEngine";
import { SessionQuestionInput } from "../types";

describe("EP-01: Base Points and Accuracy Multiplier Engine", () => {
  it("TC-EP01-1: Flawless short session (5 Easy, 100% accuracy) awards +30% multiplier", () => {
    const questions: SessionQuestionInput[] = Array(5).fill(null).map((_, i) => ({
      questionId: `q${i}`,
      difficulty: "easy",
      isCorrect: true,
    }));

    const result = calculateSessionPoints(questions);

    // 5 * 5 = 25 Base EP
    expect(result.baseEP).toBe(25);
    // 100% accuracy on >=5 Qs awards +30%: round(25 * 0.3) = 8 EP
    expect(result.accuracyMultiplierBonus).toBe(8);
    expect(result.accuracyPercentage).toBe(100);
    expect(result.totalEP).toBe(33);
  });

  it("TC-EP01-2: Standard BECE pass (10 Medium, 70% accuracy) awards +10% multiplier", () => {
    const questions: SessionQuestionInput[] = Array(10).fill(null).map((_, i) => ({
      questionId: `q${i}`,
      difficulty: "medium",
      isCorrect: i < 7, // 7 correct, 3 incorrect
    }));

    const result = calculateSessionPoints(questions);

    // 7 * 10 = 70 Base EP
    expect(result.baseEP).toBe(70);
    // 70% accuracy awards +10%: round(70 * 0.1) = 7 EP
    expect(result.accuracyMultiplierBonus).toBe(7);
    expect(result.accuracyPercentage).toBe(70);
    expect(result.totalEP).toBe(77);
  });

  it("TC-EP01-3: Sub-50% accuracy receives 0% multiplier bonus (anti-guessing)", () => {
    const questions: SessionQuestionInput[] = Array(10).fill(null).map((_, i) => ({
      questionId: `q${i}`,
      difficulty: "medium",
      isCorrect: i < 4, // 4 correct, 6 incorrect (40%)
    }));

    const result = calculateSessionPoints(questions);

    // 4 * 10 = 40 Base EP
    expect(result.baseEP).toBe(40);
    expect(result.accuracyMultiplierBonus).toBe(0);
    expect(result.accuracyPercentage).toBe(40);
    expect(result.totalEP).toBe(40);
  });

  it("TC-EP01-4: High-difficulty session (5 Hard + 5 Challenge at 90% accuracy) awards +20% multiplier", () => {
    const questions: SessionQuestionInput[] = [
      ...Array(5).fill(null).map((_, i) => ({
        questionId: `hard_${i}`,
        difficulty: "hard" as const,
        isCorrect: true, // 5 * 20 = 100 EP
      })),
      ...Array(5).fill(null).map((_, i) => ({
        questionId: `challenge_${i}`,
        difficulty: "challenge" as const,
        isCorrect: i < 4, // 4 * 30 = 120 EP (1 incorrect)
      })),
    ];

    const result = calculateSessionPoints(questions);

    // Base = 100 + 120 = 220 EP
    expect(result.baseEP).toBe(220);
    // 9 / 10 = 90% accuracy awards +20%: round(220 * 0.20) = 44 EP
    expect(result.accuracyMultiplierBonus).toBe(44);
    expect(result.accuracyPercentage).toBe(90);
    expect(result.totalEP).toBe(264);
  });

  it("TC-EP01-5: Disqualifies sessions with fewer than 5 questions from multiplier", () => {
    const questions: SessionQuestionInput[] = Array(4).fill(null).map((_, i) => ({
      questionId: `q${i}`,
      difficulty: "easy",
      isCorrect: true, // 100% accuracy, but only 4 questions
    }));

    const result = calculateSessionPoints(questions);

    // 4 * 5 = 20 Base EP
    expect(result.baseEP).toBe(20);
    expect(result.accuracyMultiplierBonus).toBe(0);
    expect(result.totalEP).toBe(20);
  });

  it("ensures incorrect answers never deduct points (Practice Penalty Prohibition)", () => {
    const questions: SessionQuestionInput[] = Array(10).fill(null).map((_, i) => ({
      questionId: `q${i}`,
      difficulty: "challenge",
      isCorrect: false, // All 10 incorrect
    }));

    const result = calculateSessionPoints(questions);

    expect(result.baseEP).toBe(0);
    expect(result.totalEP).toBe(0);
  });
});

describe("EP-02: Weak-Topic Focus Engine", () => {
  it("awards Base EP + 25% Focus Bonus for correct questions in active Focus Area", () => {
    const questions: SessionQuestionInput[] = [
      {
        questionId: "q1",
        difficulty: "medium", // 10 Base EP
        isCorrect: true,
        isFocusArea: true, // +25% = 2.5 -> 3 EP
      },
      {
        questionId: "q2",
        difficulty: "medium",
        isCorrect: true,
        isFocusArea: false,
      },
    ];

    const result = calculateSessionPoints(questions);

    expect(result.baseEP).toBe(20);
    expect(result.focusBonus).toBe(3); // round(10 * 0.25)
    expect(result.totalEP).toBe(23);
  });

  it("awards +30 EP flat bonus for completing a dedicated Focus session (10+ Qs at >=70%)", () => {
    const questions: SessionQuestionInput[] = Array(10).fill(null).map((_, i) => ({
      questionId: `focus_${i}`,
      difficulty: "medium",
      isCorrect: i < 8, // 80% accuracy
      isFocusArea: true,
    }));

    const result = calculateSessionPoints(questions, true);

    expect(result.baseEP).toBe(80); // 8 * 10
    expect(result.accuracyMultiplierBonus).toBe(12); // round(80 * 0.15 for 80%)
    expect(result.focusBonus).toBe(24); // 8 * round(10 * 0.25) = 8 * 3 = 24
    expect(result.sessionBonus).toBe(30); // +30 EP completion bonus
    expect(result.totalEP).toBe(80 + 12 + 24 + 30);
  });

  it("does not award the +30 EP session bonus if accuracy is below 70%", () => {
    const questions: SessionQuestionInput[] = Array(10).fill(null).map((_, i) => ({
      questionId: `focus_${i}`,
      difficulty: "medium",
      isCorrect: i < 6, // 60% accuracy (< 70%)
      isFocusArea: true,
    }));

    const result = calculateSessionPoints(questions, true);

    expect(result.sessionBonus).toBe(0);
  });
});

describe("Calibrated Speed Bonus & Anti-Guessing Rules", () => {
  it("awards +3 EP (Tier 1) when correct and answered in <= 50% of expected time", () => {
    const bonus = calculateQuestionSpeedBonus(true, 25, 60); // 25s / 60s = 41.6%
    expect(bonus).toBe(3);
  });

  it("awards +1 EP (Tier 2) when correct and answered in 51% - 75% of expected time", () => {
    const bonus = calculateQuestionSpeedBonus(true, 40, 60); // 40s / 60s = 66.7%
    expect(bonus).toBe(1);
  });

  it("awards 0 EP when answered in > 75% of expected time", () => {
    const bonus = calculateQuestionSpeedBonus(true, 50, 60); // 50s / 60s = 83.3%
    expect(bonus).toBe(0);
  });

  it("enforces anti-guessing floor: 0 EP speed bonus for submissions under 3.0s", () => {
    const bonus = calculateQuestionSpeedBonus(true, 2.8, 60); // < 3.0s
    expect(bonus).toBe(0);
  });

  it("awards 0 EP speed bonus for incorrect answers regardless of speed", () => {
    const bonus = calculateQuestionSpeedBonus(false, 20, 60);
    expect(bonus).toBe(0);
  });

  it("caps total session speed bonus at +30 EP max", () => {
    // 15 correct questions submitted at fast speed (15 * 3 = 45 EP potential)
    const questions: SessionQuestionInput[] = Array(15).fill(null).map((_, i) => ({
      questionId: `q_${i}`,
      difficulty: "medium",
      isCorrect: true,
      timeSpentSeconds: 15,
      expectedTimeSeconds: 60, // <= 50% -> +3 each
    }));

    const result = calculateSessionPoints(questions);

    expect(result.speedBonus).toBe(30); // Capped at 30, not 45
  });

  it("disqualifies rapid guessing under 2.5s from earning base EP and accuracy multiplier", () => {
    const questions: SessionQuestionInput[] = Array(5).fill(null).map((_, i) => ({
      questionId: `rapid_${i}`,
      difficulty: "medium",
      isCorrect: true,
      timeSpentSeconds: 1.5, // Rapid guess (< 2.5s)
    }));

    const result = calculateSessionPoints(questions);

    expect(result.baseEP).toBe(0);
    expect(result.accuracyMultiplierBonus).toBe(0);
    expect(result.totalEP).toBe(0);
  });

  it("scales base EP and focus bonus when antiGamingMultiplier is 0.5 (down-tier decay)", () => {
    const questions: SessionQuestionInput[] = [
      {
        questionId: "down_tier_1",
        difficulty: "medium", // 10 EP base -> 5 EP with 0.5x
        isCorrect: true,
        antiGamingMultiplier: 0.5,
        isFocusArea: true, // 25% of 5 EP = 1 EP
        timeSpentSeconds: 20,
      },
    ];

    const result = calculateSessionPoints(questions);

    expect(result.baseEP).toBe(5);
    expect(result.focusBonus).toBe(1);
    expect(result.totalEP).toBe(6);
  });
});


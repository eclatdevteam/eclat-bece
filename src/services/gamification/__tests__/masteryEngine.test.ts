import { describe, it, expect } from "vitest";
import {
  updateTopicMastery,
  classifyTopicStatus,
  evaluateComebackBonus,
  ROLLING_WINDOW_SIZE,
} from "../masteryEngine";
import { TopicMasteryState } from "../types";

describe("EP-02: Topic Mastery & Rolling Diagnostic Engine", () => {
  it("maintains a maximum rolling buffer of 30 recent question answers", () => {
    const initialState: TopicMasteryState = {
      subject: "Mathematics",
      topic: "Fractions",
      rollingAnswers: Array(25).fill(true),
      rollingAccuracy: 100,
      status: "strong",
      totalAttempted: 25,
    };

    // Add 10 new answers (all false)
    const newAnswers = Array(10).fill(false);
    const result = updateTopicMastery(initialState, newAnswers);

    expect(result.updatedRollingAnswers.length).toBe(ROLLING_WINDOW_SIZE); // capped at 30
    // Last 10 should be false, first 20 should be true (5 oldest trues dropped)
    const trueCount = result.updatedRollingAnswers.filter(Boolean).length;
    expect(trueCount).toBe(20);
    expect(result.newAccuracy).toBe(Math.round((20 / 30) * 100)); // 67%
  });

  it("identifies a Weak topic when rolling accuracy is < 60% with at least 10 attempts", () => {
    expect(classifyTopicStatus(50, 10)).toBe("weak");
    expect(classifyTopicStatus(59, 15)).toBe("weak");
  });

  it("does not flag a topic as Weak if total attempts are fewer than 10", () => {
    expect(classifyTopicStatus(40, 5)).toBe("developing");
  });

  it("classifies Developing (60-79%) and Strong (>=80%) correctly", () => {
    expect(classifyTopicStatus(60, 20)).toBe("developing");
    expect(classifyTopicStatus(79, 20)).toBe("developing");
    expect(classifyTopicStatus(80, 20)).toBe("strong");
    expect(classifyTopicStatus(100, 20)).toBe("strong");
  });

  it("awards +75 EP graduation bonus when transitioning from Weak to Developing", () => {
    const initialState: TopicMasteryState = {
      subject: "Mathematics",
      topic: "Algebra",
      rollingAnswers: [true, false, false, false, true, false, false, true, false, false], // 3/10 = 30%
      rollingAccuracy: 30,
      status: "weak",
      totalAttempted: 10,
    };

    // Answer 10 consecutive correct questions -> (3 + 10) / 20 = 13/20 = 65% (Developing)
    const newAnswers = Array(10).fill(true);
    const result = updateTopicMastery(initialState, newAnswers);

    expect(result.previousStatus).toBe("weak");
    expect(result.newStatus).toBe("developing");
    expect(result.statusGraduationBonusEP).toBe(75);
    expect(result.statusChanged).toBe(true);
  });

  it("awards +100 EP mastery graduation bonus when transitioning from Developing to Strong", () => {
    const initialState: TopicMasteryState = {
      subject: "English",
      topic: "Grammar",
      rollingAnswers: Array(10).fill(true).concat(Array(5).fill(false)), // 10/15 = 67% (Developing)
      rollingAccuracy: 67,
      status: "developing",
      totalAttempted: 15,
    };

    // Add 15 correct answers -> (10 + 15) / 30 = 25/30 = 83% (Strong)
    const newAnswers = Array(15).fill(true);
    const result = updateTopicMastery(initialState, newAnswers);

    expect(result.previousStatus).toBe("developing");
    expect(result.newStatus).toBe("strong");
    expect(result.statusGraduationBonusEP).toBe(100);
  });

  it("awards +50 EP Material Mastery Jump bonus when accuracy improves by >=15 percentage points", () => {
    const initialState: TopicMasteryState = {
      subject: "Science",
      topic: "Photosynthesis",
      rollingAnswers: Array(10).fill(false), // 0%
      rollingAccuracy: 0,
      status: "weak",
      totalAttempted: 10,
    };

    // Note: Jump bonus applies when previousAccuracy > 0 and delta >= 15
    const stateWithHistory: TopicMasteryState = {
      ...initialState,
      rollingAnswers: [true, true, true, true, true, false, false, false, false, false], // 50%
      rollingAccuracy: 50,
      status: "weak",
    };

    // Add 10 correct answers -> (5 + 10) / 20 = 15/20 = 75% (+25 percentage points gain)
    const newAnswers = Array(10).fill(true);
    const result = updateTopicMastery(stateWithHistory, newAnswers);

    expect(result.accuracyDelta).toBe(25);
    expect(result.masteryJumpBonusEP).toBe(50);
    // Also awards Weak -> Developing (75 EP)
    expect(result.statusGraduationBonusEP).toBe(75);
    expect(result.totalBonusEP).toBe(125); // 75 + 50
  });
});

describe("PRD Section 3.4: The Comeback Recovery Bonus", () => {
  it("awards +50 Comeback EP when student scored <50% and bounces back with >=75% on 10+ questions within 14 days", () => {
    const check = evaluateComebackBonus({
      previousScorePercentage: 40,
      previousAssessedAt: "2026-09-20T10:00:00Z",
      currentSessionQuestionCount: 10,
      currentScorePercentage: 80,
      currentAssessedAt: "2026-09-24T10:00:00Z", // 4 days later
    });

    expect(check.eligible).toBe(true);
    expect(check.bonusEP).toBe(50);
  });

  it("disqualifies if current session has fewer than 10 questions", () => {
    const check = evaluateComebackBonus({
      previousScorePercentage: 30,
      previousAssessedAt: "2026-09-20T10:00:00Z",
      currentSessionQuestionCount: 8, // < 10
      currentScorePercentage: 80,
      currentAssessedAt: "2026-09-24T10:00:00Z",
    });

    expect(check.eligible).toBe(false);
    expect(check.bonusEP).toBe(0);
  });

  it("disqualifies if current session score is below 75%", () => {
    const check = evaluateComebackBonus({
      previousScorePercentage: 30,
      previousAssessedAt: "2026-09-20T10:00:00Z",
      currentSessionQuestionCount: 10,
      currentScorePercentage: 70, // < 75%
      currentAssessedAt: "2026-09-24T10:00:00Z",
    });

    expect(check.eligible).toBe(false);
    expect(check.bonusEP).toBe(0);
  });

  it("disqualifies if session falls outside the 14-day window", () => {
    const check = evaluateComebackBonus({
      previousScorePercentage: 30,
      previousAssessedAt: "2026-09-01T10:00:00Z",
      currentSessionQuestionCount: 10,
      currentScorePercentage: 80,
      currentAssessedAt: "2026-09-20T10:00:00Z", // 19 days later (> 14 days)
    });

    expect(check.eligible).toBe(false);
    expect(check.bonusEP).toBe(0);
  });

  it("enforces 14-day cooldown on repeating Comeback Bonuses for the same topic", () => {
    const check = evaluateComebackBonus({
      previousScorePercentage: 30,
      previousAssessedAt: "2026-09-20T10:00:00Z",
      currentSessionQuestionCount: 10,
      currentScorePercentage: 80,
      currentAssessedAt: "2026-09-24T10:00:00Z",
      lastComebackAwardedAt: "2026-09-18T10:00:00Z", // Only 6 days ago (< 14 days)
    });

    expect(check.eligible).toBe(false);
    expect(check.reason).toContain("cooldown");
  });
});

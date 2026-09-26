import { describe, it, expect } from "vitest";
import { SchoolTopicMasteryRecord } from "../CurriculumWeaknessHeatmap";
import { EnrichedStudentRecord } from "../ClassroomLeaderboardView";

describe("School Cohort Analytics & Heatmap", () => {
  const sampleTopicMastery: SchoolTopicMasteryRecord[] = [
    {
      student_id: "s1",
      subject: "Mathematics",
      topic: "Algebraic Factorization",
      rolling_accuracy: 45,
      status: "weak",
      total_attempted: 30,
    },
    {
      student_id: "s2",
      subject: "Mathematics",
      topic: "Algebraic Factorization",
      rolling_accuracy: 55,
      status: "weak",
      total_attempted: 25,
    },
    {
      student_id: "s3",
      subject: "Mathematics",
      topic: "Algebraic Factorization",
      rolling_accuracy: 80,
      status: "developing",
      total_attempted: 30,
    },
    {
      student_id: "s1",
      subject: "English Language",
      topic: "Grammar & Concord",
      rolling_accuracy: 90,
      status: "mastered",
      total_attempted: 30,
    },
    {
      student_id: "s2",
      subject: "English Language",
      topic: "Grammar & Concord",
      rolling_accuracy: 88,
      status: "mastered",
      total_attempted: 30,
    },
  ];

  it("identifies critical gaps when struggling rate exceeds 50% or avg accuracy < 60%", () => {
    const algebraRecords = sampleTopicMastery.filter((t) => t.topic === "Algebraic Factorization");
    const total = algebraRecords.length;
    const weakCount = algebraRecords.filter((t) => t.status === "weak" || t.rolling_accuracy < 60).length;
    const avgAccuracy = Math.round(algebraRecords.reduce((acc, t) => acc + t.rolling_accuracy, 0) / total);
    const strugglingRate = Math.round((weakCount / total) * 100);

    expect(total).toBe(3);
    expect(weakCount).toBe(2);
    expect(strugglingRate).toBe(67);
    expect(avgAccuracy).toBe(60);

    // Critical because 67% >= 50%
    const isCritical = avgAccuracy < 60 || strugglingRate >= 50;
    expect(isCritical).toBe(true);
  });

  it("identifies mastered topics when avg accuracy >= 80% and struggling rate <= 15%", () => {
    const grammarRecords = sampleTopicMastery.filter((t) => t.topic === "Grammar & Concord");
    const total = grammarRecords.length;
    const weakCount = grammarRecords.filter((t) => t.status === "weak" || t.rolling_accuracy < 60).length;
    const avgAccuracy = Math.round(grammarRecords.reduce((acc, t) => acc + t.rolling_accuracy, 0) / total);
    const strugglingRate = Math.round((weakCount / total) * 100);

    expect(total).toBe(2);
    expect(weakCount).toBe(0);
    expect(strugglingRate).toBe(0);
    expect(avgAccuracy).toBe(89);

    const isMastered = avgAccuracy >= 80 && strugglingRate <= 15;
    expect(isMastered).toBe(true);
  });

  it("correctly ranks students primarily by Lifetime EP, breaking ties with Average Score", () => {
    const students: Partial<EnrichedStudentRecord>[] = [
      { id: "s1", name: "Alice", lifetime_ep: 1500, avgScore: 75 },
      { id: "s2", name: "Bob", lifetime_ep: 3200, avgScore: 82 },
      { id: "s3", name: "Charlie", lifetime_ep: 1500, avgScore: 90 },
      { id: "s4", name: "Diana", lifetime_ep: 800, avgScore: 95 },
    ];

    const sorted = [...students].sort((a, b) => (b.lifetime_ep || 0) - (a.lifetime_ep || 0) || (b.avgScore || 0) - (a.avgScore || 0));

    expect(sorted[0].name).toBe("Bob"); // 3200 EP
    expect(sorted[1].name).toBe("Charlie"); // 1500 EP, 90% score
    expect(sorted[2].name).toBe("Alice"); // 1500 EP, 75% score
    expect(sorted[3].name).toBe("Diana"); // 800 EP
  });
});

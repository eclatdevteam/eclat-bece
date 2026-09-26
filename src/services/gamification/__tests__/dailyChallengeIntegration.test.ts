import { describe, it, expect, vi, beforeEach } from "vitest";
import { recordSessionGamification } from "../gamificationService";
import { supabase } from "@/integrations/supabase/client";

// Mock supabase client
vi.mock("@/integrations/supabase/client", () => {
  const mockFrom = vi.fn();
  const mockRpc = vi.fn().mockResolvedValue({ data: null, error: null });
  return {
    supabase: {
      from: mockFrom,
      rpc: mockRpc,
    },
  };
});

describe("Daily Challenge Integration via gamificationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("awards Daily Challenge EP and marks streak as qualifying on 10 completed questions", async () => {
    const mockProfile = {
      student_id: "student-1",
      lifetime_ep: 100,
      weekly_ep: 50,
      monthly_ep: 50,
      streak_count: 3,
      longest_streak: 5,
      streak_shields: 1,
      last_qualifying_date: "2026-09-25",
      last_daily_challenge_date: null,
    };

    const mockUpsert = vi.fn().mockResolvedValue({ data: null, error: null });
    const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === "student_gamification_profile") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
          upsert: mockUpsert,
        };
      }
      if (table === "student_points_ledger") {
        return {
          insert: mockInsert,
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === "student_badges") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    // 10 correct questions = 100% accuracy
    const questions = Array.from({ length: 10 }, (_, i) => ({
      questionId: `q-${i}`,
      difficulty: "medium" as const,
      isCorrect: true,
      timeSpentSeconds: 20,
      expectedTimeSeconds: 60,
    }));

    const outcome = await recordSessionGamification({
      studentId: "student-1",
      quizResultId: "quiz-1",
      subject: "Daily Challenge",
      topic: "Daily Sprint",
      questions,
      isDailyChallenge: true,
    });

    expect(outcome.dailyChallengeOutcome).toBeDefined();
    expect(outcome.dailyChallengeOutcome?.eligible).toBe(true);
    // Baseline +20 EP + 100% tier (+30 EP) = +50 EP total
    expect(outcome.dailyChallengeOutcome?.baseCompletionEP).toBe(20);
    expect(outcome.dailyChallengeOutcome?.accuracyTierEP).toBe(30);
    expect(outcome.dailyChallengeOutcome?.totalEP).toBe(50);

    // Streak should increment because Daily Challenge is qualifying
    expect(outcome.streakOutcome?.currentStreak).toBe(4);
    expect(outcome.streakOutcome?.streakIncremented).toBe(true);

    // Check that profile upsert was called with today's date
    expect(mockUpsert).toHaveBeenCalled();
    const upsertedPayload = mockUpsert.mock.calls[0][0];
    expect(upsertedPayload.last_daily_challenge_date).toBeDefined();
  });
});

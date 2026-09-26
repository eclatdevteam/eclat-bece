import { describe, it, expect, vi } from "vitest";
import { getEmojiAvatar, fetchLeaderboardData } from "../leaderboard";

// Mock supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
    rpc: vi.fn().mockImplementation((fnName: string) => {
      if (fnName === "get_public_leaderboard") {
        return Promise.resolve({
          data: {
            weekly: [
              {
                student_id: "s-1",
                name: "Ada Lovelace",
                school: "Grace College",
                school_id: "sc-1",
                level: 5,
                league_tier: 2,
                points: 350,
              },
            ],
            monthly: [
              {
                student_id: "s-1",
                name: "Ada Lovelace",
                school: "Grace College",
                school_id: "sc-1",
                level: 5,
                league_tier: 2,
                points: 1200,
              },
            ],
            all_time: [
              {
                student_id: "s-1",
                name: "Ada Lovelace",
                school: "Grace College",
                school_id: "sc-1",
                level: 5,
                league_tier: 2,
                points: 5400,
              },
            ],
            math: [
              {
                student_id: "s-1",
                name: "Ada Lovelace",
                school: "Grace College",
                school_id: "sc-1",
                level: 5,
                league_tier: 2,
                points: 800,
              },
            ],
            english: [
              {
                student_id: "s-2",
                name: "Chinua Achebe",
                school: "Ogidi High",
                school_id: "sc-2",
                level: 4,
                league_tier: 1,
                points: 650,
              },
            ],
          },
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: new Error("Unknown RPC") });
    }),
  },
}));

describe("Leaderboard Utilities", () => {
  it("generates deterministic emoji avatar based on ID", () => {
    const avatar1 = getEmojiAvatar("student-abc");
    const avatar2 = getEmojiAvatar("student-abc");
    const avatar3 = getEmojiAvatar("student-xyz");

    expect(avatar1).toBe(avatar2);
    expect(typeof avatar1).toBe("string");
    expect(avatar1.length).toBeGreaterThan(0);
  });

  it("fetches and parses all 5 leaderboard views correctly from RPC", async () => {
    const data = await fetchLeaderboardData("user-999");

    expect(data.weeklyLeaders).toHaveLength(1);
    expect(data.weeklyLeaders[0]).toMatchObject({
      rank: 1,
      studentId: "s-1",
      name: "Ada Lovelace",
      points: 350,
      level: 5,
      leagueTier: 2,
    });

    expect(data.monthlyLeaders).toHaveLength(1);
    expect(data.annualLeaders).toHaveLength(1);
    expect(data.mathLeaders).toHaveLength(1);
    expect(data.englishLeaders).toHaveLength(1);

    expect(data.currentUserRanks).toBeDefined();
    expect(data.currentUserPoints).toBeDefined();
  });
});

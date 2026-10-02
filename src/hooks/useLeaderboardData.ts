import { useQuery } from "@tanstack/react-query";
import { fetchLeaderboardData, LeaderboardData } from "@/utils/leaderboard";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Cached leaderboard data shared by the student, school, public and
 * marketing leaderboard views. `userId` personalizes the current-user
 * highlighting; an undefined scope key means "all boards".
 */
export function useLeaderboardData(userId?: string, schoolId?: string) {
  return useQuery<LeaderboardData>({
    queryKey: ["leaderboard", schoolId ? `school:${schoolId}` : userId ? `user:${userId}` : "public"],
    staleTime: 60 * 1000,
    queryFn: () => fetchLeaderboardData(schoolId ?? userId),
  });
}

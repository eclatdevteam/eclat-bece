import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  CohortMember,
  LeagueTierConfig,
  LeagueTierNumber,
  WeeklyCohortWindow,
} from "@/services/gamification/types";
import {
  getLeagueTierConfig,
  getCohortZone,
  getWeeklyCohortWindow,
} from "@/services/gamification/leagueEngine";
import { queryKeys } from "@/lib/queryKeys";

export interface StudentCohortState {
  cohortId: string | null;
  leagueTier: LeagueTierNumber;
  tierConfig: LeagueTierConfig;
  cohortNumber: number;
  weekStartDate: string;
  members: CohortMember[];
  currentUserMember: CohortMember | null;
  cohortWindow: WeeklyCohortWindow;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

interface CohortRpcResult {
  cohort_id: string;
  league_tier: number;
  cohort_number: number;
  week_start_date: string;
  members: Array<{
    student_id: string;
    name: string | null;
    username: string | null;
    avatar_url: string | null;
    school_name: string | null;
    weekly_ep: number;
    rank: number;
    is_current_user: boolean;
  }>;
}

export function useLeagueCohort(): StudentCohortState {
  const { user } = useAuth();
  // Countdown clock ticks locally every 60 seconds; the cohort data itself is
  // cached and refetched on demand via refresh().
  const [cohortWindow, setCohortWindow] = useState<WeeklyCohortWindow>(getWeeklyCohortWindow());

  const query = useQuery({
    queryKey: queryKeys.leagueCohort(user?.id),
    enabled: !!user,
    staleTime: 60 * 1000, // standings change as peers play; keep them reasonably fresh
    queryFn: async () => {
      // 1. Get student ID
      const { data: studentRecord } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (!studentRecord) {
        return null;
      }
      const studentId = studentRecord.id;

      // 2. Fetch or assign weekly cohort
      const { data, error: rpcError } = await supabase.rpc("get_student_league_cohort", {
        p_student_id: studentId,
      });

      if (rpcError) throw rpcError;

      const cohortData = data as unknown as CohortRpcResult | null;
      if (!cohortData) return null;

      const tier = (cohortData.league_tier || 1) as LeagueTierNumber;
      const rawMembers = Array.isArray(cohortData.members) ? cohortData.members : [];
      const parsedMembers: CohortMember[] = rawMembers.map((m, idx) => {
        const rank = m.rank || idx + 1;
        return {
          studentId: m.student_id,
          name: m.name || "Scholar",
          username: m.username,
          avatarUrl: m.avatar_url,
          schoolName: m.school_name,
          weeklyEP: Number(m.weekly_ep || 0),
          rank,
          zone: getCohortZone(rank, tier),
          isCurrentUser: !!m.is_current_user,
        };
      });

      const currentUserMember = parsedMembers.find((m) => m.isCurrentUser) || null;

      return {
        cohortId: cohortData.cohort_id,
        leagueTier: tier,
        cohortNumber: cohortData.cohort_number || 1,
        weekStartDate: cohortData.week_start_date || "",
        members: parsedMembers,
        currentUserMember,
      };
    },
  });

  // Update countdown clock every 60 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCohortWindow(getWeeklyCohortWindow());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const data = query.data;

  return {
    cohortId: data?.cohortId ?? null,
    leagueTier: data?.leagueTier ?? 1,
    tierConfig: getLeagueTierConfig(data?.leagueTier ?? 1),
    cohortNumber: data?.cohortNumber ?? 1,
    weekStartDate: data?.weekStartDate ?? "",
    members: data?.members ?? [],
    currentUserMember: data?.currentUserMember ?? null,
    cohortWindow,
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refresh: async () => {
      await query.refetch();
    },
  };
}

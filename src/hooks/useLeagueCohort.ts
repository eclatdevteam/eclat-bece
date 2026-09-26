import { useState, useEffect, useCallback } from "react";
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

export function useLeagueCohort(): StudentCohortState {
  const { user } = useAuth();
  const [cohortId, setCohortId] = useState<string | null>(null);
  const [leagueTier, setLeagueTier] = useState<LeagueTierNumber>(1);
  const [cohortNumber, setCohortNumber] = useState<number>(1);
  const [weekStartDate, setWeekStartDate] = useState<string>("");
  const [members, setMembers] = useState<CohortMember[]>([]);
  const [currentUserMember, setCurrentUserMember] = useState<CohortMember | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cohortWindow, setCohortWindow] = useState<WeeklyCohortWindow>(getWeeklyCohortWindow());

  const fetchCohort = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Get student ID
      const { data: studentRecord } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!studentRecord) {
        setLoading(false);
        return;
      }

      const studentId = studentRecord.id;

      // 2. Fetch or assign weekly cohort
      const { data, error: rpcError } = await supabase.rpc("get_student_league_cohort" as any, {
        p_student_id: studentId,
      });

      if (rpcError) throw rpcError;

      const cohortData = data as any;
      if (cohortData) {
        const tier = (cohortData.league_tier || 1) as LeagueTierNumber;
        setCohortId(cohortData.cohort_id);
        setLeagueTier(tier);
        setCohortNumber(cohortData.cohort_number || 1);
        setWeekStartDate(cohortData.week_start_date || "");

        const rawMembers = Array.isArray(cohortData.members) ? cohortData.members : [];
        const parsedMembers: CohortMember[] = rawMembers.map((m: any, idx: number) => {
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

        setMembers(parsedMembers);
        const myMember = parsedMembers.find((m) => m.isCurrentUser) || null;
        setCurrentUserMember(myMember);
      }
      setCohortWindow(getWeeklyCohortWindow());
    } catch (err: any) {
      console.error("Error loading league cohort:", err);
      setError(err?.message || "Failed to load league cohort");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCohort();
  }, [fetchCohort]);

  // Update countdown clock every 60 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCohortWindow(getWeeklyCohortWindow());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  return {
    cohortId,
    leagueTier,
    tierConfig: getLeagueTierConfig(leagueTier),
    cohortNumber,
    weekStartDate,
    members,
    currentUserMember,
    cohortWindow,
    loading,
    error,
    refresh: fetchCohort,
  };
}

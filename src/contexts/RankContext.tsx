import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { fetchLeaderboardData, LeaderboardStudent } from "@/utils/leaderboard";
import { supabase } from "@/integrations/supabase/client";

interface RankContextType {
  monthlyRank: number;
  monthlyPoints: number;
  monthlyLeaders: LeaderboardStudent[];
  annualLeaders: LeaderboardStudent[];
  isLoadingRank: boolean;
  isLoadingPoints: boolean;
  error: Error | null;
  refreshRank: () => Promise<void>;
  refreshPoints: () => Promise<void>;
  refreshAll: () => Promise<void>;
  getUserByMonthlyRank: (rank: number) => LeaderboardStudent | undefined;
  getUserByAnnualRank: (rank: number) => LeaderboardStudent | undefined;
}

const RankContext = createContext<RankContextType | undefined>(undefined);

export const RankProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [monthlyRank, setMonthlyRank] = useState(0);
  const [monthlyPoints, setMonthlyPoints] = useState(0);
  const [monthlyLeaders, setMonthlyLeaders] = useState<LeaderboardStudent[]>([]);
  const [annualLeaders, setAnnualLeaders] = useState<LeaderboardStudent[]>([]);
  const [isLoadingRank, setIsLoadingRank] = useState(false);
  const [isLoadingPoints, setIsLoadingPoints] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [classYear, setClassYear] = useState<string | null>(null);
  
  // Refs for request management
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestPromiseRef = useRef<Promise<void> | null>(null);
  const requestTypeRef = useRef<'rank' | 'points' | 'all' | null>(null);

  // Fetch student's class year
  const fetchStudentClassYear = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data: studentData } = await supabase
        .from("students")
        .select("class_year")
        .eq("user_id", user.id)
        .maybeSingle();

      console.log("Student class year data:", studentData);
      if (studentData?.class_year) {
        setClassYear(studentData.class_year);
        console.log("Set class year to:", studentData.class_year);
      }
    } catch (error) {
      console.error("Error fetching student class year:", error);
    }
  }, [user?.id]);

  // Consolidated internal fetch function
  const fetchData = useCallback(async (
    type: 'rank' | 'points' | 'all',
    signal: AbortSignal
  ) => {
    if (!user?.id) {
      return;
    }

    try {
      const data = await fetchLeaderboardData(user.id, classYear);
      
      if (signal.aborted) return;

      if (type === 'rank' || type === 'all') {
        setMonthlyRank(data.currentUserRanks?.monthly || 0);
        setMonthlyLeaders(data.monthlyLeaders);
        setAnnualLeaders(data.annualLeaders);
      }
      if (type === 'points' || type === 'all') {
        setMonthlyPoints(data.currentUserPoints?.monthly || 0);
      }
    } catch (err) {
      if (signal.aborted) return;
      throw err;
    }
  }, [user?.id, classYear]);

  // Coalesced refresh function
  const refresh = useCallback(async (type: 'rank' | 'points' | 'all') => {
    if (!user?.id) {
      return;
    }

    // Set appropriate loading flag
    if (type === 'rank') setIsLoadingRank(true);
    if (type === 'points') setIsLoadingPoints(true);
    if (type === 'all') {
      setIsLoadingRank(true);
      setIsLoadingPoints(true);
    }
    setError(null);

    // Cancel previous request if same type
    if (abortControllerRef.current && requestTypeRef.current === type) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    const controller = new AbortController();
    abortControllerRef.current = controller;
    requestTypeRef.current = type;

    try {
      // Coalesce concurrent calls of same type
      if (requestPromiseRef.current && requestTypeRef.current === type) {
        await requestPromiseRef.current;
      } else {
        const promise = fetchData(type, controller.signal);
        requestPromiseRef.current = promise;
        await promise;
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(err instanceof Error ? err : new Error(String(err)));
        if (type === 'rank') setMonthlyRank(0);
        if (type === 'points') setMonthlyPoints(0);
        if (type === 'all') {
          setMonthlyRank(0);
          setMonthlyPoints(0);
          setMonthlyLeaders([]);
          setAnnualLeaders([]);
        }
      }
    } finally {
      if (type === 'rank') setIsLoadingRank(false);
      if (type === 'points') setIsLoadingPoints(false);
      if (type === 'all') {
        setIsLoadingRank(false);
        setIsLoadingPoints(false);
      }
      
      // Clean up refs if this was the last request
      if (requestTypeRef.current === type) {
        abortControllerRef.current = null;
        requestPromiseRef.current = null;
        requestTypeRef.current = null;
      }
    }
  }, [user?.id, fetchData]);

  const refreshRank = useCallback(() => refresh('rank'), [refresh]);
  const refreshPoints = useCallback(() => refresh('points'), [refresh]);
  const refreshAll = useCallback(() => refresh('all'), [refresh]);

  // New lookup functions
  const getUserByMonthlyRank = useCallback((rank: number) => {
    return monthlyLeaders.find(student => student.rank === rank);
  }, [monthlyLeaders]);

  const getUserByAnnualRank = useCallback((rank: number) => {
    return annualLeaders.find(student => student.rank === rank);
  }, [annualLeaders]);

  // Auto-refresh on login, abort on logout
  useEffect(() => {
    if (user?.id) {
      fetchStudentClassYear();
    } else {
      // Abort any in-flight request on logout
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      requestPromiseRef.current = null;
      requestTypeRef.current = null;
      
      // Reset state
      setMonthlyRank(0);
      setMonthlyPoints(0);
      setMonthlyLeaders([]);
      setAnnualLeaders([]);
      setClassYear(null);
      setError(null);
      setIsLoadingRank(false);
      setIsLoadingPoints(false);
    }
  }, [user?.id, fetchStudentClassYear]);

  // Refetch leaderboard when class year changes
  useEffect(() => {
    if (user?.id && classYear) {
      refreshAll();
    }
  }, [classYear, user?.id, refreshAll]);

  // Abort on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Memoize context value
  const contextValue = useMemo(() => ({
    monthlyRank,
    monthlyPoints,
    monthlyLeaders,
    annualLeaders,
    isLoadingRank,
    isLoadingPoints,
    error,
    refreshRank,
    refreshPoints,
    refreshAll,
    getUserByMonthlyRank,
    getUserByAnnualRank,
  }), [monthlyRank, monthlyPoints, monthlyLeaders, annualLeaders, isLoadingRank, isLoadingPoints, error, refreshRank, refreshPoints, refreshAll, getUserByMonthlyRank, getUserByAnnualRank]);

  return (
    <RankContext.Provider value={contextValue}>
      {children}
    </RankContext.Provider>
  );
};

export const useRank = () => {
  const context = useContext(RankContext);
  if (context === undefined) {
    throw new Error("useRank must be used within a RankProvider");
  }
  return context;
};

import { Trophy, Loader2, Sparkles, Flame, Calendar, Crown, Award } from "lucide-react";
import { CompetitionLeaderboards, LeaderboardStudent, CurrentUserRankInfo, CurrentUserPointInfo } from "@/components/CompetitionLeaderboards";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { fetchLeaderboardData } from "@/utils/leaderboard";
import { Card, CardContent } from "@/components/ui/card";

export default function StudentLeaderboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentUserName, setCurrentUserName] = useState("Scholar");

  // Ranks & Points state
  const [weeklyLeaders, setWeeklyLeaders] = useState<LeaderboardStudent[]>([]);
  const [monthlyLeaders, setMonthlyLeaders] = useState<LeaderboardStudent[]>([]);
  const [annualLeaders, setAnnualLeaders] = useState<LeaderboardStudent[]>([]);
  const [mathLeaders, setMathLeaders] = useState<LeaderboardStudent[]>([]);
  const [englishLeaders, setEnglishLeaders] = useState<LeaderboardStudent[]>([]);

  const [currentUserRanks, setCurrentUserRanks] = useState<CurrentUserRankInfo>({
    weekly: 0,
    monthly: 0,
    annual: 0,
    math: 0,
    english: 0,
  });

  const [currentUserPoints, setCurrentUserPoints] = useState<CurrentUserPointInfo>({
    weekly: 0,
    monthly: 0,
    annual: 0,
    math: 0,
    english: 0,
  });

  const [currentLevel, setCurrentLevel] = useState(1);
  const [leagueTier, setLeagueTier] = useState(1);

  useEffect(() => {
    const loadLeaderboardData = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // 1. Get current student's name
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name, username")
          .eq("id", user.id)
          .single();

        const rawName = profileData?.full_name || profileData?.username || "You";
        setCurrentUserName(rawName);

        // 2. Get student gamification profile for level/tier
        const { data: studentRecord } = await supabase
          .from("students")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (studentRecord) {
          const { data: gameProfile } = await supabase
            .from("student_gamification_profile" as any)
            .select("current_level, current_league_tier")
            .eq("student_id", studentRecord.id)
            .maybeSingle();

          if (gameProfile) {
            setCurrentLevel(Number((gameProfile as any).current_level) || 1);
            setLeagueTier(Number((gameProfile as any).current_league_tier) || 1);
          }
        }

        // 3. Fetch leaderboard data using utility function
        const data = await fetchLeaderboardData(user.id);

        setWeeklyLeaders(data.weeklyLeaders);
        setMonthlyLeaders(data.monthlyLeaders);
        setAnnualLeaders(data.annualLeaders);
        setMathLeaders(data.mathLeaders);
        setEnglishLeaders(data.englishLeaders);
        setCurrentUserRanks(data.currentUserRanks || { weekly: 0, monthly: 0, annual: 0, math: 0, english: 0 });
        setCurrentUserPoints(data.currentUserPoints || { weekly: 0, monthly: 0, annual: 0, math: 0, english: 0 });
      } catch (err) {
        console.error("Error loading leaderboard data:", err);
        toast.error("Failed to load leaderboard standings.");
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-sky-400 mx-auto" />
          <p className="text-slate-400 font-medium animate-pulse text-sm">
            Loading official national standings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 text-slate-100 sm:px-8">
      {/* Header section */}
      <div className="mb-6 animate-fade-in flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-bold text-sky-400 mb-2">
            <Trophy size={14} />
            <span>National Academic Arena</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl text-white">
            Official National Leaderboards<span className="text-sky-400">.</span>
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Real-time rankings powered by verified Éclat Points across BECE & Common Entrance
          </p>
        </div>

        {/* Level badge pill */}
        <div className="flex items-center gap-2 rounded-lg border border-[#2b3a54] bg-[#111d32] px-3.5 py-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-sky-500/20 text-sm font-black text-sky-400 border border-sky-500/30">
            {currentLevel}
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Your Status</p>
            <p className="text-xs font-extrabold text-white">Level {currentLevel} Scholar</p>
          </div>
        </div>
      </div>

      {/* Snapshot Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 animate-fade-in">
        {/* Weekly Rank */}
        <Card className="border border-[#2b3a54] bg-[#0e192b]/90 rounded-xl shadow-none">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="flex items-center gap-1.5 font-bold">
                <Flame size={14} className="text-amber-400" /> Weekly
              </span>
              <span className="text-[11px] font-bold text-amber-300">
                {currentUserPoints.weekly?.toLocaleString() || 0} EP
              </span>
            </div>
            <div className="text-xl font-black text-white">
              {currentUserRanks.weekly && currentUserRanks.weekly > 0 ? `#${currentUserRanks.weekly}` : "Unranked"}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Resets Sunday 23:59 UTC</p>
          </CardContent>
        </Card>

        {/* Monthly Rank */}
        <Card className="border border-[#2b3a54] bg-[#0e192b]/90 rounded-xl shadow-none">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="flex items-center gap-1.5 font-bold">
                <Calendar size={14} className="text-sky-400" /> Monthly
              </span>
              <span className="text-[11px] font-bold text-sky-300">
                {currentUserPoints.monthly?.toLocaleString() || 0} EP
              </span>
            </div>
            <div className="text-xl font-black text-white">
              {currentUserRanks.monthly && currentUserRanks.monthly > 0 ? `#${currentUserRanks.monthly}` : "Unranked"}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">₦50,000 Prize Pool</p>
          </CardContent>
        </Card>

        {/* All-Time Rank */}
        <Card className="border border-[#2b3a54] bg-[#0e192b]/90 rounded-xl shadow-none">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="flex items-center gap-1.5 font-bold">
                <Crown size={14} className="text-yellow-400" /> All-Time
              </span>
              <span className="text-[11px] font-bold text-yellow-300">
                {currentUserPoints.annual?.toLocaleString() || 0} EP
              </span>
            </div>
            <div className="text-xl font-black text-white">
              {currentUserRanks.annual && currentUserRanks.annual > 0 ? `#${currentUserRanks.annual}` : "Unranked"}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Lifetime Hall of Fame</p>
          </CardContent>
        </Card>

        {/* Subject Rank */}
        <Card className="border border-[#2b3a54] bg-[#0e192b]/90 rounded-xl shadow-none">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="flex items-center gap-1.5 font-bold">
                <Award size={14} className="text-emerald-400" /> Maths
              </span>
              <span className="text-[11px] font-bold text-emerald-300">
                {currentUserPoints.math?.toLocaleString() || 0} EP
              </span>
            </div>
            <div className="text-xl font-black text-white">
              {currentUserRanks.math && currentUserRanks.math > 0 ? `#${currentUserRanks.math}` : "Unranked"}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Subject Specialist</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Leaderboards with Category Tabs */}
      <div className="animate-scale-in">
        <CompetitionLeaderboards
          showCurrentUserPosition={true}
          currentUserName={currentUserName}
          weeklyLeaders={weeklyLeaders}
          monthlyLeaders={monthlyLeaders}
          annualLeaders={annualLeaders}
          mathLeaders={mathLeaders}
          englishLeaders={englishLeaders}
          currentUserRanks={currentUserRanks}
          currentUserPoints={currentUserPoints}
          defaultTab="weekly"
        />
      </div>
    </div>
  );
}

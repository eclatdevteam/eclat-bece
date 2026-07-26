import { Trophy, Loader2 } from "lucide-react";
import { CompetitionLeaderboards, LeaderboardStudent } from "@/components/CompetitionLeaderboards";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { fetchLeaderboardData } from "@/utils/leaderboard";

export default function StudentLeaderboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentUserName, setCurrentUserName] = useState("Student");
  const [studentClassYear, setStudentClassYear] = useState<string | null>(null);

  // Ranks state
  const [monthlyLeaders, setMonthlyLeaders] = useState<LeaderboardStudent[]>([]);
  const [annualLeaders, setAnnualLeaders] = useState<LeaderboardStudent[]>([]);
  const [currentUserRanks, setCurrentUserRanks] = useState({ monthly: 0, annual: 0 });
  const [currentUserPoints, setCurrentUserPoints] = useState({ monthly: 0, annual: 0 });

  useEffect(() => {
    const loadLeaderboardData = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Get current student's name and class year
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name, username")
          .eq("id", user.id)
          .single();
        
        const rawName = profileData?.full_name || profileData?.username || "You";
        setCurrentUserName(rawName);

        // Get student's class_year for grade filtering
        const { data: studentData } = await supabase
          .from("students")
          .select("class_year")
          .eq("user_id", user.id)
          .maybeSingle();
        
        const classYear = studentData?.class_year || null;
        setStudentClassYear(classYear);

        // Fetch leaderboard data filtered by student's grade
        const data = await fetchLeaderboardData(user.id, classYear);

        setMonthlyLeaders(data.monthlyLeaders);
        setAnnualLeaders(data.annualLeaders);
        setCurrentUserRanks(data.currentUserRanks || { monthly: 0, annual: 0 });
        setCurrentUserPoints(data.currentUserPoints || { monthly: 0, annual: 0 });

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
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground font-medium animate-pulse">Loading leaderboard standings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8 animate-fade-in">
        <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight flex items-center gap-2">
          <Trophy className="text-accent" size={32} />
          {studentClassYear ? `${studentClassYear.replace('_', ' ').toUpperCase()} Leaderboards` : 'National Leaderboards'} <span className="text-primary">.</span>
        </h2>
        <p className="text-muted-foreground font-medium text-sm sm:text-base mt-1">
          {studentClassYear 
            ? `See where you rank among top ${studentClassYear.replace('_', ' ')} performers nationwide`
            : 'See where you rank among top performers nationwide'}
        </p>
      </div>

      <div className="animate-scale-in">
        <CompetitionLeaderboards 
          showCurrentUserPosition={true}
          currentUserName={currentUserName}
          monthlyLeaders={monthlyLeaders}
          annualLeaders={annualLeaders}
          currentUserRanks={currentUserRanks}
          currentUserPoints={currentUserPoints}
        />
      </div>
    </div>
  );
}

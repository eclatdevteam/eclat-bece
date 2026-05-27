import { Trophy, Loader2 } from "lucide-react";
import { CompetitionLeaderboards, LeaderboardStudent } from "@/components/CompetitionLeaderboards";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function StudentLeaderboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentUserName, setCurrentUserName] = useState("Student");

  // Ranks state
  const [monthlyLeaders, setMonthlyLeaders] = useState<LeaderboardStudent[]>([]);
  const [annualLeaders, setAnnualLeaders] = useState<LeaderboardStudent[]>([]);
  const [currentUserRanks, setCurrentUserRanks] = useState({ monthly: 0, annual: 0 });
  const [currentUserPoints, setCurrentUserPoints] = useState({ monthly: 0, annual: 0 });

  useEffect(() => {
    const fetchLeaderboardData = async () => {
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

        // 2. Get student ID
        const { data: studentData, error: studentError } = await supabase
          .from("students")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (studentError || !studentData) {
          throw new Error("Student profile not found.");
        }

        const studentId = studentData.id;

        // 3. Fetch all students
        const { data: studentsData, error: studentsError } = await supabase
          .from("students")
          .select("id, user_id, school_id");

        if (studentsError) throw studentsError;

        // 4. Fetch all profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name, username");

        if (profilesError) throw profilesError;

        // 5. Fetch all schools
        const { data: schoolsData, error: schoolsError } = await supabase
          .from("schools")
          .select("id, school_name");

        if (schoolsError) throw schoolsError;

        // 6. Fetch all quiz results
        const { data: quizResults, error: quizError } = await supabase
          .from("quiz_results")
          .select("student_id, correct_answers, completed_at");

        if (quizError) throw quizError;

        // --- CALCULATE REAL POINTS ---
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const firstDayOfYear = new Date(now.getFullYear(), 0, 1);

        const monthlyScoresMap = new Map<string, number>();
        const annualScoresMap = new Map<string, number>();

        if (quizResults) {
          quizResults.forEach(q => {
            const date = new Date(q.completed_at);
            const points = q.correct_answers * 100; // Point system: 100 points per correct answer

            if (date >= firstDayOfMonth) {
              monthlyScoresMap.set(q.student_id, (monthlyScoresMap.get(q.student_id) || 0) + points);
            }
            if (date >= firstDayOfYear) {
              annualScoresMap.set(q.student_id, (annualScoresMap.get(q.student_id) || 0) + points);
            }
          });
        }

        const avatars = ["🎓", "📚", "🌟", "💫", "🎯", "👑", "🏆", "✨", "💎", "🔥", "🚀", "💪"];
        const getEmojiAvatar = (id: string) => {
          let hash = 0;
          for (let i = 0; i < id.length; i++) {
            hash = id.charCodeAt(i) + ((hash << 5) - hash);
          }
          const index = Math.abs(hash) % avatars.length;
          return avatars[index];
        };

        const profileMap = new Map(profilesData?.map(p => [p.id, p]) || []);
        const schoolMap = new Map(schoolsData?.map(s => [s.id, s.school_name]) || []);

        const realMonthly: LeaderboardStudent[] = [];
        const realAnnual: LeaderboardStudent[] = [];

        if (studentsData) {
          studentsData.forEach((s) => {
            const mPts = monthlyScoresMap.get(s.id) || 0;
            const aPts = annualScoresMap.get(s.id) || 0;
            const isCurrentUser = s.user_id === user.id;

            // Resolve name
            let name = "Unknown Student";
            if (isCurrentUser) {
              name = `${rawName} (You)`;
            } else {
              const p = profileMap.get(s.user_id);
              if (p) {
                name = p.full_name || p.username || "Unknown Student";
              } else {
                name = `Learner #${s.id.slice(0, 4)}`;
              }
            }

            const schoolName = s.school_id ? (schoolMap.get(s.school_id) || "Private Study") : "Private Study";

            realMonthly.push({
              rank: 0,
              name,
              school: schoolName,
              points: mPts,
              avatar: isCurrentUser ? "👤" : getEmojiAvatar(s.id),
              isCurrentUser
            });

            realAnnual.push({
              rank: 0,
              name,
              school: schoolName,
              points: aPts,
              avatar: isCurrentUser ? "👤" : getEmojiAvatar(s.id),
              isCurrentUser
            });
          });
        }

        // Sort by points descending, then by name for stable sorting
        const sortedMonthly = realMonthly.sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          return a.name.localeCompare(b.name);
        });
        sortedMonthly.forEach((s, idx) => {
          s.rank = idx + 1;
        });

        const sortedAnnual = realAnnual.sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          return a.name.localeCompare(b.name);
        });
        sortedAnnual.forEach((s, idx) => {
          s.rank = idx + 1;
        });

        // Find current user ranks and points
        const userMonthlyEntry = sortedMonthly.find(s => s.isCurrentUser);
        const userAnnualEntry = sortedAnnual.find(s => s.isCurrentUser);

        const currentRanks = {
          monthly: userMonthlyEntry?.rank || 0,
          annual: userAnnualEntry?.rank || 0
        };

        const currentPoints = {
          monthly: userMonthlyEntry?.points || 0,
          annual: userAnnualEntry?.points || 0
        };

        setMonthlyLeaders(sortedMonthly);
        setAnnualLeaders(sortedAnnual);
        setCurrentUserRanks(currentRanks);
        setCurrentUserPoints(currentPoints);

      } catch (err) {
        console.error("Error loading leaderboard data:", err);
        toast.error("Failed to load leaderboard standings.");
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboardData();
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
          National Leaderboards <span className="text-primary">.</span>
        </h2>
        <p className="text-muted-foreground font-medium text-sm sm:text-base mt-1">See where you rank among top performers nationwide</p>
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

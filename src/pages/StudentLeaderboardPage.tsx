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
          .select("full_name")
          .eq("id", user.id)
          .single();
        
        const rawName = profileData?.full_name || "You";
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

        // 3. Fetch all students profiles and schools
        const { data: studentsData } = await supabase
          .from("students")
          .select(`
            id,
            user_id,
            school:schools(school_name),
            profile:profiles(full_name)
          `);

        // 4. Fetch all quiz results
        const { data: quizResults } = await supabase
          .from("quiz_results")
          .select("student_id, correct_answers, completed_at");

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

        const realMonthly: LeaderboardStudent[] = [];
        const realAnnual: LeaderboardStudent[] = [];

        if (studentsData) {
          studentsData.forEach((s: any) => {
            const mPts = monthlyScoresMap.get(s.id) || 0;
            const aPts = annualScoresMap.get(s.id) || 0;
            const name = s.profile?.full_name || "Unknown Student";
            const schoolName = s.school?.school_name || "Private Study";
            const isCurrentUser = s.user_id === user.id;

            if (mPts > 0 || isCurrentUser) {
              realMonthly.push({
                rank: 0, // Assigned below
                name: isCurrentUser ? `${name} (You)` : name,
                school: schoolName,
                points: mPts,
                avatar: isCurrentUser ? "👤" : "🎓",
                isCurrentUser
              });
            }

            if (aPts > 0 || isCurrentUser) {
              realAnnual.push({
                rank: 0, // Assigned below
                name: isCurrentUser ? `${name} (You)` : name,
                school: schoolName,
                points: aPts,
                avatar: isCurrentUser ? "👤" : "🎓",
                isCurrentUser
              });
            }
          });
        }

        // --- HYBRID MERGING (Real + Realistic Mock) ---

        // Mock Monthly Leaders
        const mockMonthly = [
          { name: "Chidinma Okafor", school: "Corona Secondary School, Lagos", points: 9850, avatar: "🎓" },
          { name: "Ibrahim Musa", school: "Government College, Abuja", points: 9620, avatar: "📚" },
          { name: "Blessing Adeyemi", school: "International School, Ibadan", points: 9340, avatar: "🌟" },
          { name: "Emeka Nwankwo", school: "Enugu State Academy", points: 9180, avatar: "💫" },
          { name: "Fatima Bello", school: "Capital Science Academy, Kano", points: 8950, avatar: "🎯" },
        ];

        // Merge and sort
        const filteredMockMonthly = mockMonthly.filter(m => 
          !realMonthly.some(r => r.name.replace(" (You)", "") === m.name)
        );
        const combinedMonthly = [...realMonthly, ...filteredMockMonthly]
          .sort((a, b) => b.points - a.points);

        combinedMonthly.forEach((s, idx) => {
          s.rank = idx + 1;
        });

        // Mock Annual Leaders
        const mockAnnual = [
          { name: "Oluwaseun Ajayi", school: "Lagos Preparatory School", points: 98540, avatar: "👑" },
          { name: "Amina Yusuf", school: "Government Secondary, Kaduna", points: 96780, avatar: "🥇" },
          { name: "Chukwuemeka Eze", school: "Port Harcourt International", points: 94920, avatar: "🥈" },
          { name: "Aisha Mohammed", school: "Federal Capital College, Abuja", points: 92650, avatar: "🥉" },
          { name: "Tunde Williams", school: "Gateway Academy, Ibadan", points: 90340, avatar: "⭐" },
        ];

        const filteredMockAnnual = mockAnnual.filter(m => 
          !realAnnual.some(r => r.name.replace(" (You)", "") === m.name)
        );
        const combinedAnnual = [...realAnnual, ...filteredMockAnnual]
          .sort((a, b) => b.points - a.points);

        combinedAnnual.forEach((s, idx) => {
          s.rank = idx + 1;
        });

        // Find current user ranks and points
        const userMonthlyEntry = combinedMonthly.find(s => s.isCurrentUser);
        const userAnnualEntry = combinedAnnual.find(s => s.isCurrentUser);

        const currentRanks = {
          monthly: userMonthlyEntry?.rank || 0,
          annual: userAnnualEntry?.rank || 0
        };

        const currentPoints = {
          monthly: userMonthlyEntry?.points || 0,
          annual: userAnnualEntry?.points || 0
        };

        setMonthlyLeaders(combinedMonthly.slice(0, 10)); // Show top 10
        setAnnualLeaders(combinedAnnual.slice(0, 10));   // Show top 10
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

import { supabase } from "@/integrations/supabase/client";

export interface LeaderboardStudent {
  rank: number;
  name: string;
  school: string;
  points: number;
  avatar: string;
  isCurrentUser?: boolean;
  studentId?: string;
  userId?: string;
}

export interface LeaderboardData {
  monthlyLeaders: LeaderboardStudent[];
  annualLeaders: LeaderboardStudent[];
  currentUserRanks?: { monthly: number; annual: number };
  currentUserPoints?: { monthly: number; annual: number };
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

export const fetchLeaderboardData = async (userId?: string, classYear?: string): Promise<LeaderboardData> => {
  try {
    // Fetch all students
    const { data: studentsData, error: studentsError } = await supabase
      .from("students")
      .select("id, user_id, school_id, class_year");

    if (studentsError) throw studentsError;

    // Fetch all profiles
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, username");

    if (profilesError) throw profilesError;

    // Fetch all schools
    const { data: schoolsData, error: schoolsError } = await supabase
      .from("schools")
      .select("id, school_name");

    if (schoolsError) throw schoolsError;

    // Fetch all quiz results
    const { data: quizResults, error: quizError } = await supabase
      .from("quiz_results")
      .select("student_id, correct_answers, completed_at");

    if (quizError) throw quizError;

    // Calculate real points
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfYear = new Date(now.getFullYear(), 0, 1);

    const monthlyScoresMap = new Map<string, number>();
    const annualScoresMap = new Map<string, number>();

    if (quizResults) {
      quizResults.forEach(q => {
        const date = new Date(q.completed_at);
        const points = q.correct_answers * 100;

        if (date >= firstDayOfMonth) {
          monthlyScoresMap.set(q.student_id, (monthlyScoresMap.get(q.student_id) || 0) + points);
        }
        if (date >= firstDayOfYear) {
          annualScoresMap.set(q.student_id, (annualScoresMap.get(q.student_id) || 0) + points);
        }
      });
    }

    const profileMap = new Map(profilesData?.map(p => [p.id, p]) || []);
    const schoolMap = new Map(schoolsData?.map(s => [s.id, s.school_name]) || []);

    const realMonthly: LeaderboardStudent[] = [];
    const realAnnual: LeaderboardStudent[] = [];

    if (studentsData) {
      studentsData.forEach((s) => {
        // Filter by class_year if classYear parameter is provided
        if (classYear && s.class_year !== classYear) {
          return;
        }
        const mPts = monthlyScoresMap.get(s.id) || 0;
        const aPts = annualScoresMap.get(s.id) || 0;
        const isCurrentUser = userId ? s.user_id === userId : false;

        // Resolve name
        let name = "Unknown Student";
        if (isCurrentUser && userId) {
          const p = profileMap.get(s.user_id);
          name = `${p?.full_name || p?.username || "You"} (You)`;
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

    // Find current user ranks and points if userId provided
    let currentUserRanks, currentUserPoints;
    if (userId) {
      const userMonthlyEntry = sortedMonthly.find(s => s.isCurrentUser);
      const userAnnualEntry = sortedAnnual.find(s => s.isCurrentUser);

      currentUserRanks = {
        monthly: userMonthlyEntry?.rank || 0,
        annual: userAnnualEntry?.rank || 0
      };

      currentUserPoints = {
        monthly: userMonthlyEntry?.points || 0,
        annual: userAnnualEntry?.points || 0
      };
    }

    return {
      monthlyLeaders: sortedMonthly,
      annualLeaders: sortedAnnual,
      currentUserRanks,
      currentUserPoints
    };

  } catch (error) {
    console.error("Error fetching leaderboard data:", error);
    throw error;
  }
};

import { supabase } from "@/integrations/supabase/client";

export interface LeaderboardStudent {
  rank: number;
  name: string;
  school: string;
  points: number;
  avatar: string;
  isCurrentUser?: boolean;
  schoolId?: string | null;
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

export const fetchLeaderboardData = async (userId?: string): Promise<LeaderboardData> => {
  try {
    // 1. Try public RPC function first (high performance & accessible to anonymous and authenticated users)
    const { data: rpcData, error: rpcError } = await supabase.rpc("get_public_leaderboard" as any);

    if (!rpcError && rpcData) {
      const parsedData = typeof rpcData === "string" ? JSON.parse(rpcData) : rpcData;
      const rawMonthly: any[] = parsedData.monthly || [];
      const rawAnnual: any[] = parsedData.annual || [];

      const monthlyLeaders: LeaderboardStudent[] = rawMonthly.map((item, index) => ({
        rank: index + 1,
        name: item.name || "Learner",
        school: item.school || "Independent Scholar",
        schoolId: item.school_id || null,
        points: Number(item.points) || 0,
        avatar: getEmojiAvatar(item.student_id || String(index)),
        isCurrentUser: false,
      }));

      const annualLeaders: LeaderboardStudent[] = rawAnnual.map((item, index) => ({
        rank: index + 1,
        name: item.name || "Learner",
        school: item.school || "Independent Scholar",
        schoolId: item.school_id || null,
        points: Number(item.points) || 0,
        avatar: getEmojiAvatar(item.student_id || String(index)),
        isCurrentUser: false,
      }));

      return {
        monthlyLeaders,
        annualLeaders,
        currentUserRanks: { monthly: 0, annual: 0 },
        currentUserPoints: { monthly: 0, annual: 0 },
      };
    }

    // 2. Fallback to direct client query if RPC fails
    const { data: studentsData } = await supabase
      .from("students")
      .select("id, user_id, school_id");

    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, full_name, username");

    const { data: schoolsData } = await supabase
      .from("schools")
      .select("id, school_name");

    const { data: quizResults } = await supabase
      .from("quiz_results")
      .select("student_id, correct_answers, completed_at");

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
        const mPts = monthlyScoresMap.get(s.id) || 0;
        const aPts = annualScoresMap.get(s.id) || 0;
        const isCurrentUser = userId ? s.user_id === userId : false;

        let name = "Learner";
        const p = profileMap.get(s.user_id);
        if (p) {
          name = p.full_name || p.username || "Learner";
        } else {
          name = `Learner #${s.id.slice(0, 4)}`;
        }

        const schoolName = s.school_id ? (schoolMap.get(s.school_id) || "Independent Scholar") : "Independent Scholar";

        realMonthly.push({
          rank: 0,
          name,
          school: schoolName,
          schoolId: s.school_id || null,
          points: mPts,
          avatar: isCurrentUser ? "👤" : getEmojiAvatar(s.id),
          isCurrentUser
        });

        realAnnual.push({
          rank: 0,
          name,
          school: schoolName,
          schoolId: s.school_id || null,
          points: aPts,
          avatar: isCurrentUser ? "👤" : getEmojiAvatar(s.id),
          isCurrentUser
        });
      });
    }

    const sortedMonthly = realMonthly
      .sort((a, b) => (b.points !== a.points ? b.points - a.points : a.name.localeCompare(b.name)))
      .slice(0, 5);
    sortedMonthly.forEach((s, idx) => { s.rank = idx + 1; });

    const sortedAnnual = realAnnual
      .sort((a, b) => (b.points !== a.points ? b.points - a.points : a.name.localeCompare(b.name)))
      .slice(0, 5);
    sortedAnnual.forEach((s, idx) => { s.rank = idx + 1; });

    return {
      monthlyLeaders: sortedMonthly,
      annualLeaders: sortedAnnual,
      currentUserRanks: { monthly: 0, annual: 0 },
      currentUserPoints: { monthly: 0, annual: 0 },
    };

  } catch (error) {
    console.error("Error fetching leaderboard data:", error);
    return {
      monthlyLeaders: [],
      annualLeaders: [],
      currentUserRanks: { monthly: 0, annual: 0 },
      currentUserPoints: { monthly: 0, annual: 0 },
    };
  }
};

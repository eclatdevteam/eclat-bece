import { supabase } from "@/integrations/supabase/client";

export interface LeaderboardStudent {
  rank: number;
  studentId?: string;
  name: string;
  school: string;
  points: number;
  avatar: string;
  isCurrentUser?: boolean;
  schoolId?: string | null;
  level?: number;
  leagueTier?: number;
}

export interface LeaderboardData {
  weeklyLeaders: LeaderboardStudent[];
  monthlyLeaders: LeaderboardStudent[];
  annualLeaders: LeaderboardStudent[]; // All-time Hall of Fame
  mathLeaders: LeaderboardStudent[];
  englishLeaders: LeaderboardStudent[];
  currentUserRanks?: {
    weekly: number;
    monthly: number;
    annual: number;
    math: number;
    english: number;
  };
  currentUserPoints?: {
    weekly: number;
    monthly: number;
    annual: number;
    math: number;
    english: number;
  };
}

const avatars = ["🎓", "📚", "🌟", "💫", "🎯", "👑", "🏆", "✨", "💎", "🔥", "🚀", "💪"];

export const getEmojiAvatar = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % avatars.length;
  return avatars[index];
};

export const fetchLeaderboardData = async (userId?: string): Promise<LeaderboardData> => {
  try {
    let currentStudentId: string | null = null;
    if (userId) {
      const { data: studentRecord } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();
      if (studentRecord) {
        currentStudentId = studentRecord.id;
      }
    }

    // 1. Try public RPC function
    const { data: rpcData, error: rpcError } = await supabase.rpc("get_public_leaderboard" as any);

    if (!rpcError && rpcData) {
      const parsedData = typeof rpcData === "string" ? JSON.parse(rpcData) : rpcData;
      const rawWeekly: any[] = parsedData.weekly || [];
      const rawMonthly: any[] = parsedData.monthly || [];
      const rawAnnual: any[] = parsedData.all_time || parsedData.annual || [];
      const rawMath: any[] = parsedData.math || [];
      const rawEnglish: any[] = parsedData.english || [];

      const mapItems = (items: any[]): LeaderboardStudent[] =>
        items.map((item, index) => {
          const isCurrentUser = currentStudentId ? item.student_id === currentStudentId : false;
          return {
            rank: index + 1,
            studentId: item.student_id,
            name: isCurrentUser ? `${item.name} (You)` : (item.name || "Learner"),
            school: item.school || "Independent Scholar",
            schoolId: item.school_id || null,
            points: Number(item.points) || 0,
            level: Number(item.level) || 1,
            leagueTier: Number(item.league_tier) || 1,
            avatar: isCurrentUser ? "👤" : getEmojiAvatar(item.student_id || String(index)),
            isCurrentUser,
          };
        });

      const weeklyLeaders = mapItems(rawWeekly);
      const monthlyLeaders = mapItems(rawMonthly);
      const annualLeaders = mapItems(rawAnnual);
      const mathLeaders = mapItems(rawMath);
      const englishLeaders = mapItems(rawEnglish);

      const findUserRank = (list: LeaderboardStudent[]) => {
        const found = list.find((s) => s.isCurrentUser);
        return found ? found.rank : 0;
      };

      const findUserPoints = (list: LeaderboardStudent[]) => {
        const found = list.find((s) => s.isCurrentUser);
        return found ? found.points : 0;
      };

      return {
        weeklyLeaders,
        monthlyLeaders,
        annualLeaders,
        mathLeaders,
        englishLeaders,
        currentUserRanks: {
          weekly: findUserRank(weeklyLeaders),
          monthly: findUserRank(monthlyLeaders),
          annual: findUserRank(annualLeaders),
          math: findUserRank(mathLeaders),
          english: findUserRank(englishLeaders),
        },
        currentUserPoints: {
          weekly: findUserPoints(weeklyLeaders),
          monthly: findUserPoints(monthlyLeaders),
          annual: findUserPoints(annualLeaders),
          math: findUserPoints(mathLeaders),
          english: findUserPoints(englishLeaders),
        },
      };
    }

    // 2. Fallback to querying student_gamification_profile directly
    const { data: studentsData } = await supabase.from("students").select("id, user_id, school_id");
    const { data: profilesData } = await supabase.from("profiles").select("id, full_name, username");
    const { data: schoolsData } = await supabase.from("schools").select("id, school_name");
    const { data: gameProfiles } = await supabase.from("student_gamification_profile" as any).select("*");

    const profileMap = new Map(profilesData?.map((p) => [p.id, p]) || []);
    const schoolMap = new Map(schoolsData?.map((s) => [s.id, s.school_name]) || []);
    const gameMap = new Map((gameProfiles || []).map((g: any) => [g.student_id, g]));

    const buildList = (key: "weekly_ep" | "monthly_ep" | "lifetime_ep"): LeaderboardStudent[] => {
      if (!studentsData) return [];
      return studentsData
        .map((s) => {
          const g = gameMap.get(s.id);
          const points = Number(g?.[key] || 0);
          const p = profileMap.get(s.user_id);
          const isCurrentUser = currentStudentId ? s.id === currentStudentId : false;
          const name = p?.full_name || p?.username || `Learner #${s.id.slice(0, 4)}`;

          return {
            rank: 0,
            studentId: s.id,
            name: isCurrentUser ? `${name} (You)` : name,
            school: s.school_id ? schoolMap.get(s.school_id) || "Independent Scholar" : "Independent Scholar",
            schoolId: s.school_id || null,
            points,
            level: Number(g?.current_level || 1),
            leagueTier: Number(g?.current_league_tier || 1),
            avatar: isCurrentUser ? "👤" : getEmojiAvatar(s.id),
            isCurrentUser,
          };
        })
        .sort((a, b) => (b.points !== a.points ? b.points - a.points : a.name.localeCompare(b.name)))
        .map((item, idx) => ({ ...item, rank: idx + 1 }));
    };

    const weeklyLeaders = buildList("weekly_ep");
    const monthlyLeaders = buildList("monthly_ep");
    const annualLeaders = buildList("lifetime_ep");

    return {
      weeklyLeaders,
      monthlyLeaders,
      annualLeaders,
      mathLeaders: [],
      englishLeaders: [],
      currentUserRanks: {
        weekly: weeklyLeaders.find((s) => s.isCurrentUser)?.rank || 0,
        monthly: monthlyLeaders.find((s) => s.isCurrentUser)?.rank || 0,
        annual: annualLeaders.find((s) => s.isCurrentUser)?.rank || 0,
        math: 0,
        english: 0,
      },
      currentUserPoints: {
        weekly: weeklyLeaders.find((s) => s.isCurrentUser)?.points || 0,
        monthly: monthlyLeaders.find((s) => s.isCurrentUser)?.points || 0,
        annual: annualLeaders.find((s) => s.isCurrentUser)?.points || 0,
        math: 0,
        english: 0,
      },
    };
  } catch (error) {
    console.error("Error fetching leaderboard data:", error);
    return {
      weeklyLeaders: [],
      monthlyLeaders: [],
      annualLeaders: [],
      mathLeaders: [],
      englishLeaders: [],
      currentUserRanks: { weekly: 0, monthly: 0, annual: 0, math: 0, english: 0 },
      currentUserPoints: { weekly: 0, monthly: 0, annual: 0, math: 0, english: 0 },
    };
  }
};

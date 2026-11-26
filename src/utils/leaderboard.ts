import { supabase } from "@/integrations/supabase/client";

export interface LeaderboardStudent {
  rank: number;
  studentId?: string;
  name: string;
  school: string;
  points: number;
  avatar: string;
  avatarUrl?: string | null;
  isCurrentUser?: boolean;
  schoolId?: string | null;
  level?: number;
  leagueTier?: number;
}

export interface SchoolLeaderboardItem {
  rank: number;
  schoolId: string;
  schoolName: string;
  totalEP: number;
  activeStudentsCount: number;
  avgEPPerStudent: number;
  tierBadge?: string;
}

export interface LeaderboardData {
  weeklyLeaders: LeaderboardStudent[];
  monthlyLeaders: LeaderboardStudent[];
  annualLeaders: LeaderboardStudent[]; // All-time Hall of Fame
  mathLeaders: LeaderboardStudent[];
  englishLeaders: LeaderboardStudent[];
  scienceLeaders: LeaderboardStudent[];
  schoolLeaders?: SchoolLeaderboardItem[];
  currentUserRanks?: {
    weekly: number;
    monthly: number;
    annual: number;
    math: number;
    english: number;
    science: number;
  };
  currentUserPoints?: {
    weekly: number;
    monthly: number;
    annual: number;
    math: number;
    english: number;
    science: number;
  };
}

const avatars = ["🎓", "📚", "🌟", "💫", "🎯", "👑", "🏆", "✨", "💎", "🔥", "🚀", "💪"];

/**
 * Formats a student's name for public leaderboard display, masking the last name for privacy.
 * e.g., "Chiamaka Okonkwo" -> "Chiamaka O.", "David Kalu" -> "David K."
 */
export function formatPublicStudentName(name: string): string {
  if (!name) return "Scholar";
  const isYou = name.includes("(You)");
  const clean = name.replace(/\s*\(You\)$/i, "").trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return name;
  const firstName = parts[0];
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  return `${firstName} ${lastInitial}.${isYou ? " (You)" : ""}`;
}

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
    const { data: rpcData, error: rpcError } = await supabase.rpc("get_public_leaderboard");

    if (!rpcError && rpcData) {
      const parsedData = typeof rpcData === "string" ? JSON.parse(rpcData) : rpcData;
      const rawWeekly: any[] = parsedData.weekly || [];
      const rawMonthly: any[] = parsedData.monthly || [];
      const rawAnnual: any[] = parsedData.all_time || parsedData.annual || [];
      const rawMath: any[] = parsedData.math || [];
      const rawEnglish: any[] = parsedData.english || [];
      const rawScience: any[] = parsedData.science || [];

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
            avatarUrl: item.avatar_url || null,
            isCurrentUser,
          };
        });

      const weeklyLeaders = mapItems(rawWeekly);
      const monthlyLeaders = mapItems(rawMonthly);
      const annualLeaders = mapItems(rawAnnual);
      const mathLeaders = mapItems(rawMath);
      const englishLeaders = mapItems(rawEnglish);
      const scienceLeaders = mapItems(rawScience);

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
        scienceLeaders,
        currentUserRanks: {
          weekly: findUserRank(weeklyLeaders),
          monthly: findUserRank(monthlyLeaders),
          annual: findUserRank(annualLeaders),
          math: findUserRank(mathLeaders),
          english: findUserRank(englishLeaders),
          science: findUserRank(scienceLeaders),
        },
        currentUserPoints: {
          weekly: findUserPoints(weeklyLeaders),
          monthly: findUserPoints(monthlyLeaders),
          annual: findUserPoints(annualLeaders),
          math: findUserPoints(mathLeaders),
          english: findUserPoints(englishLeaders),
          science: findUserPoints(scienceLeaders),
        },
      };
    }

    // 2. Fallback to querying student_gamification_profile directly
    const { data: studentsData } = await supabase.from("students").select("id, user_id, school_id");
    const { data: profilesData } = await supabase.from("profiles").select("id, full_name, username, avatar_url");
    const { data: schoolsData } = await supabase.from("schools").select("id, school_name");
    const { data: gameProfiles } = await supabase.from("student_gamification_profile").select("*");

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
            avatarUrl: p?.avatar_url || null,
            isCurrentUser,
          };
        })
        .sort((a, b) => (b.points !== a.points ? b.points - a.points : a.name.localeCompare(b.name)))
        .map((item, idx) => ({ ...item, rank: idx + 1 }));
    };

    const buildSchoolList = (): SchoolLeaderboardItem[] => {
      if (!schoolsData || schoolsData.length === 0) return [];
      const schoolStudentsMap = new Map<string, any[]>();
      (studentsData || []).forEach((s) => {
        if (s.school_id) {
          if (!schoolStudentsMap.has(s.school_id)) {
            schoolStudentsMap.set(s.school_id, []);
          }
          schoolStudentsMap.get(s.school_id)!.push(s);
        }
      });

      return schoolsData
        .map((sch) => {
          const schStudents = schoolStudentsMap.get(sch.id) || [];
          const totalEP = schStudents.reduce((sum, s) => {
            const g = gameMap.get(s.id);
            return sum + Number(g?.lifetime_ep || 0);
          }, 0);
          const activeStudentsCount = schStudents.length;
          const avgEPPerStudent = activeStudentsCount > 0 ? Math.round(totalEP / activeStudentsCount) : 0;

          return {
            rank: 0,
            schoolId: sch.id,
            schoolName: sch.school_name,
            totalEP,
            activeStudentsCount,
            avgEPPerStudent,
          };
        })
        .sort((a, b) => b.totalEP - a.totalEP)
        .map((item, idx) => ({ ...item, rank: idx + 1 }));
    };

    const weeklyLeaders = buildList("weekly_ep");
    const monthlyLeaders = buildList("monthly_ep");
    const annualLeaders = buildList("lifetime_ep");
    const schoolLeaders = buildSchoolList();

    return {
      weeklyLeaders,
      monthlyLeaders,
      annualLeaders,
      mathLeaders: [],
      englishLeaders: [],
      scienceLeaders: [],
      schoolLeaders,
      currentUserRanks: {
        weekly: weeklyLeaders.find((s) => s.isCurrentUser)?.rank || 0,
        monthly: monthlyLeaders.find((s) => s.isCurrentUser)?.rank || 0,
        annual: annualLeaders.find((s) => s.isCurrentUser)?.rank || 0,
        math: 0,
        english: 0,
        science: 0,
      },
      currentUserPoints: {
        weekly: weeklyLeaders.find((s) => s.isCurrentUser)?.points || 0,
        monthly: monthlyLeaders.find((s) => s.isCurrentUser)?.points || 0,
        annual: annualLeaders.find((s) => s.isCurrentUser)?.points || 0,
        math: 0,
        english: 0,
        science: 0,
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
      scienceLeaders: [],
      schoolLeaders: [],
      currentUserRanks: { weekly: 0, monthly: 0, annual: 0, math: 0, english: 0, science: 0 },
      currentUserPoints: { weekly: 0, monthly: 0, annual: 0, math: 0, english: 0, science: 0 },
    };
  }
};

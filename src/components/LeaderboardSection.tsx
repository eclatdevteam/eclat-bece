import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, Crown, ArrowRight, Clock, Building2, Sparkles, Loader2 } from "lucide-react";
import { useLeaderboardData } from "@/hooks/useLeaderboardData";
import {
  LeaderboardStudent,
  SchoolLeaderboardItem,
  formatPublicStudentName,
} from "@/utils/leaderboard";
import pic1 from "@/assets/pic1.jpg";
import pic2 from "@/assets/pic2.jpg";
import pic3 from "@/assets/pic3.jpg";
import pic4 from "@/assets/pic4.jpg";

interface LeaderboardSectionProps {
  onJoinArenaClick: () => void;
}

const getMonthlyCountdown = (): string => {
  const now = new Date();
  const target = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59));
  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) return "Resetting...";
  const d = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const h = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const m = Math.floor((diffMs / (1000 * 60)) % 60);
  return `${d.toString().padStart(2, "0")}d ${h.toString().padStart(2, "0")}h ${m.toString().padStart(2, "0")}m`;
};

// Generates 2-letter initials from name
const getInitials = (name: string): string => {
  if (!name) return "SC";
  const clean = name.replace(/\s*\(You\)$/i, "").trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Reusable avatar component handling photo URLs and initials fallback
interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
  rank?: number;
  sizeClass?: string;
  defaultFallbackImg?: string;
}

const StudentAvatar = ({
  name,
  avatarUrl,
  rank,
  sizeClass = "w-14 h-14",
  defaultFallbackImg,
}: AvatarProps) => {
  const [imgError, setImgError] = useState(false);
  const imgSrc = !imgError && (avatarUrl || defaultFallbackImg);

  if (imgSrc) {
    return (
      <img
        src={imgSrc}
        alt={name}
        onError={() => setImgError(true)}
        className={`${sizeClass} rounded-full object-cover shadow-sm`}
      />
    );
  }

  const initials = getInitials(name);
  const rankColors =
    rank === 1
      ? "bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950"
      : rank === 2
      ? "bg-gradient-to-br from-slate-300 to-slate-500 text-slate-950"
      : rank === 3
      ? "bg-gradient-to-br from-amber-600 to-amber-800 text-white"
      : "bg-cyan-500/15 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300";

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center font-black tracking-wider text-xs sm:text-sm select-none ${rankColors}`}
    >
      {initials}
    </div>
  );
};

export const LeaderboardSection = ({ onJoinArenaClick }: LeaderboardSectionProps) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("National");
  const { data, isLoading } = useLeaderboardData();

  const tabs = ["National", "Mathematics", "English Lang", "Science", "Schools"];

  const countdown = useMemo(() => getMonthlyCountdown(), []);

  const currentMonthName = useMemo(() => {
    return new Intl.DateTimeFormat("en-US", { month: "long" }).format(new Date());
  }, []);

  // Filter students or schools based on active tab
  const activeStudents: LeaderboardStudent[] = useMemo(() => {
    if (!data) return [];
    switch (activeTab) {
      case "Mathematics":
        return data.mathLeaders || [];
      case "English Lang":
        return data.englishLeaders || [];
      case "Science":
        return data.scienceLeaders || [];
      case "National":
      default:
        return data.monthlyLeaders || [];
    }
  }, [data, activeTab]);

  const activeSchools: SchoolLeaderboardItem[] = useMemo(() => {
    return data?.schoolLeaders || [];
  }, [data]);

  const isSchoolsTab = activeTab === "Schools";

  // Top 3 Podium contenders
  const student1 = activeStudents.find((s) => s.rank === 1);
  const student2 = activeStudents.find((s) => s.rank === 2);
  const student3 = activeStudents.find((s) => s.rank === 3);

  const school1 = activeSchools.find((s) => s.rank === 1);
  const school2 = activeSchools.find((s) => s.rank === 2);
  const school3 = activeSchools.find((s) => s.rank === 3);

  // Ranks 4 to 8 for table
  const tableStudents = activeStudents.filter((s) => s.rank >= 4).slice(0, 5);
  const tableSchools = activeSchools.filter((s) => s.rank >= 4).slice(0, 5);

  const hasAnyData = isSchoolsTab ? activeSchools.length > 0 : activeStudents.length > 0;

  return (
    <section id="leaderboard" className="py-10 lg:py-14 transition-colors duration-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 text-xs font-semibold tracking-wide mb-4">
            <Trophy size={14} className="text-amber-500" />
            <span>MONTHLY LEADERBOARD</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
            Climb the Board. Win the Scholarship.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            Top-performing students across Nigeria earn real cash rewards and national recognition
            at the end of every monthly season.
          </p>
        </div>

        {/* Grand Prize Banner Card */}
        <div className="mb-10 rounded-2xl border border-slate-200 dark:border-[#1e2f50] bg-white dark:bg-[#0c1830] p-4 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0 font-black text-lg">
              <Trophy size={22} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                MONTHLY GRAND PRIZE
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                ₦50,000 Monthly Scholarship
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Direct academic grant to the top-scoring scholar of each season.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="px-3.5 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-1.5 shrink-0">
              <Clock size={13} />
              <span>SEASON ENDS IN: {countdown}</span>
            </div>

            <button
              onClick={onJoinArenaClick}
              className="w-full sm:w-auto px-6 py-2.5 rounded-full text-sm font-bold bg-[#00a8e8] hover:bg-[#0096d1] text-slate-950 shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.02]"
            >
              Join the Arena
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center justify-center gap-2 mb-10 overflow-x-auto pb-2 scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab
                  ? "bg-[#00a8e8] text-slate-950 shadow-sm font-black"
                  : "bg-slate-100 dark:bg-[#0c1830] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#1e2f50]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Loading Skeleton */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 rounded-3xl border border-slate-200 dark:border-[#1e2f50] bg-white dark:bg-[#0c1830]">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Fetching live national rankings...
            </p>
          </div>
        ) : !hasAnyData ? (
          /* Empty Season State */
          <div className="py-16 px-4 text-center rounded-3xl border border-dashed border-slate-300 dark:border-[#1e2f50] bg-white dark:bg-[#0c1830]">
            <Sparkles className="w-10 h-10 mx-auto text-amber-400 mb-3" />
            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              New Season Just Underway!
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-5">
              Be the first scholar on the {activeTab} leaderboard. Complete quizzes or duel other
              students to claim the #1 spot.
            </p>
            <button
              onClick={onJoinArenaClick}
              className="px-5 py-2 rounded-full text-xs font-bold bg-[#00a8e8] hover:bg-[#0096d1] text-slate-950 transition-all shadow-sm"
            >
              Take First Quiz
            </button>
          </div>
        ) : (
          /* 2-Column Leaderboard Showcase */
          <div className="grid lg:grid-cols-12 gap-6">
            {/* Left Column: Top 3 Podium */}
            <div className="lg:col-span-5 rounded-3xl border border-slate-200 dark:border-[#1e2f50] bg-white dark:bg-[#0c1830] p-6 flex flex-col justify-between shadow-sm">
              <h3 className="text-base font-bold text-slate-900 dark:text-white text-center mb-6">
                {isSchoolsTab ? "Top 3 Junior Secondary Schools" : `Top 3 ${activeTab} Contenders`}
              </h3>

              {/* Podium Graphics */}
              <div className="grid grid-cols-3 gap-2 items-end pt-4 pb-2">
                {/* Rank 2 (Silver) */}
                <div className="flex flex-col items-center">
                  <div className="relative mb-2">
                    {isSchoolsTab ? (
                      <div className="w-14 h-14 rounded-full bg-slate-200 dark:bg-[#1b2b48] border-2 border-slate-400 flex items-center justify-center text-2xl shadow-sm">
                        🏫
                      </div>
                    ) : (
                      <div className="ring-2 ring-slate-400 rounded-full">
                        <StudentAvatar
                          name={formatPublicStudentName(student2?.name || "Rank #2")}
                          avatarUrl={student2?.avatarUrl}
                          defaultFallbackImg={student2 ? undefined : pic2}
                          rank={2}
                          sizeClass="w-14 h-14"
                        />
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-300 text-slate-800 text-[10px] font-black flex items-center justify-center ring-2 ring-white dark:ring-[#0c1830]">
                      2
                    </div>
                  </div>
                  <p
                    className="text-xs font-bold text-slate-900 dark:text-white text-center truncate max-w-[90px]"
                    title={isSchoolsTab ? school2?.schoolName : student2?.name}
                  >
                    {isSchoolsTab
                      ? school2?.schoolName || "Contender"
                      : formatPublicStudentName(student2?.name || "Contender")}
                  </p>
                  <p className="text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold mb-2">
                    {isSchoolsTab
                      ? `${(school2?.totalEP || 0).toLocaleString()} EP`
                      : `${(student2?.points || 0).toLocaleString()} XP`}
                  </p>

                  {/* Podium Bar 2 */}
                  <div className="w-full h-24 rounded-t-xl bg-slate-100 dark:bg-[#122240] border-t-2 border-slate-300 flex items-center justify-center font-black text-slate-400">
                    2
                  </div>
                </div>

                {/* Rank 1 (Gold - Center) */}
                <div className="flex flex-col items-center">
                  <div className="relative mb-2">
                    <Crown size={20} className="text-amber-400 mb-1 mx-auto" />
                    {isSchoolsTab ? (
                      <div className="w-16 h-16 rounded-full bg-amber-500/20 border-4 border-amber-400 flex items-center justify-center text-3xl shadow-md">
                        🏫
                      </div>
                    ) : (
                      <div className="ring-4 ring-amber-400 rounded-full">
                        <StudentAvatar
                          name={formatPublicStudentName(student1?.name || "Rank #1")}
                          avatarUrl={student1?.avatarUrl}
                          defaultFallbackImg={student1 ? undefined : pic1}
                          rank={1}
                          sizeClass="w-16 h-16"
                        />
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black flex items-center justify-center ring-2 ring-white dark:ring-[#0c1830]">
                      1
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-500 mb-0.5">
                    Leader
                  </span>
                  <p
                    className="text-xs font-bold text-slate-900 dark:text-white text-center truncate max-w-[100px]"
                    title={isSchoolsTab ? school1?.schoolName : student1?.name}
                  >
                    {isSchoolsTab
                      ? school1?.schoolName || "Leader"
                      : formatPublicStudentName(student1?.name || "Leader")}
                  </p>
                  <p className="text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold mb-2">
                    {isSchoolsTab
                      ? `${(school1?.totalEP || 0).toLocaleString()} EP`
                      : `${(student1?.points || 0).toLocaleString()} XP`}
                  </p>

                  {/* Podium Bar 1 */}
                  <div className="w-full h-32 rounded-t-xl bg-cyan-50 dark:bg-[#16335a] border-t-2 border-amber-400 flex items-center justify-center font-black text-cyan-700 dark:text-cyan-300">
                    1
                  </div>
                </div>

                {/* Rank 3 (Bronze) */}
                <div className="flex flex-col items-center">
                  <div className="relative mb-2">
                    {isSchoolsTab ? (
                      <div className="w-14 h-14 rounded-full bg-amber-900/20 border-2 border-amber-700 flex items-center justify-center text-2xl shadow-sm">
                        🏫
                      </div>
                    ) : (
                      <div className="ring-2 ring-amber-700 rounded-full">
                        <StudentAvatar
                          name={formatPublicStudentName(student3?.name || "Rank #3")}
                          avatarUrl={student3?.avatarUrl}
                          defaultFallbackImg={student3 ? undefined : pic3}
                          rank={3}
                          sizeClass="w-14 h-14"
                        />
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-700 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white dark:ring-[#0c1830]">
                      3
                    </div>
                  </div>
                  <p
                    className="text-xs font-bold text-slate-900 dark:text-white text-center truncate max-w-[90px]"
                    title={isSchoolsTab ? school3?.schoolName : student3?.name}
                  >
                    {isSchoolsTab
                      ? school3?.schoolName || "Contender"
                      : formatPublicStudentName(student3?.name || "Contender")}
                  </p>
                  <p className="text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold mb-2">
                    {isSchoolsTab
                      ? `${(school3?.totalEP || 0).toLocaleString()} EP`
                      : `${(student3?.points || 0).toLocaleString()} XP`}
                  </p>

                  {/* Podium Bar 3 */}
                  <div className="w-full h-20 rounded-t-xl bg-emerald-50/60 dark:bg-[#0f2a24] border-t-2 border-emerald-500 flex items-center justify-center font-black text-emerald-600 dark:text-emerald-400">
                    3
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Live Season Rankings Table */}
            <div className="lg:col-span-7 rounded-3xl border border-slate-200 dark:border-[#1e2f50] bg-white dark:bg-[#0c1830] p-6 shadow-sm text-left">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-[#1a2b48]">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {isSchoolsTab ? "INTER-SCHOOL RANKINGS" : "LIVE SEASON RANKINGS"}
                </span>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {currentMonthName} Season • Real-time
                </span>
              </div>

              <div className="space-y-2">
                {isSchoolsTab ? (
                  tableSchools.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-8">
                      No additional schools ranked yet this season.
                    </p>
                  ) : (
                    tableSchools.map((s) => (
                      <div
                        key={s.schoolId}
                        className="p-3 rounded-xl border border-slate-100 dark:border-[#182642] bg-slate-50/70 dark:bg-[#071124] flex items-center justify-between hover:border-cyan-500/30 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-5 text-center text-xs font-black text-slate-400">
                            {s.rank}
                          </span>
                          <div className="w-8 h-8 rounded-full bg-[#1b2b48] flex items-center justify-center text-sm border border-[#2b3a54]">
                            🏫
                          </div>
                          <div className="truncate">
                            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">
                              {s.schoolName}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {s.activeStudentsCount} enrolled scholars
                            </p>
                          </div>
                        </div>

                        <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 shrink-0 ml-2">
                          {s.totalEP.toLocaleString()} EP
                        </span>
                      </div>
                    ))
                  )
                ) : tableStudents.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">
                    No additional contenders ranked yet this season.
                  </p>
                ) : (
                  tableStudents.map((c) => (
                    <div
                      key={c.studentId || c.rank}
                      className="p-3 rounded-xl border border-slate-100 dark:border-[#182642] bg-slate-50/70 dark:bg-[#071124] flex items-center justify-between hover:border-cyan-500/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-5 text-center text-xs font-black text-slate-400">
                          {c.rank}
                        </span>
                        <StudentAvatar
                          name={formatPublicStudentName(c.name)}
                          avatarUrl={c.avatarUrl}
                          rank={c.rank}
                          sizeClass="w-8 h-8"
                        />
                        <div className="truncate">
                          <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">
                            {formatPublicStudentName(c.name)}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {c.school}
                          </p>
                        </div>
                      </div>

                      <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 shrink-0 ml-2">
                        {c.points.toLocaleString()} XP
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1a2b48] text-center">
                <button
                  onClick={() => navigate("/leaderboard")}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-300 transition-colors"
                >
                  <span>View full national leaderboard</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

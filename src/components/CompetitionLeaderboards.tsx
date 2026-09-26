import { useState, useMemo } from "react";
import { Trophy, Calendar, Crown, Clock, Medal, Flame, Calculator, BookOpen, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

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

export interface CurrentUserRankInfo {
  weekly?: number;
  monthly?: number;
  annual?: number;
  math?: number;
  english?: number;
}

export interface CurrentUserPointInfo {
  weekly?: number;
  monthly?: number;
  annual?: number;
  math?: number;
  english?: number;
}

interface CompetitionLeaderboardsProps {
  showCurrentUserPosition?: boolean;
  currentUserName?: string;
  weeklyLeaders?: LeaderboardStudent[];
  monthlyLeaders?: LeaderboardStudent[];
  annualLeaders?: LeaderboardStudent[];
  mathLeaders?: LeaderboardStudent[];
  englishLeaders?: LeaderboardStudent[];
  currentUserRanks?: CurrentUserRankInfo;
  currentUserPoints?: CurrentUserPointInfo;
  limit?: number;
  defaultTab?: "weekly" | "monthly" | "annual" | "math" | "english";
}

const ITEMS_PER_PAGE = 10;

const getLeagueBadge = (tier: number = 1) => {
  switch (tier) {
    case 6:
      return { label: "Champions", icon: "👑", border: "border-purple-500/40 bg-purple-500/10 text-purple-300" };
    case 5:
      return { label: "Diamond", icon: "💎", border: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300" };
    case 4:
      return { label: "Platinum", icon: "🛡️", border: "border-teal-500/40 bg-teal-500/10 text-teal-300" };
    case 3:
      return { label: "Gold", icon: "🥇", border: "border-amber-500/40 bg-amber-500/10 text-amber-300" };
    case 2:
      return { label: "Silver", icon: "🥈", border: "border-slate-400/40 bg-slate-400/10 text-slate-300" };
    case 1:
    default:
      return { label: "Bronze", icon: "🥉", border: "border-amber-700/40 bg-amber-700/10 text-amber-400" };
  }
};

const getWeeklyCountdown = (): string => {
  const now = new Date();
  const day = now.getUTCDay();
  const daysUntilSunday = (7 - day) % 7;
  const target = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + daysUntilSunday,
    23, 59, 59
  ));
  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) return "Resetting...";
  const d = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const h = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const m = Math.floor((diffMs / (1000 * 60)) % 60);
  return `${d}d ${h}h ${m}m`;
};

const getMonthlyCountdown = (): string => {
  const now = new Date();
  const target = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59));
  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) return "Resetting...";
  const d = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const h = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const m = Math.floor((diffMs / (1000 * 60)) % 60);
  return `${d}d ${h}h ${m}m`;
};

export const CompetitionLeaderboards = ({
  showCurrentUserPosition = false,
  currentUserName = "Scholar",
  weeklyLeaders = [],
  monthlyLeaders = [],
  annualLeaders = [],
  mathLeaders = [],
  englishLeaders = [],
  currentUserRanks = { weekly: 0, monthly: 0, annual: 0, math: 0, english: 0 },
  currentUserPoints = { weekly: 0, monthly: 0, annual: 0, math: 0, english: 0 },
  limit,
  defaultTab = "weekly",
}: CompetitionLeaderboardsProps) => {
  const [weeklyPage, setWeeklyPage] = useState(1);
  const [monthlyPage, setMonthlyPage] = useState(1);
  const [annualPage, setAnnualPage] = useState(1);
  const [mathPage, setMathPage] = useState(1);
  const [englishPage, setEnglishPage] = useState(1);

  const weeklyCountdown = useMemo(() => getWeeklyCountdown(), []);
  const monthlyCountdown = useMemo(() => getMonthlyCountdown(), []);

  const renderLeaderboard = (
    leaders: LeaderboardStudent[],
    icon: React.ReactNode,
    tagTitle: string,
    prizeOrSubtitle: string,
    timerLabel: string,
    timerValue: string,
    currentRank: number = 0,
    currentPoints: number = 0,
    currentPage: number,
    onPageChange: (page: number) => void
  ) => {
    const displayList = limit ? leaders.slice(0, limit) : leaders;
    const isPaginated = !limit && leaders.length > ITEMS_PER_PAGE;

    const totalPages = Math.max(1, Math.ceil(leaders.length / ITEMS_PER_PAGE));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedLeaders = isPaginated ? leaders.slice(startIndex, endIndex) : displayList;

    const isUserInVisibleList = paginatedLeaders.some((s) => s.isCurrentUser);
    const showUserPositionCard = showCurrentUserPosition && !isUserInVisibleList && currentRank > 0;

    const podium = leaders.filter((student) => student.rank <= 3).sort((a, b) => a.rank - b.rank);
    const tableLeaders = paginatedLeaders.filter((student) => student.rank > 3);

    const userRow = showUserPositionCard
      ? {
          rank: currentRank,
          name: `${currentUserName} (You)`,
          school: "Active Scholar",
          points: currentPoints,
          avatar: "👤",
          isCurrentUser: true,
          level: 1,
          leagueTier: 1,
        }
      : leaders.find((student) => student.isCurrentUser);

    return (
      <div className="space-y-5 animate-fade-in">
        {/* Banner with competition metadata & timer */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 rounded-lg border border-[#2b3a54] bg-[#111d32] px-4 py-3">
            <span className="rounded-md bg-[#183149] p-2 text-[#71c9ed]">{icon}</span>
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400 font-bold">{tagTitle}</p>
              <p className="text-sm font-semibold text-slate-100">{prizeOrSubtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-[#2b3a54] bg-[#111d32] px-4 py-3 text-xs text-slate-300">
            <Clock size={15} className="text-sky-400" />
            <span>{timerLabel}</span>
            <strong className="text-white font-mono">{timerValue}</strong>
          </div>
        </div>

        {leaders.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#2b3a54] bg-[#0e192b] py-16 text-center text-sm text-slate-400">
            <p className="font-semibold text-slate-300">No students ranked in this category yet.</p>
            <p className="mt-1 text-xs text-slate-500">Take a practice quiz or challenge today to earn Éclat Points and claim the top spot!</p>
          </div>
        ) : (
          <>
            {/* Top 3 Podium (Only visible on page 1) */}
            {safeCurrentPage === 1 && podium.length > 0 && (
              <div className="grid min-h-[240px] grid-cols-3 items-end gap-2 rounded-xl border border-[#2b3a54] bg-[#0e192b] px-3 pb-5 pt-8 sm:gap-6 sm:px-12 shadow-inner">
                {[2, 1, 3].map((rank) => {
                  const student = podium.find((item) => item.rank === rank);
                  if (!student) return <div key={rank} />;
                  const winner = rank === 1;
                  const isSecond = rank === 2;
                  const league = getLeagueBadge(student.leagueTier);

                  return (
                    <div
                      key={student.rank}
                      className={`relative flex flex-col items-center justify-end rounded-t-xl border px-2 pb-4 pt-5 transition-all ${
                        winner
                          ? "h-52 sm:h-56 border-amber-400/80 bg-gradient-to-b from-[#25324c] to-[#141e33] shadow-lg shadow-amber-500/15"
                          : isSecond
                          ? "h-44 sm:h-48 border-slate-400/60 bg-[#162238]"
                          : "h-40 sm:h-44 border-amber-700/50 bg-[#141e33]"
                      }`}
                    >
                      {/* Rank Crown/Medal */}
                      <span
                        className={`absolute -top-3.5 flex h-7 w-7 items-center justify-center rounded-full text-xs font-black shadow-md ${
                          winner
                            ? "bg-amber-400 text-slate-950 ring-4 ring-amber-400/30"
                            : isSecond
                            ? "border border-slate-300 bg-slate-300 text-slate-950"
                            : "border border-amber-700 bg-amber-700 text-white"
                        }`}
                      >
                        {rank}
                      </span>

                      {/* Avatar */}
                      <span className="mb-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#091426] text-xl shadow-inner border border-white/10">
                        {student.avatar}
                      </span>

                      {/* Name */}
                      <p
                        className="w-full truncate px-1 text-center text-xs font-bold text-white leading-normal"
                        title={student.name}
                      >
                        {student.name}
                        {student.isCurrentUser ? " (You)" : ""}
                      </p>

                      {/* Level & League badges */}
                      <div className="flex items-center gap-1 mt-1">
                        <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[9px] font-bold text-sky-300 border border-sky-500/30">
                          Lvl {student.level || 1}
                        </span>
                        <span className={`rounded px-1 py-0.5 text-[9px] font-medium border ${league.border}`}>
                          {league.icon}
                        </span>
                      </div>

                      {/* Points */}
                      <p
                        className={`mt-1.5 text-xs font-extrabold leading-tight ${
                          winner ? "text-amber-300" : "text-slate-300"
                        }`}
                      >
                        {student.points.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">EP</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Table of Leaders (Ranks 4+) */}
            {tableLeaders.length > 0 && (
              <div className="overflow-hidden rounded-xl border border-[#1d2a40] bg-[#0e192b]">
                <div className="grid grid-cols-[52px_1fr_1fr_80px] sm:grid-cols-[60px_1fr_1fr_100px] border-b border-[#2b3a54] px-4 py-3 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  <span>Rank</span>
                  <span>Student</span>
                  <span>School</span>
                  <span className="text-right">Éclat Points</span>
                </div>

                {tableLeaders.map((student) => {
                  const league = getLeagueBadge(student.leagueTier);
                  const isCurrent = student.isCurrentUser;

                  return (
                    <div
                      key={`${student.rank}-${student.name}`}
                      className={`grid grid-cols-[52px_1fr_1fr_80px] sm:grid-cols-[60px_1fr_1fr_100px] items-center border-b border-[#17243a] px-4 py-3 text-xs transition ${
                        isCurrent
                          ? "bg-sky-500/10 border-l-4 border-l-sky-400 text-sky-100"
                          : "hover:bg-[#13223a] text-slate-300"
                      }`}
                    >
                      <span className="font-bold text-slate-400">#{student.rank}</span>
                      <span className="flex min-w-0 items-center gap-2 font-medium text-slate-100">
                        <span className="text-base shrink-0">{student.avatar}</span>
                        <span className="truncate">{student.name}</span>
                        <span className="rounded bg-sky-500/15 px-1 py-0.2 text-[9px] font-bold text-sky-300 border border-sky-500/20 shrink-0">
                          Lvl {student.level || 1}
                        </span>
                        <span className={`hidden sm:inline-flex rounded px-1 py-0.2 text-[9px] font-medium border ${league.border} shrink-0`}>
                          {league.icon}
                        </span>
                      </span>
                      <span className="truncate text-slate-400 text-[11px]">{student.school}</span>
                      <strong className="text-right text-slate-100 font-mono">
                        {student.points.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">EP</span>
                      </strong>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Sticky Current User Row if Not in Current Page */}
            {userRow && showUserPositionCard && (
              <div className="grid grid-cols-[52px_1fr_1fr_80px] sm:grid-cols-[60px_1fr_1fr_100px] items-center rounded-xl border-2 border-sky-500/70 bg-gradient-to-r from-sky-950/60 via-[#13223a] to-sky-950/40 px-4 py-3.5 text-xs shadow-lg shadow-sky-500/10">
                <span className="font-extrabold text-sky-400">#{userRow.rank}</span>
                <span className="flex min-w-0 items-center gap-2 font-bold text-white">
                  <span className="text-base">{userRow.avatar}</span>
                  <span className="truncate">{userRow.name}</span>
                  <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[9px] font-bold text-sky-300 border border-sky-500/30">
                    Lvl {userRow.level || 1}
                  </span>
                </span>
                <span className="truncate text-slate-300 text-[11px]">{userRow.school}</span>
                <strong className="text-right text-sky-300 font-mono font-black">
                  {userRow.points.toLocaleString()} <span className="text-[10px] font-normal text-sky-400/80">EP</span>
                </strong>
              </div>
            )}

            {/* Pagination Controls */}
            {isPaginated && totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-[#2b3a54] pt-3 text-xs text-slate-400">
                <span>
                  Showing {startIndex + 1}–{Math.min(endIndex, leaders.length)} of {leaders.length} scholars
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={safeCurrentPage <= 1}
                    onClick={() => onPageChange(safeCurrentPage - 1)}
                    className="h-8 border-[#2b3a54] bg-[#111d32] text-xs hover:bg-[#182a48]"
                  >
                    <ChevronLeft size={14} className="mr-1" /> Prev
                  </Button>
                  <span className="font-semibold text-slate-200">
                    {safeCurrentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={safeCurrentPage >= totalPages}
                    onClick={() => onPageChange(safeCurrentPage + 1)}
                    className="h-8 border-[#2b3a54] bg-[#111d32] text-xs hover:bg-[#182a48]"
                  >
                    Next <ChevronRight size={14} className="ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* Footer Encouragement */}
            <div className="flex items-center gap-2 border-t border-[#2b3a54]/60 pt-3 text-xs text-slate-400">
              <Medal size={15} className="text-amber-400 shrink-0" />
              <span>
                Quizzes, streak maintenance, and mastery milestones all award real Éclat Points! Keep striving for academic excellence!
              </span>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <Card className="overflow-hidden rounded-xl border border-[#2b3a54] bg-transparent shadow-none">
      <CardContent className="pt-6">
        <Tabs defaultValue={defaultTab} className="w-full flex flex-col">
          {/* Scrollable / Responsive Tab Header */}
          <div className="overflow-x-auto pb-2 mb-6">
            <TabsList className="mx-0 flex w-max gap-1.5 rounded-lg border border-[#2b3a54] bg-[#111d32] p-1.5">
              <TabsTrigger
                value="weekly"
                className="gap-2 rounded-md px-5 py-2 text-xs sm:text-sm font-semibold text-slate-400 transition-all duration-200
                  data-[state=active]:bg-[#243553] data-[state=active]:text-amber-300 data-[state=active]:shadow-md hover:text-white"
              >
                <Flame size={15} className="text-amber-400" />
                Weekly Sprint
                <span className="ml-1 rounded-full bg-amber-400/20 px-1.5 py-0.2 text-[10px] font-bold text-amber-300">
                  Live
                </span>
              </TabsTrigger>

              <TabsTrigger
                value="monthly"
                className="gap-2 rounded-md px-5 py-2 text-xs sm:text-sm font-semibold text-slate-400 transition-all duration-200
                  data-[state=active]:bg-[#243553] data-[state=active]:text-sky-300 data-[state=active]:shadow-md hover:text-white"
              >
                <Calendar size={15} className="text-sky-400" />
                Monthly Championship
              </TabsTrigger>

              <TabsTrigger
                value="annual"
                className="gap-2 rounded-md px-5 py-2 text-xs sm:text-sm font-semibold text-slate-400 transition-all duration-200
                  data-[state=active]:bg-[#243553] data-[state=active]:text-yellow-300 data-[state=active]:shadow-md hover:text-white"
              >
                <Crown size={15} className="text-yellow-400" />
                All-Time Hall of Fame
              </TabsTrigger>

              <TabsTrigger
                value="math"
                className="gap-2 rounded-md px-5 py-2 text-xs sm:text-sm font-semibold text-slate-400 transition-all duration-200
                  data-[state=active]:bg-[#243553] data-[state=active]:text-emerald-300 data-[state=active]:shadow-md hover:text-white"
              >
                <Calculator size={15} className="text-emerald-400" />
                Maths Specialists
              </TabsTrigger>

              <TabsTrigger
                value="english"
                className="gap-2 rounded-md px-5 py-2 text-xs sm:text-sm font-semibold text-slate-400 transition-all duration-200
                  data-[state=active]:bg-[#243553] data-[state=active]:text-purple-300 data-[state=active]:shadow-md hover:text-white"
              >
                <BookOpen size={15} className="text-purple-400" />
                English Scholars
              </TabsTrigger>
            </TabsList>
          </div>

          {/* 1. Weekly Tab Content */}
          <TabsContent value="weekly" className="mt-0">
            {renderLeaderboard(
              weeklyLeaders,
              <Flame className="text-amber-400" size={20} />,
              "Weekly Sprint",
              "Top scholars this week • Climb the ranks & claim leaderboard glory!",
              "Resets in",
              weeklyCountdown,
              currentUserRanks.weekly,
              currentUserPoints.weekly,
              weeklyPage,
              setWeeklyPage
            )}
          </TabsContent>

          {/* 2. Monthly Tab Content */}
          <TabsContent value="monthly" className="mt-0">
            {renderLeaderboard(
              monthlyLeaders,
              <Trophy className="text-sky-400" size={20} />,
              "Monthly Championship",
              "₦50,000 Cash Prize Pool for Top Performers",
              "Ends in",
              monthlyCountdown,
              currentUserRanks.monthly,
              currentUserPoints.monthly,
              monthlyPage,
              setMonthlyPage
            )}
          </TabsContent>

          {/* 3. All-Time Tab Content */}
          <TabsContent value="annual" className="mt-0">
            {renderLeaderboard(
              annualLeaders,
              <Crown className="text-yellow-400" size={20} />,
              "Hall of Fame",
              "₦1,500,000 Grand Championship & Legendary Scholars",
              "Standings",
              "Continuous All-Time",
              currentUserRanks.annual,
              currentUserPoints.annual,
              annualPage,
              setAnnualPage
            )}
          </TabsContent>

          {/* 4. Mathematics Specialist Content */}
          <TabsContent value="math" className="mt-0">
            {renderLeaderboard(
              mathLeaders,
              <Calculator className="text-emerald-400" size={20} />,
              "Subject Specialists",
              "Top Mathematics Problem Solvers in Nigeria",
              "Discipline",
              "BECE & NCEE Maths",
              currentUserRanks.math,
              currentUserPoints.math,
              mathPage,
              setMathPage
            )}
          </TabsContent>

          {/* 5. English Scholars Content */}
          <TabsContent value="english" className="mt-0">
            {renderLeaderboard(
              englishLeaders,
              <BookOpen className="text-purple-400" size={20} />,
              "Subject Specialists",
              "Top English Vocabulary & Comprehension Scholars",
              "Discipline",
              "BECE & NCEE English",
              currentUserRanks.english,
              currentUserPoints.english,
              englishPage,
              setEnglishPage
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

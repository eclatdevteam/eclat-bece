import { useState, useMemo, type ReactNode } from "react";
import { Trophy, Calendar, Crown, Clock, Medal, Flame, Calculator, BookOpen, ChevronLeft, ChevronRight, Sparkles, School, Building2, Award, Gift } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SchoolLeaderboardItem } from "@/utils/leaderboard";

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
  schoolLeaders?: SchoolLeaderboardItem[];
  currentUserRanks?: CurrentUserRankInfo;
  currentUserPoints?: CurrentUserPointInfo;
  limit?: number;
  defaultTab?: "weekly" | "monthly" | "annual" | "math" | "english" | "schools";
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
  schoolLeaders = [],
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
  const [schoolsPage, setSchoolsPage] = useState(1);

  const weeklyCountdown = useMemo(() => getWeeklyCountdown(), []);
  const monthlyCountdown = useMemo(() => getMonthlyCountdown(), []);

  const renderLeaderboard = (
    leaders: LeaderboardStudent[],
    icon: ReactNode,
    tagTitle: string,
    prizeOrSubtitle: string,
    timerLabel: string,
    timerValue: string,
    currentRank: number = 0,
    currentPoints: number = 0,
    currentPage: number = 1,
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
          <div className="border border-dashed border-[#2b3a54] bg-[#0e192b] py-12 text-center text-sm text-slate-400">
            No students ranked yet. Be the first to quiz!
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            {safeCurrentPage === 1 && podium.length > 0 && (
              <div className="grid min-h-[230px] grid-cols-3 items-end gap-2 rounded-lg border border-[#2b3a54] bg-[#0e192b] px-3 pb-5 pt-8 sm:gap-6 sm:px-12">
                {[2, 1, 3].map((rank) => {
                  const student = podium.find((item) => item.rank === rank);
                  if (!student) return <div key={rank} />;
                  const winner = rank === 1;
                  const isSecond = rank === 2;
                  return (
                    <div
                      key={student.rank}
                      className={`relative flex flex-col items-center justify-end rounded-t-lg border px-2 pb-3.5 pt-5 transition-all ${winner
                        ? 'h-48 sm:h-52 border-[#f4d21f] bg-[#202b40] shadow-lg shadow-amber-500/10'
                        : isSecond
                          ? 'h-40 sm:h-44 border-[#43506a] bg-[#182338]'
                          : 'h-[136px] sm:h-[150px] border-[#43506a] bg-[#182338]'
                        }`}
                    >
                      <span className={`absolute -top-3.5 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shadow-sm ${winner ? 'bg-[#f4d21f] text-[#071023] ring-2 ring-[#f4d21f]/30' : 'border border-slate-300 bg-[#273349] text-white'
                        }`}>
                        {rank}
                      </span>
                      <span className="mb-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#091426] text-xl shadow-inner">
                        {student.avatar}
                      </span>
                      <p className="w-full truncate px-1 text-center text-xs font-semibold text-white leading-normal" title={student.name}>
                        {student.name}{student.isCurrentUser ? ' (You)' : ''}
                      </p>
                      <p className={`mt-0.5 text-[11px] font-bold leading-tight ${winner ? 'text-[#f4d21f]' : 'text-slate-400'}`}>
                        {student.points.toLocaleString()} pts
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Students Table */}
            <div className="overflow-hidden rounded-lg border border-[#1d2a40] bg-[#0e192b]">
              <div className="grid grid-cols-[52px_1fr_1fr_72px] border-b border-[#2b3a54] px-4 py-3 text-[9px] uppercase tracking-wider text-slate-500 sm:grid-cols-[60px_1fr_1fr_90px]">
                <span>Rank</span>
                <span>Student</span>
                <span>School</span>
                <span className="text-right">Points</span>
              </div>
              {tableLeaders.map((student) => (
                <div
                  key={`${student.rank}-${student.name}`}
                  className={`grid grid-cols-[52px_1fr_1fr_72px] items-center border-b border-[#17243a] px-4 py-3 text-xs transition hover:bg-[#13223a] sm:grid-cols-[60px_1fr_1fr_90px] ${student.isCurrentUser ? 'bg-[#1a2d4b] border-[#36527e]' : ''}`}
                >
                  <span className="text-slate-400">{student.rank}</span>
                  <span className="flex min-w-0 items-center gap-2 font-medium text-slate-100">
                    <span className="text-base">{student.avatar}</span>
                    <span className="truncate">{student.name}</span>
                  </span>
                  <span className="truncate text-slate-400">{student.school}</span>
                  <strong className="text-right text-slate-100">{student.points.toLocaleString()}</strong>
                </div>
              ))}
            </div>

            {/* User Position Card */}
            {showUserPositionCard && userRow && (
              <div className="rounded-lg border border-amber-400/30 bg-[#162744] p-3 text-xs text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-amber-300">#{userRow.rank}</span>
                  <span className="font-semibold">{userRow.name}</span>
                  <span className="text-slate-400">• {userRow.school}</span>
                </div>
                <strong className="text-amber-300">{userRow.points.toLocaleString()} pts</strong>
              </div>
            )}

            {/* Pagination Controls */}
            {isPaginated && (
              <div className="flex items-center justify-between border-t border-[#2b3a54]/60 pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safeCurrentPage <= 1}
                  onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
                  className="h-8 gap-1 border-[#2b3a54] bg-[#111d32] text-xs text-slate-300 hover:bg-[#192b47]"
                >
                  <ChevronLeft size={14} /> Previous
                </Button>
                <span className="text-xs text-slate-400">
                  Page {safeCurrentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safeCurrentPage >= totalPages}
                  onClick={() => onPageChange(Math.min(totalPages, safeCurrentPage + 1))}
                  className="h-8 gap-1 border-[#2b3a54] bg-[#111d32] text-xs text-slate-300 hover:bg-[#192b47]"
                >
                  Next <ChevronRight size={14} />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const renderSchoolLeaderboard = (
    schools: SchoolLeaderboardItem[],
    currentPage: number = 1,
    onPageChange: (page: number) => void
  ) => {
    const displaySchools = limit ? schools.slice(0, limit) : schools;
    const isPaginated = !limit && schools.length > ITEMS_PER_PAGE;

    const totalPages = Math.max(1, Math.ceil(schools.length / ITEMS_PER_PAGE));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedSchools = isPaginated ? schools.slice(startIndex, endIndex) : displaySchools;

    const podium = schools.filter((s) => s.rank <= 3).sort((a, b) => a.rank - b.rank);

    return (
      <div className="space-y-5 animate-fade-in">
        {/* Banner with competition metadata & timer */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 rounded-lg border border-[#2b3a54] bg-[#111d32] px-4 py-3">
            <span className="rounded-md bg-[#183149] p-2 text-amber-400">
              <Building2 size={20} />
            </span>
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400 font-bold">Inter-School League</p>
              <p className="text-sm font-semibold text-slate-100">Top Junior Secondary Schools by Aggregate Scholar EP</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-[#2b3a54] bg-[#111d32] px-4 py-3 text-xs text-slate-300">
            <Trophy size={15} className="text-amber-400" />
            <span>Active Season</span>
            <strong className="text-white font-mono">2026 Academic Year</strong>
          </div>
        </div>

        {schools.length === 0 ? (
          <div className="border border-dashed border-[#2b3a54] bg-[#0e192b] py-12 text-center text-sm text-slate-400">
            No schools ranked yet. Join a school to compete!
          </div>
        ) : (
          <>
            {/* Top 3 Schools Podium */}
            {safeCurrentPage === 1 && podium.length > 0 && (
              <div className="grid min-h-[220px] grid-cols-3 items-end gap-2 rounded-xl border border-[#2b3a54] bg-[#0e192b] px-3 pb-5 pt-8 sm:gap-6 sm:px-12 shadow-inner">
                {[2, 1, 3].map((rank) => {
                  const sch = podium.find((item) => item.rank === rank);
                  if (!sch) return <div key={rank} />;
                  const winner = rank === 1;

                  return (
                    <div
                      key={sch.rank}
                      className={`relative flex flex-col items-center justify-end rounded-t-xl border px-2 pb-4 pt-5 transition-all ${winner
                          ? "h-[200px] border-amber-400/50 bg-gradient-to-t from-[#1b2b48] to-[#12233f] shadow-lg"
                          : rank === 2
                            ? "h-[165px] border-slate-400/30 bg-[#121f37]"
                            : "h-[145px] border-amber-700/30 bg-[#121f37]"
                        }`}
                    >
                      <div className="absolute -top-4 rounded-full border border-[#2b3a54] bg-[#0e192b] px-3 py-0.5 text-xs font-black shadow-md flex items-center gap-1">
                        {winner ? "🥇 #1" : rank === 2 ? "🥈 #2" : "🥉 #3"}
                      </div>
                      <span className="text-3xl mb-1">🏫</span>
                      <p className="w-full truncate text-center text-xs font-bold text-white mt-1 px-1">
                        {sch.schoolName}
                      </p>
                      <p className="text-[10px] text-slate-400">{sch.activeStudentsCount} scholars</p>
                      <p className="text-sm font-black text-amber-400 mt-1">
                        {sch.totalEP.toLocaleString()} <span className="text-[9px] uppercase font-bold text-slate-400">EP</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* School Rankings Table */}
            <div className="overflow-hidden rounded-xl border border-[#2b3a54] bg-[#0e192b]">
              <div className="divide-y divide-[#20314c]">
                {paginatedSchools.map((sch) => (
                  <div
                    key={sch.schoolId}
                    className="flex items-center justify-between px-4 py-3.5 hover:bg-[#14233c] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-7 text-center font-mono text-sm font-bold text-slate-400">
                        #{sch.rank}
                      </span>
                      <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#1b2d49] text-lg border border-[#2c436b]">
                        🏫
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-white truncate">{sch.schoolName}</p>
                        <p className="text-xs text-slate-400">
                          {sch.activeStudentsCount} enrolled {sch.activeStudentsCount === 1 ? 'scholar' : 'scholars'} • avg {sch.avgEPPerStudent.toLocaleString()} EP/scholar
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-base font-black text-amber-400 leading-tight">
                        {sch.totalEP.toLocaleString()}{" "}
                        <span className="text-[10px] uppercase font-bold text-slate-400">EP</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination Controls */}
            {isPaginated && (
              <div className="flex items-center justify-between border-t border-[#2b3a54]/60 pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safeCurrentPage <= 1}
                  onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
                  className="h-8 gap-1 border-[#2b3a54] bg-[#111d32] text-xs text-slate-300 hover:bg-[#192b47]"
                >
                  <ChevronLeft size={14} /> Previous
                </Button>
                <span className="text-xs text-slate-400">
                  Page {safeCurrentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safeCurrentPage >= totalPages}
                  onClick={() => onPageChange(Math.min(totalPages, safeCurrentPage + 1))}
                  className="h-8 gap-1 border-[#2b3a54] bg-[#111d32] text-xs text-slate-300 hover:bg-[#192b47]"
                >
                  Next <ChevronRight size={14} />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <Card className="overflow-hidden rounded-xl border border-[#2b3a54] bg-transparent shadow-none">
          <CardContent className="pt-6">
            {/* Sponsored Challenge Foundation Banner (PRD §11.3 Feature 5) */}
            <div className="mb-6 p-4 rounded-2xl border-2 border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-[#111d32] to-primary/10 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Trophy className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-black text-sm text-white">
                      2026 National Championship &amp; Academic Prize Challenge
                    </h4>
                    <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-black uppercase">
                      Annual Championship
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    ₦1,500,000 Grand Academic Prize Pool
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 bg-[#162642] px-3 py-1.5 rounded-xl border border-amber-500/30 flex-shrink-0">
                <Gift className="h-4 w-4" />
                <span>Verified Scholarship Grants</span>
              </div>
            </div>

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
                    value="schools"
                    className="gap-2 rounded-md px-5 py-2 text-xs sm:text-sm font-semibold text-slate-400 transition-all duration-200
                  data-[state=active]:bg-[#243553] data-[state=active]:text-orange-300 data-[state=active]:shadow-md hover:text-white"
                  >
                    <School size={15} className="text-orange-400" />
                    Inter-School League
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

              {/* 4. Inter-School League Tab Content */}
              <TabsContent value="schools" className="mt-0">
                {renderSchoolLeaderboard(
                  schoolLeaders,
                  schoolsPage,
                  setSchoolsPage
                )}
              </TabsContent>

              {/* 5. Mathematics Specialist Content */}
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

              {/* 6. English Scholars Content */}
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

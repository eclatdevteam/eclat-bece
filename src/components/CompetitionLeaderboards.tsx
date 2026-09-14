import { Trophy, Calendar, Crown, Clock, Medal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

export interface LeaderboardStudent {
  rank: number;
  name: string;
  school: string;
  points: number;
  avatar: string;
  isCurrentUser?: boolean;
  schoolId?: string | null;
}

interface CompetitionLeaderboardsProps {
  showCurrentUserPosition?: boolean;
  currentUserName?: string;
  monthlyLeaders?: LeaderboardStudent[];
  annualLeaders?: LeaderboardStudent[];
  currentUserRanks?: {
    monthly: number;
    annual: number;
  };
  currentUserPoints?: {
    monthly: number;
    annual: number;
  };
  limit?: number;
}

const ITEMS_PER_PAGE = 10;

export const CompetitionLeaderboards = ({
  showCurrentUserPosition = false,
  currentUserName = "Alex",
  monthlyLeaders = [],
  annualLeaders = [],
  currentUserRanks = { monthly: 12, annual: 8 },
  currentUserPoints = { monthly: 0, annual: 0 },
  limit,
}: CompetitionLeaderboardsProps) => {
  const [monthlyPage, setMonthlyPage] = useState(1);
  const [annualPage, setAnnualPage] = useState(1);

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          icon: "🥇",
          label: "1st Place",
          border: "border-amber-400/60 bg-gradient-to-r from-amber-500/10 via-card to-card shadow-amber-500/5",
          badgeBg: "bg-amber-500 text-slate-950 font-black",
          medalColor: "text-amber-500",
        };
      case 2:
        return {
          icon: "🥈",
          label: "2nd Place",
          border: "border-slate-300/60 dark:border-slate-600/60 bg-card",
          badgeBg: "bg-slate-300 dark:bg-slate-600 text-foreground font-black",
          medalColor: "text-slate-400",
        };
      case 3:
        return {
          icon: "🥉",
          label: "3rd Place",
          border: "border-amber-700/50 bg-card",
          badgeBg: "bg-amber-700 text-white font-black",
          medalColor: "text-amber-700",
        };
      default:
        return {
          icon: null,
          label: `#${rank}`,
          border: "border-border/60 bg-card",
          badgeBg: "bg-muted text-foreground font-bold",
          medalColor: "text-muted-foreground",
        };
    }
  };

  const renderLeaderboard = (
    leaders: LeaderboardStudent[], 
    icon: React.ReactNode, 
    prizeInfo: string,
    currentRank: number,
    currentPoints: number,
    currentPage: number,
    onPageChange: (page: number) => void
  ) => {
    // If limit is provided (e.g. 5 for top 5), slice directly without pagination
    const displayList = limit ? leaders.slice(0, limit) : leaders;
    const isPaginated = !limit && leaders.length > ITEMS_PER_PAGE;

    const totalPages = Math.max(1, Math.ceil(leaders.length / ITEMS_PER_PAGE));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedLeaders = isPaginated ? leaders.slice(startIndex, endIndex) : displayList;

    const isUserInList = paginatedLeaders.some(s => s.isCurrentUser);
    const showUserPositionCard = showCurrentUserPosition && !isUserInList && currentRank > 0;

    const podium = leaders.filter((student) => student.rank <= 3).sort((a, b) => a.rank - b.rank);
    const tableLeaders = leaders.filter((student) => student.rank > 3);
    const userRow = showUserPositionCard
      ? { rank: currentRank, name: `${currentUserName} (You)`, school: "Private Study", points: currentPoints, avatar: "👤", isCurrentUser: true }
      : leaders.find((student) => student.isCurrentUser);

    return (
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 rounded-md border border-[#2b3a54] bg-[#111d32] px-4 py-3">
            <span className="rounded-md bg-[#183149] p-2 text-[#71c9ed]">{icon}</span>
            <div><p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Monthly prize</p><p className="text-sm font-semibold text-slate-100">{prizeInfo.replace("Win ", "").replace("!", "")}</p></div>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-[#2b3a54] bg-[#111d32] px-4 py-3 text-xs text-slate-300"><Clock size={15} className="text-slate-400" /><span>Ends in</span><strong>12d 05h 23m</strong></div>
        </div>

        {leaders.length === 0 ? <div className="border border-dashed border-[#2b3a54] bg-[#0e192b] py-12 text-center text-sm text-slate-400">No students ranked yet. Be the first to quiz!</div> : <>
          <div className="grid min-h-[205px] grid-cols-3 items-end gap-2 rounded-lg border border-[#2b3a54] bg-[#0e192b] px-3 pb-5 pt-8 sm:gap-6 sm:px-12">
            {[2, 1, 3].map((rank) => {
              const student = podium.find((item) => item.rank === rank);
              if (!student) return <div key={rank} />;
              const winner = rank === 1;
              return <div key={student.rank} className={`relative flex flex-col items-center justify-end rounded-t-lg border px-2 pb-4 pt-7 ${winner ? 'h-40 border-[#f4d21f] bg-[#202b40]' : 'h-28 border-[#43506a] bg-[#182338]'}`}><span className={`absolute -top-3 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${winner ? 'bg-[#f4d21f] text-[#071023]' : 'border border-slate-300 bg-[#273349] text-white'}`}>{rank}</span><span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#091426] text-xl">{student.avatar}</span><p className="max-w-full truncate text-center text-xs font-semibold text-white">{student.name}{student.isCurrentUser ? ' (You)' : ''}</p><p className={`mt-1 text-[10px] font-bold ${winner ? 'text-[#f4d21f]' : 'text-slate-400'}`}>{student.points.toLocaleString()} pts</p></div>;
            })}
          </div>
          <div className="overflow-hidden rounded-lg border border-[#1d2a40] bg-[#0e192b]">
            <div className="grid grid-cols-[52px_1fr_1fr_72px] border-b border-[#2b3a54] px-4 py-3 text-[9px] uppercase tracking-wider text-slate-500 sm:grid-cols-[60px_1fr_1fr_90px]"><span>Rank</span><span>Student</span><span>School</span><span className="text-right">Points</span></div>
            {tableLeaders.map((student) => <div key={`${student.rank}-${student.name}`} className="grid grid-cols-[52px_1fr_1fr_72px] items-center border-b border-[#17243a] px-4 py-3 text-xs transition hover:bg-[#13223a] sm:grid-cols-[60px_1fr_1fr_90px]"><span className="text-slate-400">{student.rank}</span><span className="flex min-w-0 items-center gap-2 font-medium text-slate-100"><span className="text-base">{student.avatar}</span><span className="truncate">{student.name}</span></span><span className="truncate text-slate-400">{student.school}</span><strong className="text-right text-slate-100">{student.points.toLocaleString()}</strong></div>)}
          </div>
          {userRow && !leaders.some((student) => student.isCurrentUser) && <div className="grid grid-cols-[52px_1fr_1fr_72px] items-center rounded-md border border-[#0c9dcc] bg-[#1d2b42] px-4 py-3 text-xs sm:grid-cols-[60px_1fr_1fr_90px]"><span className="text-slate-300">{userRow.rank}</span><span className="flex items-center gap-2 font-semibold text-white"><span>{userRow.avatar}</span>{userRow.name}</span><span className="text-slate-400">{userRow.school}</span><strong className="text-right text-[#0c9dcc]">{userRow.points.toLocaleString()}</strong></div>}
          <div className="flex items-center gap-2 border-t border-[#2b3a54] pt-3 text-xs text-slate-400"><Medal size={15} className="text-[#f4d21f]" />Keep it up! You&apos;re doing amazing!</div>
        </>}
      </div>
    );
  };

  return (
    <Card className="overflow-hidden rounded-lg border border-[#2b3a54] bg-transparent shadow-none">
      <CardContent className="pt-6">
        <Tabs defaultValue="monthly" className="w-full flex flex-col">
          <TabsList className="mx-0 mb-6 flex w-fit gap-1 rounded-md border border-[#2b3a54] bg-[#111d32] p-1">
            <TabsTrigger 
              value="monthly" 
              className="gap-2 rounded px-8 py-2 text-sm text-slate-400 transition-all duration-300
                data-[state=active]:!bg-gradient-to-r data-[state=active]:!from-primary data-[state=active]:!to-primary-glow data-[state=active]:!text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20
                data-[state=active]:!bg-[#3a465d] data-[state=active]:!text-white hover:text-white focus-visible:!ring-0 focus-visible:!ring-offset-0 focus:!outline-none"
            >
              <Calendar size={16} />
              Monthly Top 5
            </TabsTrigger>
            <TabsTrigger 
              value="annual" 
              className="gap-2 rounded px-8 py-2 text-sm text-slate-400 transition-all duration-300
                data-[state=active]:!bg-gradient-to-r data-[state=active]:!from-primary data-[state=active]:!to-primary-glow data-[state=active]:!text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20
                data-[state=active]:!bg-[#3a465d] data-[state=active]:!text-white hover:text-white focus-visible:!ring-0 focus-visible:!ring-offset-0 focus:!outline-none"
            >
              <Crown size={16} />
              Annual Top 5
            </TabsTrigger>
          </TabsList>

          <TabsContent value="monthly" className="mt-0">
            {renderLeaderboard(
              monthlyLeaders,
              <Trophy className="text-accent" size={20} />,
              "Monthly Top Scholars • ₦50,000 Cash Prize",
              currentUserRanks.monthly,
              currentUserPoints.monthly,
              monthlyPage,
              setMonthlyPage
            )}
          </TabsContent>

          <TabsContent value="annual" className="mt-0">
            {renderLeaderboard(
              annualLeaders,
              <Crown className="text-accent" size={20} />,
              "Annual Grand Champions • ₦1,500,000 Grand Prize",
              currentUserRanks.annual,
              currentUserPoints.annual,
              annualPage,
              setAnnualPage
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

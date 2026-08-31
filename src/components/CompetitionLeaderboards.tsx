import { useState } from "react";
import { Trophy, Calendar, Crown, ChevronLeft, ChevronRight, School, User, Medal } from "lucide-react";
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

    return (
      <div className="space-y-4">
        {/* Prize Banner */}
        <div className="text-center p-4 bg-gradient-to-r from-accent/10 via-primary/10 to-accent/10 border border-accent/30 rounded-2xl">
          <div className="flex items-center justify-center gap-2">
            {icon}
            <span className="font-extrabold text-foreground text-sm tracking-wide uppercase">{prizeInfo}</span>
          </div>
        </div>

        {/* Current User Rank Card (if not in top leaders) */}
        {showUserPositionCard && (
          <Card className="border-2 border-primary bg-primary/5 shadow-md rounded-2xl animate-fade-in">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xl">
                    👤
                  </div>
                  <div>
                    <p className="font-black text-foreground">{currentUserName} (You)</p>
                    <p className="text-xs font-semibold text-muted-foreground">
                      Your current position • {currentPoints.toLocaleString()} pts
                      {currentRank <= 5 && <span className="ml-2 font-black text-primary">• Top 5!</span>}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-primary">
                    #{currentRank}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leaders List */}
        <div className="space-y-3">
          {paginatedLeaders.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm bg-card/40 rounded-2xl border border-border/50">
              No students ranked yet. Be the first to quiz!
            </div>
          ) : (
            paginatedLeaders.map((student, index) => {
              const rank = student.rank || index + 1;
              const rankStyle = getRankBadge(rank);
              const isSchoolAffiliated = Boolean(
                student.school && 
                student.school !== "Independent Scholar" && 
                student.school !== "Private Study"
              );

              return (
                <Card
                  key={student.rank || index}
                  className={`border-2 rounded-2xl transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
                    student.isCurrentUser 
                      ? "border-primary bg-primary/5 shadow-md" 
                      : rankStyle.border
                  }`}
                >
                  <CardContent className="p-3.5 sm:p-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                      {/* Avatar with rank medal */}
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 sm:w-13 sm:h-13 bg-muted/60 rounded-2xl flex items-center justify-center text-2xl border border-border shadow-xs">
                          <span>{student.avatar}</span>
                        </div>
                        <div className={`absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center shadow-md ${rankStyle.badgeBg}`}>
                          <span className="text-[11px] font-black">{rank <= 3 ? rankStyle.icon : `#${rank}`}</span>
                        </div>
                      </div>

                      {/* Student Info & School Tag */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-base sm:text-lg font-black text-foreground truncate">
                            {student.name}
                          </h4>
                          {rank === 1 && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-500 border border-amber-500/30 text-[10px] font-extrabold uppercase tracking-wider">
                              Leader
                            </span>
                          )}
                        </div>

                        {/* School Affiliation Badge */}
                        <div className="mt-1 flex items-center gap-1.5">
                          {isSchoolAffiliated ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold truncate max-w-full">
                              <School size={12} className="flex-shrink-0" />
                              <span className="truncate">{student.school}</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-muted/80 border border-border text-muted-foreground text-xs font-medium truncate max-w-full">
                              <User size={12} className="flex-shrink-0" />
                              <span>Independent Scholar</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Points Display */}
                      <div className="text-right flex-shrink-0 pl-2">
                        <div className="text-lg sm:text-2xl font-black text-primary leading-tight">
                          {student.points.toLocaleString()}
                        </div>
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                          points
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Pagination Controls (Only displayed when paginated) */}
        {isPaginated && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 pb-2 px-2 border-t border-border/40">
            <div className="text-xs font-semibold text-muted-foreground">
              Showing <span className="text-foreground font-bold">{startIndex + 1}</span>–
              <span className="text-foreground font-bold">{Math.min(endIndex, leaders.length)}</span> of{" "}
              <span className="text-foreground font-bold">{leaders.length}</span> students
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
                disabled={safeCurrentPage === 1}
                className="h-8 px-2.5 gap-1 text-xs font-bold rounded-lg border-border"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Prev</span>
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <Button
                    key={pageNum}
                    variant={pageNum === safeCurrentPage ? "default" : "ghost"}
                    size="sm"
                    onClick={() => onPageChange(pageNum)}
                    className={`h-8 w-8 p-0 text-xs font-bold rounded-lg ${
                      pageNum === safeCurrentPage
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {pageNum}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.min(totalPages, safeCurrentPage + 1))}
                disabled={safeCurrentPage === totalPages}
                className="h-8 px-2.5 gap-1 text-xs font-bold rounded-lg border-border"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="border-2 border-border/70 bg-card/80 backdrop-blur-md shadow-xl rounded-[2rem] overflow-hidden">
      <CardContent className="pt-6 sm:pt-8 p-4 sm:p-8">
        <Tabs defaultValue="monthly" className="w-full flex flex-col">
          <TabsList className="flex w-fit mx-auto gap-2 rounded-full p-1.5 bg-muted/60 border border-border/60 backdrop-blur-sm mb-8">
            <TabsTrigger 
              value="monthly" 
              className="rounded-full font-black gap-2 px-6 sm:px-8 py-2.5 text-xs sm:text-sm transition-all duration-300
                data-[state=active]:!bg-gradient-to-r data-[state=active]:!from-primary data-[state=active]:!to-accent data-[state=active]:!text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20
                hover:text-foreground/80 focus-visible:!ring-0 focus-visible:!ring-offset-0 focus:!outline-none"
            >
              <Calendar size={16} />
              Monthly Top 5
            </TabsTrigger>
            <TabsTrigger 
              value="annual" 
              className="rounded-full font-black gap-2 px-6 sm:px-8 py-2.5 text-xs sm:text-sm transition-all duration-300
                data-[state=active]:!bg-gradient-to-r data-[state=active]:!from-primary data-[state=active]:!to-accent data-[state=active]:!text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20
                hover:text-foreground/80 focus-visible:!ring-0 focus-visible:!ring-offset-0 focus:!outline-none"
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

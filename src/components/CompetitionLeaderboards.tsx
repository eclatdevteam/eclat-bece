import { useState } from "react";
import { Trophy, Calendar, Crown, ChevronLeft, ChevronRight } from "lucide-react";
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
}

const ITEMS_PER_PAGE = 10;

export const CompetitionLeaderboards = ({
  showCurrentUserPosition = false,
  currentUserName = "Alex",
  monthlyLeaders = [],
  annualLeaders = [],
  currentUserRanks = { monthly: 12, annual: 8 },
  currentUserPoints = { monthly: 0, annual: 0 },
}: CompetitionLeaderboardsProps) => {
  const [monthlyPage, setMonthlyPage] = useState(1);
  const [annualPage, setAnnualPage] = useState(1);

  const renderLeaderboard = (
    leaders: LeaderboardStudent[], 
    icon: React.ReactNode, 
    prizeInfo: string,
    currentRank: number,
    currentPoints: number,
    currentPage: number,
    onPageChange: (page: number) => void
  ) => {
    // Check if the current user is in the list
    const isUserInList = leaders.some(s => s.isCurrentUser);
    const showUserPositionCard = showCurrentUserPosition && !isUserInList && currentRank > 0;

    const totalPages = Math.max(1, Math.ceil(leaders.length / ITEMS_PER_PAGE));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedLeaders = leaders.slice(startIndex, endIndex);

    return (
      <div className="space-y-4">
        {/* Prize Banner */}
        <div className="text-center p-4 bg-accent/10 border border-accent/20 rounded-2xl">
          <div className="flex items-center justify-center gap-2">
            {icon}
            <span className="font-black text-accent text-sm tracking-wide uppercase">{prizeInfo}</span>
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
                      {currentRank <= 10 && <span className="ml-2 font-black text-primary">• Top 10!</span>}
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
          {leaders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No students ranked yet. Be the first to quiz!
            </div>
          ) : (
            paginatedLeaders.map((student, index) => (
              <Card
                key={student.rank || index}
                className={`border-2 rounded-2xl transition-all duration-300 hover:shadow-md hover:border-primary/30 ${
                  student.isCurrentUser 
                    ? "border-primary bg-primary/5" 
                    : student.rank <= 3 
                    ? "border-accent/30 bg-card" 
                    : "border-border/50 bg-card"
                }`}
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-3">
                    {/* Avatar with rank badge */}
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-2xl border border-primary/20">
                        <span>{student.avatar}</span>
                      </div>
                      <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center shadow-sm ${
                        student.rank <= 3 ? "bg-accent text-white" : "bg-primary text-white"
                      }`}>
                        <span className="text-[10px] font-black">#{student.rank}</span>
                      </div>
                    </div>

                    {/* Student Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm sm:text-base text-foreground truncate ${student.rank <= 10 ? 'font-black' : 'font-bold'}`}>
                        {student.name}
                      </h4>
                      <p className="text-xs sm:text-sm font-semibold text-muted-foreground truncate">
                        {student.school}
                      </p>
                    </div>

                    {/* Points */}
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg sm:text-xl font-black text-primary leading-tight">
                        {student.points.toLocaleString()}
                      </div>
                      <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">pts</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination Controls (Only displayed when items exceed 10) */}
        {totalPages > 1 && (
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
    <Card className="border-2 border-border/50 bg-background/50 backdrop-blur-sm shadow-sm rounded-[2rem] overflow-hidden">
      <CardContent className="pt-6">
        <Tabs defaultValue="monthly" className="w-full flex flex-col">
          <TabsList className="flex w-fit mx-auto gap-2 rounded-full p-1.5 bg-muted/40 border border-border/40 backdrop-blur-sm mb-8">
            <TabsTrigger 
              value="monthly" 
              className="rounded-full font-black gap-2 px-8 py-3 text-sm transition-all duration-300
                data-[state=active]:!bg-gradient-to-r data-[state=active]:!from-primary data-[state=active]:!to-primary-glow data-[state=active]:!text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20
                hover:text-foreground/80 focus-visible:!ring-0 focus-visible:!ring-offset-0 focus:!outline-none"
            >
              <Calendar size={16} />
              Monthly
            </TabsTrigger>
            <TabsTrigger 
              value="annual" 
              className="rounded-full font-black gap-2 px-8 py-3 text-sm transition-all duration-300
                data-[state=active]:!bg-gradient-to-r data-[state=active]:!from-primary data-[state=active]:!to-primary-glow data-[state=active]:!text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20
                hover:text-foreground/80 focus-visible:!ring-0 focus-visible:!ring-offset-0 focus:!outline-none"
            >
              <Crown size={16} />
              Annual
            </TabsTrigger>
          </TabsList>

          <TabsContent value="monthly" className="mt-0">
            {renderLeaderboard(
              monthlyLeaders,
              <Trophy className="text-accent animate-bounce" size={20} />,
              "Win ₦50,000 Cash Prize!",
              currentUserRanks.monthly,
              currentUserPoints.monthly,
              monthlyPage,
              setMonthlyPage
            )}
          </TabsContent>

          <TabsContent value="annual" className="mt-0">
            {renderLeaderboard(
              annualLeaders,
              <Crown className="text-accent animate-pulse" size={20} />,
              "Grand Prize: ₦1,500,000 Cash!",
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

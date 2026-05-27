import { Trophy, Calendar, Crown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

export const CompetitionLeaderboards = ({
  showCurrentUserPosition = false,
  currentUserName = "Alex",
  monthlyLeaders = [],
  annualLeaders = [],
  currentUserRanks = { monthly: 12, annual: 8 },
  currentUserPoints = { monthly: 0, annual: 0 },
}: CompetitionLeaderboardsProps) => {

  const renderLeaderboard = (
    leaders: LeaderboardStudent[], 
    icon: React.ReactNode, 
    prizeInfo: string,
    currentRank: number,
    currentPoints: number
  ) => {
    // Check if the current user is in the list
    const isUserInList = leaders.some(s => s.isCurrentUser);
    const showUserPositionCard = showCurrentUserPosition && !isUserInList && currentRank > 0;

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
                    <p className="text-xs font-semibold text-muted-foreground">Your current position • {currentPoints.toLocaleString()} pts</p>
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
            leaders.map((student, index) => (
              <Card
                key={index}
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
                      <h4 className="text-sm sm:text-base font-black text-foreground truncate">
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
      </div>
    );
  };

  return (
    <Card className="border-2 border-border/50 bg-background/50 backdrop-blur-sm shadow-sm rounded-[2rem] overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-2xl font-black tracking-tight text-foreground">
          <Trophy className="text-accent" size={24} />
          National Leaderboards
        </CardTitle>
        <CardDescription>
          Compete with students across Nigeria and win real prizes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="monthly" className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-2xl p-1 bg-muted">
            <TabsTrigger value="monthly" className="rounded-xl font-black gap-1.5 py-3">
              <Calendar size={16} />
              Monthly
            </TabsTrigger>
            <TabsTrigger value="annual" className="rounded-xl font-black gap-1.5 py-3">
              <Crown size={16} />
              Annual
            </TabsTrigger>
          </TabsList>

          <TabsContent value="monthly" className="mt-6">
            {renderLeaderboard(
              monthlyLeaders,
              <Trophy className="text-accent animate-bounce" size={20} />,
              "Win ₦50,000 Cash Prize!",
              currentUserRanks.monthly,
              currentUserPoints.monthly
            )}
          </TabsContent>

          <TabsContent value="annual" className="mt-6">
            {renderLeaderboard(
              annualLeaders,
              <Crown className="text-accent animate-pulse" size={20} />,
              "Grand Prize: ₦1,500,000 Cash!",
              currentUserRanks.annual,
              currentUserPoints.annual
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

import { Trophy, Calendar, Crown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Student {
  rank: number;
  name: string;
  school: string;
  points: number;
  avatar: string;
}

interface CompetitionLeaderboardsProps {
  showCurrentUserPosition?: boolean;
  currentUserName?: string;
  currentUserRanks?: {
    monthly: number;
    annual: number;
  };
}

export const CompetitionLeaderboards = ({
  showCurrentUserPosition = false,
  currentUserName = "Alex",
  currentUserRanks = { monthly: 12, annual: 8 },
}: CompetitionLeaderboardsProps) => {
  const monthlyLeaders: Student[] = [
    { rank: 1, name: "Sarah Chen", school: "Singapore International", points: 12450, avatar: "🎓" },
    { rank: 2, name: "James Wilson", school: "Boston Academy", points: 11890, avatar: "📚" },
    { rank: 3, name: "Priya Patel", school: "Delhi Public School", points: 11250, avatar: "🌟" },
    { rank: 4, name: "Mohammed Al-Rashid", school: "Dubai International", points: 10980, avatar: "💫" },
    { rank: 5, name: "Emma Thompson", school: "London College", points: 10750, avatar: "🎯" },
  ];

  const annualLeaders: Student[] = [
    { rank: 1, name: "Li Wei", school: "Beijing International", points: 145890, avatar: "👑" },
    { rank: 2, name: "Sophia Martinez", school: "Madrid Academy", points: 142340, avatar: "🥇" },
    { rank: 3, name: "David Kim", school: "Seoul Global School", points: 138920, avatar: "🥈" },
    { rank: 4, name: "Olivia Brown", school: "Sydney Grammar", points: 135100, avatar: "🥉" },
    { rank: 5, name: "Lucas Silva", school: "São Paulo International", points: 132890, avatar: "⭐" },
  ];

  const renderLeaderboard = (leaders: Student[], icon: React.ReactNode, prizeInfo: string) => (
    <div className="space-y-4">
      <div className="text-center p-4 bg-accent-light rounded-lg">
        <div className="flex items-center justify-center gap-2 mb-2">
          {icon}
          <span className="font-bold text-accent">{prizeInfo}</span>
        </div>
      </div>

      {showCurrentUserPosition && (
        <Card className="border-2 border-primary bg-primary-light/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-xl">
                  👤
                </div>
                <div>
                  <p className="font-semibold text-foreground">{currentUserName} (You)</p>
                  <p className="text-sm text-muted-foreground">Your current position</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">
                  #{leaders === monthlyLeaders ? currentUserRanks.monthly : currentUserRanks.annual}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {leaders.map((student, index) => (
          <Card
            key={index}
            className={`border-2 ${student.rank <= 3 ? "border-accent" : ""} hover:shadow-hover transition-all`}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary-light rounded-full flex items-center justify-center">
                  <span className="text-2xl">{student.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl font-bold text-primary">#{student.rank}</span>
                    <h4 className="text-lg font-semibold text-foreground truncate">{student.name}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{student.school}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xl font-bold text-primary">{student.points.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">points</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="text-accent" size={24} />
          Global Leaderboards
        </CardTitle>
        <CardDescription>
          Compete with SAT students worldwide and win real cash prizes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="monthly" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="monthly">
              <Calendar size={16} className="mr-1" />
              Monthly
            </TabsTrigger>
            <TabsTrigger value="annual">
              <Crown size={16} className="mr-1" />
              Annual
            </TabsTrigger>
          </TabsList>

          <TabsContent value="monthly" className="mt-6">
            {renderLeaderboard(
              monthlyLeaders,
              <Trophy className="text-accent" size={20} />,
              "Win $100 Cash Prize!"
            )}
          </TabsContent>

          <TabsContent value="annual" className="mt-6">
            {renderLeaderboard(
              annualLeaders,
              <Crown className="text-accent" size={20} />,
              "Grand Prize: $1,500 Cash!"
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

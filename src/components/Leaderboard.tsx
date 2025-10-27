import { useState } from "react";
import { Medal, Crown, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LeaderboardProps {
  onViewFullLeaderboard: () => void;
}

export const Leaderboard = ({ onViewFullLeaderboard }: LeaderboardProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const topStudents = [
    {
      rank: 1,
      name: "Chidinma Okafor",
      school: "Corona Secondary School, Lagos",
      points: 9850,
      avatar: "🎓",
      badge: Crown,
      color: "text-accent",
      bgColor: "bg-accent-light",
    },
    {
      rank: 2,
      name: "Ibrahim Musa",
      school: "Government College, Abuja",
      points: 9620,
      avatar: "📚",
      badge: Medal,
      color: "text-muted-foreground",
      bgColor: "bg-muted",
    },
    {
      rank: 3,
      name: "Blessing Adeyemi",
      school: "International School, Ibadan",
      points: 9340,
      avatar: "🌟",
      badge: Medal,
      color: "text-primary",
      bgColor: "bg-primary-light",
    },
  ];

  const allStudents = [
    { rank: 1, name: "Chidinma Okafor", school: "Corona Secondary School, Lagos", points: 9850, avatar: "🎓" },
    { rank: 2, name: "Ibrahim Musa", school: "Government College, Abuja", points: 9620, avatar: "📚" },
    { rank: 3, name: "Blessing Adeyemi", school: "International School, Ibadan", points: 9340, avatar: "🌟" },
    { rank: 4, name: "Emeka Nwankwo", school: "Enugu State Academy", points: 9180, avatar: "💫" },
    { rank: 5, name: "Fatima Bello", school: "Capital Science Academy, Kano", points: 8950, avatar: "🎯" },
    { rank: 6, name: "Oluwaseun Ajayi", school: "Lagos Preparatory School", points: 8720, avatar: "⭐" },
    { rank: 7, name: "Amina Yusuf", school: "Government Secondary, Kaduna", points: 8540, avatar: "🏆" },
    { rank: 8, name: "Chukwuemeka Eze", school: "Port Harcourt International", points: 8320, avatar: "✨" },
    { rank: 9, name: "Aisha Mohammed", school: "Federal Capital College, Abuja", points: 8150, avatar: "🌟" },
    { rank: 10, name: "Tunde Williams", school: "Gateway Academy, Ibadan", points: 7980, avatar: "💎" },
    { rank: 11, name: "Grace Okoro", school: "Owerri Model School", points: 7820, avatar: "🎓" },
    { rank: 12, name: "Yusuf Abdullahi", school: "Sokoto State College", points: 7650, avatar: "📖" },
    { rank: 13, name: "Chiamaka Nnamdi", school: "Anambra Excellence Academy", points: 7490, avatar: "🔥" },
    { rank: 14, name: "Mohammed Sani", school: "Bauchi International School", points: 7330, avatar: "🚀" },
    { rank: 15, name: "Ngozi Adeola", school: "Osun State Secondary", points: 7180, avatar: "💪" },
  ];

  return (
    <section id="leaderboard" className="py-20 px-4 sm:px-6 lg:px-8 bg-primary-light/30">
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent-light rounded-full text-accent font-semibold mb-4">
            <Trophy size={16} />
            <span>This Month's Champions</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Top Performers
          </h2>
          <p className="text-lg text-muted-foreground">
            See who's leading the pack this month. Will you join them?
          </p>
        </div>

        {/* Leaderboard Cards */}
        <div className="max-w-4xl mx-auto space-y-4 mb-8">
          {topStudents.map((student, index) => {
            const Badge = student.badge;
            return (
              <Card
                key={index}
                className={`border-2 hover:border-primary hover:shadow-hover transition-all duration-300 ${
                  student.rank === 1 ? "border-accent shadow-glow" : ""
                } animate-scale-in`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-6">
                    {/* Rank Badge */}
                    <div className={`flex-shrink-0 w-16 h-16 ${student.bgColor} rounded-full flex items-center justify-center relative`}>
                      <span className="text-3xl">{student.avatar}</span>
                      <div className={`absolute -top-1 -right-1 w-8 h-8 ${student.bgColor} rounded-full flex items-center justify-center border-2 border-background`}>
                        <Badge className={student.color} size={16} />
                      </div>
                    </div>

                    {/* Student Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-2xl font-bold ${student.color}`}>#{student.rank}</span>
                        <h3 className="text-xl font-bold text-foreground truncate">{student.name}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{student.school}</p>
                    </div>

                    {/* Points */}
                    <div className="text-right flex-shrink-0">
                      <div className="text-2xl font-bold text-primary">{student.points.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">points</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* View Full Leaderboard Button */}
        <div className="text-center animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <Button variant="hero" size="lg" onClick={() => setDialogOpen(true)}>
            View Full Leaderboard
          </Button>
        </div>
      </div>

      {/* Full Leaderboard Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              <Trophy className="inline-block mr-2 text-accent" size={24} />
              Full Leaderboard
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-4">
            {allStudents.map((student, index) => (
              <Card
                key={index}
                className={`border ${student.rank <= 3 ? "border-accent" : "border-border"}`}
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
        </DialogContent>
      </Dialog>
    </section>
  );
};

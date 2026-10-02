import { useState } from "react";
import { Medal, Crown, Trophy, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LeaderboardStudent } from "@/utils/leaderboard";
import { useLeaderboardData } from "@/hooks/useLeaderboardData";

interface LeaderboardProps {
  onViewFullLeaderboard: () => void;
}

export const Leaderboard = ({ onViewFullLeaderboard }: LeaderboardProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data, isLoading: loading } = useLeaderboardData();
  const monthlyLeaders = data?.monthlyLeaders ?? [];

  const topStudents = monthlyLeaders.slice(0, 3).map((student, index) => ({
    ...student,
    badge: index === 0 ? Crown : Medal,
    color: index === 0 ? "text-accent" : index === 1 ? "text-muted-foreground" : "text-primary",
    bgColor: index === 0 ? "bg-accent-light" : index === 1 ? "bg-muted" : "bg-primary-light",
  }));

  const allStudents = monthlyLeaders;

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
        {loading ? (
          <div className="max-w-4xl mx-auto flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-4 mb-8">
            {topStudents.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No leaderboard data available yet. Start practicing to see your name here!
              </div>
            ) : (
              topStudents.map((student, index) => {
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
                        <h3 className={`text-xl text-foreground truncate ${student.rank <= 10 ? 'font-bold' : 'font-semibold'}`}>{student.name}</h3>
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
              })
            )}
          </div>
        )}

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
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : allStudents.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
          
              </div>
            ) : (
              allStudents.map((student, index) => (
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
                        <h4 className={`text-lg text-foreground truncate ${student.rank <= 10 ? 'font-bold' : 'font-semibold'}`}>{student.name}</h4>
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
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

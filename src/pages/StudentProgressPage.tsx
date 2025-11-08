import { TrendingUp } from "lucide-react";
import { ProgressReport } from "@/components/ProgressReport";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StudentProgressPage() {
  const badges = [
    { name: "First Quiz", icon: "🎯", earned: true },
    { name: "10 Quiz Master", icon: "⭐", earned: true },
    { name: "5-Day Streak", icon: "🔥", earned: true },
    { name: "Top 10%", icon: "👑", earned: false },
    { name: "Perfect Score", icon: "💯", earned: false },
    { name: "Week Warrior", icon: "⚡", earned: true },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 animate-fade-in">
        <h2 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
          <TrendingUp className="text-accent" size={32} />
          Your Progress
        </h2>
        <p className="text-muted-foreground">Track your performance and improvement</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Progress Report */}
        <div className="lg:col-span-2 animate-scale-in">
          <ProgressReport />
        </div>

        {/* Sidebar with Additional Stats */}
        <div className="space-y-6">
          {/* Session History */}
          <Card className="border-2 animate-scale-in" style={{ animationDelay: "0.1s" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="text-accent" size={20} />
                Session History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Last 5 Sessions</span>
                  <span className="font-semibold text-accent">↑ 12%</span>
                </div>
                <div className="flex gap-1">
                  {[85, 78, 82, 90, 88].map((score, idx) => (
                    <div key={idx} className="flex-1 bg-muted rounded overflow-hidden">
                      <div
                        className="bg-gradient-accent"
                        style={{ height: `${score}px`, transition: "all 0.3s" }}
                      ></div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Badges */}
          <Card className="border-2 animate-scale-in" style={{ animationDelay: "0.2s" }}>
            <CardHeader>
              <CardTitle className="text-lg">Badges Earned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {badges.map((badge, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 p-2 rounded border ${
                      badge.earned ? "bg-accent-light border-accent" : "bg-muted border-border opacity-50"
                    }`}
                  >
                    <span className="text-lg">{badge.icon}</span>
                    <span className="text-xs font-medium">{badge.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

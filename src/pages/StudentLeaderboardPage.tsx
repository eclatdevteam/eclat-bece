import { Trophy } from "lucide-react";
import { CompetitionLeaderboards } from "@/components/CompetitionLeaderboards";

export default function StudentLeaderboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 animate-fade-in">
        <h2 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
          <Trophy className="text-accent" size={32} />
          National Leaderboards
        </h2>
        <p className="text-muted-foreground">See where you rank among top performers nationwide</p>
      </div>

      <div className="animate-scale-in">
        <CompetitionLeaderboards 
          showCurrentUserPosition={true}
          currentUserName="Ada"
          currentUserRanks={{ monthly: 12, annual: 8 }}
        />
      </div>
    </div>
  );
}

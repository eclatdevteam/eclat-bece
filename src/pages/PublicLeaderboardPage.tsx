import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { CompetitionLeaderboards, LeaderboardStudent } from "@/components/CompetitionLeaderboards";
import { usePublicAuthAction } from "@/hooks/usePublicAuthAction";
import { fetchLeaderboardData } from "@/utils/leaderboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Award, Sparkles, Loader2, Gift, ArrowRight } from "lucide-react";

export default function PublicLeaderboardPage() {
  const { handleLoginClick, handleGetStartedClick } = usePublicAuthAction();
  const [isLoading, setIsLoading] = useState(true);
  const [monthlyLeaders, setMonthlyLeaders] = useState<LeaderboardStudent[]>([]);
  const [annualLeaders, setAnnualLeaders] = useState<LeaderboardStudent[]>([]);

  useEffect(() => {
    let isMounted = true;
    const loadLeaderboard = async () => {
      try {
        const data = await fetchLeaderboardData();
        if (isMounted) {
          setMonthlyLeaders(data.monthlyLeaders || []);
          setAnnualLeaders(data.annualLeaders || []);
        }
      } catch (err) {
        console.error("Error loading public leaderboard:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadLeaderboard();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation onLoginClick={handleLoginClick} onGetStartedClick={handleGetStartedClick} />
      
      {/* Header */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-primary/10 via-background to-background text-center">
        <div className="container mx-auto max-w-4xl animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/20 border border-accent/30 text-accent-foreground text-sm font-semibold mb-4">
            <Trophy className="h-4 w-4 text-primary" />
            National Academic Competition
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-4">
            Official National Leaderboards
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Live rankings of top-performing Primary 6 and JSS 3 scholars across Nigeria.
          </p>
          
          {/* Prize Breakdown Cards */}
          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto mb-6">
            <Card className="border-2 border-primary/40 bg-card/60 shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-center gap-2 text-primary font-bold">
                  <Award className="h-5 w-5" /> Monthly Championship
                </div>
                <CardTitle className="text-3xl font-extrabold text-foreground">₦50,000</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Awarded every month to the top point earners across BECE & Common Entrance subjects.
              </CardContent>
            </Card>

            <Card className="border-2 border-accent shadow-glow bg-card/60">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-center gap-2 text-accent font-bold">
                  <Gift className="h-5 w-5" /> Annual Grand Prize
                </div>
                <CardTitle className="text-3xl font-extrabold text-foreground">₦1,500,000</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Grand scholarship fund and awards presented at the conclusion of the academic competition cycle.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Main Leaderboard Section */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-5xl">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading national leaderboard standings...</p>
            </div>
          ) : (
            <CompetitionLeaderboards
              showCurrentUserPosition={false}
              monthlyLeaders={monthlyLeaders}
              annualLeaders={annualLeaders}
            />
          )}
        </div>
      </section>

      {/* CTA Join Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-t border-border/20 text-center">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold text-foreground mb-3">Want your name on the national leaderboard?</h2>
          <p className="text-muted-foreground mb-8">Start taking quizzes today, earn mastery points, and climb the ranks.</p>
          <Button size="lg" variant="hero" onClick={handleGetStartedClick} className="font-bold text-base px-8 h-12 bg-gradient-to-r from-primary to-accent">
            Join Competition Free <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}

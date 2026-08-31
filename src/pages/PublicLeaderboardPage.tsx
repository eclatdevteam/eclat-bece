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
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <Navigation onLoginClick={handleLoginClick} onGetStartedClick={handleGetStartedClick} />
      
      {/* Header & Prize Overview */}
      <section className="pt-16 pb-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-primary/10 via-background to-background text-center">
        <div className="container mx-auto max-w-4xl animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs sm:text-sm font-extrabold uppercase tracking-wider mb-4">
            <Trophy className="h-4 w-4" />
            <span>National Academic Competition</span>
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground mb-3">
            Official National Leaderboards
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Live rankings of the top 5 Primary 6 and JSS 3 scholars across Nigeria.
          </p>
          
          {/* Prize Breakdown Cards */}
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 max-w-3xl mx-auto mb-2 text-left">
            <Card className="border-2 border-primary/40 bg-card/80 backdrop-blur-md shadow-md rounded-2xl">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <Award className="h-5 w-5 flex-shrink-0" />
                  <span>Monthly Championship</span>
                </div>
                <CardTitle className="text-2xl sm:text-3xl font-black text-foreground">₦50,000</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground leading-relaxed">
                Awarded every month to top point earners across BECE & Common Entrance subjects.
              </CardContent>
            </Card>

            <Card className="border-2 border-accent/60 bg-card/80 backdrop-blur-md shadow-md rounded-2xl">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-accent font-bold text-sm">
                  <Gift className="h-5 w-5 flex-shrink-0" />
                  <span>Annual Grand Prize</span>
                </div>
                <CardTitle className="text-2xl sm:text-3xl font-black text-foreground">₦1,500,000</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground leading-relaxed">
                Grand scholarship fund and awards presented at the conclusion of the academic year.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Main Leaderboard Section */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 bg-card/40 rounded-3xl border border-border/50">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm font-semibold text-muted-foreground">Loading national leaderboard standings...</p>
            </div>
          ) : (
            <CompetitionLeaderboards
              showCurrentUserPosition={false}
              monthlyLeaders={monthlyLeaders}
              annualLeaders={annualLeaders}
              limit={5}
            />
          )}
        </div>
      </section>

      {/* CTA Join Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-t border-border/20 text-center">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-3">Want your name on the national leaderboard?</h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-6">Start taking quizzes today, earn competition points, and compete for scholarships.</p>
          <Button size="lg" variant="hero" onClick={handleGetStartedClick} className="font-extrabold text-base px-8 h-12 rounded-xl bg-gradient-to-r from-primary to-accent shadow-lg text-white">
            Join Competition Free <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}

import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { CompetitionLeaderboards, LeaderboardStudent } from "@/components/CompetitionLeaderboards";
import { usePublicAuthAction } from "@/hooks/usePublicAuthAction";
import { fetchLeaderboardData } from "@/utils/leaderboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Award, Sparkles, Loader2, Gift, ArrowRight, Flame } from "lucide-react";

export default function PublicLeaderboardPage() {
  const { handleLoginClick, handleGetStartedClick } = usePublicAuthAction();
  const [isLoading, setIsLoading] = useState(true);
  const [weeklyLeaders, setWeeklyLeaders] = useState<LeaderboardStudent[]>([]);
  const [monthlyLeaders, setMonthlyLeaders] = useState<LeaderboardStudent[]>([]);
  const [annualLeaders, setAnnualLeaders] = useState<LeaderboardStudent[]>([]);
  const [mathLeaders, setMathLeaders] = useState<LeaderboardStudent[]>([]);
  const [englishLeaders, setEnglishLeaders] = useState<LeaderboardStudent[]>([]);
  const [schoolLeaders, setSchoolLeaders] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    const loadLeaderboard = async () => {
      try {
        const data = await fetchLeaderboardData();
        if (isMounted) {
          setWeeklyLeaders(data.weeklyLeaders || []);
          setMonthlyLeaders(data.monthlyLeaders || []);
          setAnnualLeaders(data.annualLeaders || []);
          setMathLeaders(data.mathLeaders || []);
          setEnglishLeaders(data.englishLeaders || []);
          setSchoolLeaders(data.schoolLeaders || []);
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
            Live rankings of top Primary 6 and JSS 3 scholars across Nigeria, ranked by verified Éclat Points.
          </p>
          
          {/* Prize Breakdown Cards */}
          <div className="grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto mb-2 text-left">
            <Card className="border-2 border-amber-500/40 bg-card/80 backdrop-blur-md shadow-md rounded-2xl">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-wider">
                  <Flame className="h-4 w-4 flex-shrink-0" />
                  <span>Weekly Sprint</span>
                </div>
                <CardTitle className="text-xl sm:text-2xl font-black text-foreground">Weekly Badges</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground leading-relaxed">
                Weekly prestige & league promotions resetting every Sunday at 23:59 UTC.
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/40 bg-card/80 backdrop-blur-md shadow-md rounded-2xl">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                  <Award className="h-4 w-4 flex-shrink-0" />
                  <span>Monthly Championship</span>
                </div>
                <CardTitle className="text-xl sm:text-2xl font-black text-foreground">₦50,000</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground leading-relaxed">
                Awarded monthly to top Éclat Point earners across BECE & Common Entrance subjects.
              </CardContent>
            </Card>

            <Card className="border-2 border-accent/60 bg-card/80 backdrop-blur-md shadow-md rounded-2xl">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-accent font-bold text-xs uppercase tracking-wider">
                  <Gift className="h-4 w-4 flex-shrink-0" />
                  <span>Annual Grand Prize</span>
                </div>
                <CardTitle className="text-xl sm:text-2xl font-black text-foreground">₦1,500,000</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground leading-relaxed">
                Grand scholarship fund presented at the conclusion of the academic year.
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
              weeklyLeaders={weeklyLeaders}
              monthlyLeaders={monthlyLeaders}
              annualLeaders={annualLeaders}
              schoolLeaders={schoolLeaders}
              mathLeaders={mathLeaders}
              englishLeaders={englishLeaders}
              limit={5}
              defaultTab="weekly"
            />
          )}
        </div>
      </section>

      {/* CTA Join Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-t border-border/20 text-center">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-3">Want your name on the national leaderboard?</h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-6">Start taking practice quizzes today, earn Éclat Points, and compete for scholarships.</p>
          <Button size="lg" variant="hero" onClick={handleGetStartedClick} className="font-extrabold text-base px-8 h-12 rounded-xl bg-gradient-to-r from-primary to-accent shadow-lg text-white">
            Join Competition Free <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}

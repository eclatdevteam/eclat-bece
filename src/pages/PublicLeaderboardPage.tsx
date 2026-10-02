import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { CompetitionLeaderboards, LeaderboardStudent } from "@/components/CompetitionLeaderboards";
import { usePublicAuthAction } from "@/hooks/usePublicAuthAction";
import { useLeaderboardData } from "@/hooks/useLeaderboardData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Award, Sparkles, Loader2, Gift, ArrowRight, Flame } from "lucide-react";

export default function PublicLeaderboardPage() {
  const { handleLoginClick, handleGetStartedClick } = usePublicAuthAction();
  const { data, isLoading } = useLeaderboardData();
  const weeklyLeaders: LeaderboardStudent[] = data?.weeklyLeaders ?? [];
  const monthlyLeaders: LeaderboardStudent[] = data?.monthlyLeaders ?? [];
  const annualLeaders: LeaderboardStudent[] = data?.annualLeaders ?? [];
  const mathLeaders: LeaderboardStudent[] = data?.mathLeaders ?? [];
  const englishLeaders: LeaderboardStudent[] = data?.englishLeaders ?? [];
  const schoolLeaders = data?.schoolLeaders ?? [];

  return (
    <div className="min-h-screen bg-white dark:bg-[#080f22] text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-[#3bc2f3] selection:text-slate-950 font-sans transition-colors duration-200">
      <Navigation onLoginClick={handleLoginClick} onGetStartedClick={handleGetStartedClick} />
      
      {/* Header & Prize Overview */}
      <section className="pt-20 pb-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-100 via-slate-50 to-white dark:from-[#071023] dark:via-[#081225] dark:to-[#080f22] text-center border-b border-slate-200 dark:border-[#202b43] relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#3bc2f3]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="container mx-auto max-w-4xl relative z-10 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-50 dark:bg-[#0c2438] border border-cyan-200 dark:border-[#2d4b68] text-cyan-800 dark:text-[#58c4e8] text-xs sm:text-sm font-extrabold uppercase tracking-wider mb-4">
            <Trophy className="h-4 w-4 text-amber-500" />
            <span>National Academic Competition</span>
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white mb-3">
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

            <Card className="border border-slate-200 dark:border-[#233148] bg-white dark:bg-[#0c1628] shadow-md dark:shadow-xl rounded-2xl">
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
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-[#080f22] flex-1">
        <div className="container mx-auto max-w-4xl">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white dark:bg-[#0c1628] rounded-3xl border border-slate-200 dark:border-[#233148]">
              <Loader2 className="h-10 w-10 animate-spin text-[#3bc2f3]" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Loading national leaderboard standings...</p>
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
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#071023] border-t border-slate-200 dark:border-[#202b43] text-center">
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

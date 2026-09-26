import { useState, useEffect } from "react";
import { 
  Sparkles, 
  Flame, 
  Trophy, 
  TrendingUp, 
  Shield, 
  Award, 
  Calendar, 
  Heart, 
  Share2, 
  Printer, 
  CheckCircle2, 
  AlertCircle,
  ArrowUpRight,
  Loader2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  fetchOrGenerateWeeklyDigest, 
  GrowthDigestResult 
} from "@/services/gamification/growthDigestService";

interface WeeklyGrowthDigestCardProps {
  parentId: string;
  studentId: string;
  studentName: string;
}

export function WeeklyGrowthDigestCard({
  parentId,
  studentId,
  studentName,
}: WeeklyGrowthDigestCardProps) {
  const [digest, setDigest] = useState<GrowthDigestResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [cheerSent, setCheerSent] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadDigest = async () => {
      try {
        setLoading(true);
        const res = await fetchOrGenerateWeeklyDigest(parentId, studentId);
        if (isMounted) {
          setDigest(res);
        }
      } catch (err) {
        console.error("Error loading weekly digest:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (parentId && studentId) {
      loadDigest();
    }
    return () => {
      isMounted = false;
    };
  }, [parentId, studentId]);

  const handleSendCheer = () => {
    setCheerSent(true);
    toast.success(`Encouragement sent to ${studentName}! ❤️`, {
      description: "Your positive cheer will be waiting on their student dashboard.",
    });
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Card className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card p-6 shadow-md animate-pulse">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm font-bold text-muted-foreground">Composing {studentName}&apos;s Weekly Growth Digest...</span>
        </div>
      </Card>
    );
  }

  if (!digest) return null;

  const { metrics } = digest;

  return (
    <Card className="overflow-hidden rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card shadow-xl transition-all print:border-none print:shadow-none">
      {/* Top Banner */}
      <div className="border-b border-border/50 bg-gradient-to-r from-primary/15 via-accent/10 to-transparent px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary shadow-inner">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-primary">
                  Official Weekly Growth Digest
                </span>
                <Badge variant="outline" className="border-primary/30 bg-background/50 text-[10px] font-bold">
                  <Calendar className="mr-1 h-3 w-3" />
                  {digest.weekStartDate} to {digest.weekEndDate}
                </Badge>
              </div>
              <h3 className="text-lg font-black tracking-tight text-foreground sm:text-xl">
                {digest.headline}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="h-8 rounded-xl border-border/60 text-xs font-bold gap-1.5 hover:bg-muted"
            >
              <Printer className="h-3.5 w-3.5" />
              Print / Save
            </Button>
            <Button
              size="sm"
              disabled={cheerSent}
              onClick={handleSendCheer}
              className={`h-8 rounded-xl font-bold text-xs gap-1.5 shadow-sm transition-all ${
                cheerSent 
                  ? "bg-emerald-600 text-white" 
                  : "bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 shadow-rose-500/20"
              }`}
            >
              <Heart className={`h-3.5 w-3.5 ${cheerSent ? "fill-white" : ""}`} />
              {cheerSent ? "Cheer Sent!" : "Send Cheer"}
            </Button>
          </div>
        </div>
      </div>

      <CardContent className="space-y-6 p-6">
        {/* Narrative Box */}
        <div className="rounded-2xl border border-primary/20 bg-background/60 p-4 sm:p-5 backdrop-blur-sm shadow-inner">
          <p className="text-sm sm:text-base leading-relaxed text-foreground/90 font-medium">
            {digest.narrative}
          </p>
        </div>

        {/* 4 Pillars Summary Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {/* Consistency / Days Active */}
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-3.5 transition-all hover:bg-muted/50">
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider">Days Active</span>
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-foreground">{metrics.daysActive}</span>
              <span className="text-xs font-semibold text-muted-foreground">/ 7 days</span>
            </div>
            <div className="mt-2 flex items-center gap-1">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded-full ${
                    i < metrics.daysActive ? "bg-primary" : "bg-muted"
                  }`}
                  title={`Day ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Weekly EP & Level */}
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-3.5 transition-all hover:bg-muted/50">
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider">Weekly EP</span>
              <Award className="h-4 w-4 text-amber-500" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-amber-500">+{metrics.epEarned}</span>
              <span className="text-xs font-semibold text-muted-foreground">EP</span>
            </div>
            <p className="mt-2 text-[11px] font-bold text-muted-foreground">
              Level {metrics.currentLevel} · {metrics.levelTitle}
            </p>
          </div>

          {/* League Cohort Status */}
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-3.5 transition-all hover:bg-muted/50">
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider">League Cohort</span>
              <Trophy className="h-4 w-4 text-purple-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-foreground truncate">{metrics.leagueName}</span>
            </div>
            <div className="mt-2">
              <Badge
                className={`text-[9px] font-black uppercase tracking-wider ${
                  metrics.leagueMovement === "promoted"
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                    : metrics.leagueMovement === "relegated"
                    ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"
                    : "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30"
                }`}
              >
                {metrics.leagueMovement === "promoted" && <ArrowUpRight className="mr-0.5 h-3 w-3 inline" />}
                {metrics.leagueMovement.toUpperCase()} ZONE
              </Badge>
            </div>
          </div>

          {/* Practice Streak & Shields */}
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-3.5 transition-all hover:bg-muted/50">
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider">Streak</span>
              <Flame className="h-4 w-4 text-orange-500" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-orange-500">{metrics.streakCount}</span>
              <span className="text-xs font-semibold text-muted-foreground">Days</span>
            </div>
            <p className="mt-2 text-[11px] font-bold text-muted-foreground flex items-center gap-1">
              <Shield className="h-3 w-3 text-cyan-400" /> {metrics.streakShields} Shield{metrics.streakShields === 1 ? "" : "s"} Held
            </p>
          </div>
        </div>

        {/* Turnarounds & Conquered Weaknesses */}
        {metrics.turnarounds.length > 0 && (
          <div className="space-y-2.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              Conquered Weaknesses (Academic Turnarounds)
            </h4>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {metrics.turnarounds.map((turnaround, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3"
                >
                  <div>
                    <p className="text-xs font-bold text-foreground">{turnaround.topic}</p>
                    <p className="text-[10px] text-muted-foreground">{turnaround.subject}</p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-none font-bold text-[10px]">
                      +{turnaround.gain}% Improvement
                    </Badge>
                    <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                      Now {turnaround.currentAccuracy}% ({turnaround.newStatus})
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actionable Parent Encouragement Callout */}
        <div className="rounded-2xl border border-border/80 bg-muted/40 p-4 flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Heart className="h-4 w-4" />
          </div>
          <div>
            <h5 className="text-xs font-black uppercase tracking-wider text-foreground">Parent Tip for This Week</h5>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {digest.actionableEncouragement}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

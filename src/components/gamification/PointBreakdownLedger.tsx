import { Sparkles, Zap, Target, Flame, Trophy, Award, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { GamificationSessionOutcome } from "@/services/gamification/gamificationService";

interface PointBreakdownLedgerProps {
  outcome: GamificationSessionOutcome;
}

export function PointBreakdownLedger({ outcome }: PointBreakdownLedgerProps) {
  const { pointResult, masteryOutcome, streakOutcome, dailyChallengeOutcome, levelOutcome } = outcome;

  const totalSessionEP =
    pointResult.totalEP +
    (masteryOutcome?.totalBonusEP || 0) +
    (streakOutcome?.milestoneBonusEP || 0) +
    (dailyChallengeOutcome?.eligible ? dailyChallengeOutcome.totalEP : 0);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "base":
        return <Zap className="w-4 h-4 text-amber-500" />;
      case "accuracy_multiplier":
        return <Target className="w-4 h-4 text-emerald-500" />;
      case "focus_bonus":
        return <Sparkles className="w-4 h-4 text-[#71c9ed]" />;
      case "speed_bonus":
        return <Flame className="w-4 h-4 text-rose-500" />;
      case "session_bonus":
        return <Trophy className="w-4 h-4 text-amber-400" />;
      case "streak_bonus":
        return <Flame className="w-4 h-4 text-orange-500" />;
      case "daily_challenge":
        return <Trophy className="w-4 h-4 text-amber-400" />;
      default:
        return <Award className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <Card className="p-5 bg-card/90 backdrop-blur border-border/80 rounded-2xl shadow-lg animate-fade-in text-left">
      {/* Header & Net Points Earned */}
      <div className="flex items-center justify-between border-b border-border/60 pb-4 mb-4">
        <div>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Éclat Points Ledger
          </span>
          <h3 className="text-xl font-black tracking-tight text-foreground mt-0.5">
            Session Rewards
          </h3>
        </div>
        <div className="text-right">
          <div className="text-3xl font-black text-primary flex items-center justify-end gap-1">
            <span>+{totalSessionEP}</span>
            <span className="text-sm font-bold text-primary/80">EP</span>
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            Acc: {Math.round(pointResult.accuracyPercentage)}%
          </span>
        </div>
      </div>

      {/* Itemized Points Breakdown List */}
      <div className="space-y-2.5 mb-5">
        {pointResult.breakdown.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors border border-border/40"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-background border border-border/60 shadow-xs">
                {getCategoryIcon(item.category)}
              </div>
              <div>
                <p className="text-sm font-bold text-foreground leading-none">{item.label}</p>
                {item.description && (
                  <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                )}
              </div>
            </div>
            <div className="font-black text-sm text-foreground">
              +{item.amount} EP
            </div>
          </div>
        ))}

        {/* Daily Challenge Reward if applicable */}
        {dailyChallengeOutcome && dailyChallengeOutcome.eligible && (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-500">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-600 dark:text-amber-400 leading-none">
                  Daily Challenge Completed!
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  +{dailyChallengeOutcome.baseCompletionEP} EP Completion +{dailyChallengeOutcome.accuracyTierEP} EP Accuracy Tier
                </p>
              </div>
            </div>
            <div className="font-black text-sm text-amber-600 dark:text-amber-400">
              +{dailyChallengeOutcome.totalEP} EP
            </div>
          </div>
        )}

        {/* Topic Mastery Transition Bonus if applicable */}
        {masteryOutcome && masteryOutcome.totalBonusEP > 0 && (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-500">
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 leading-none">
                  Mastery Upgrade: {masteryOutcome.newStatus.toUpperCase()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Improved from {masteryOutcome.previousAccuracy}% to {masteryOutcome.newAccuracy}%
                </p>
              </div>
            </div>
            <div className="font-black text-sm text-emerald-600 dark:text-emerald-400">
              +{masteryOutcome.totalBonusEP} EP
            </div>
          </div>
        )}

        {/* Streak Milestone Bonus if applicable */}
        {streakOutcome && streakOutcome.milestoneBonusEP > 0 && (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20 text-orange-500">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-orange-600 dark:text-orange-400 leading-none">
                  Streak Milestone: Day {streakOutcome.currentStreak}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Consistency milestone reached!
                </p>
              </div>
            </div>
            <div className="font-black text-sm text-orange-600 dark:text-orange-400">
              +{streakOutcome.milestoneBonusEP} EP
            </div>
          </div>
        )}
      </div>

      {/* Level Progression Progress Bar */}
      <div className="p-3.5 rounded-xl bg-muted/30 border border-border/40">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-bold text-foreground">
            Level {levelOutcome.level} • {levelOutcome.title}
          </span>
          <span className="text-muted-foreground font-semibold">
            {levelOutcome.lifetimeEP.toLocaleString()} / {levelOutcome.nextLevelMinEP.toLocaleString()} EP
          </span>
        </div>
        <Progress value={levelOutcome.progressPercent} className="h-2 rounded-full" />
        <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center justify-between">
          <span>{levelOutcome.progressPercent}% to Level {levelOutcome.level + 1}</span>
          <span>+{totalSessionEP} EP added</span>
        </p>
      </div>
    </Card>
  );
}

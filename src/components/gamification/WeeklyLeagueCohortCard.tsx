import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trophy,
  ArrowUp,
  ArrowDown,
  Minus,
  Shield,
  Clock,
  Users,
  Sparkles,
  TrendingUp,
  Share2,
  RefreshCw,
  Award,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLeagueCohort } from "@/hooks/useLeagueCohort";
import {
  LEAGUE_TIERS,
  PROMOTION_CUTOFF_RANK,
  RELEGATION_START_RANK,
} from "@/services/gamification/leagueEngine";
import { SocialShareModal } from "@/components/gamification/SocialShareModal";

interface WeeklyLeagueCohortCardProps {
  onShareRank?: () => void;
  compact?: boolean;
}

export function WeeklyLeagueCohortCard({
  onShareRank,
  compact = false,
}: WeeklyLeagueCohortCardProps) {
  const navigate = useNavigate();
  const {
    leagueTier,
    tierConfig,
    cohortNumber,
    members,
    currentUserMember,
    cohortWindow,
    loading,
    error,
    refresh,
  } = useLeagueCohort();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  const nextTierName = leagueTier < 8 ? LEAGUE_TIERS[(leagueTier + 1) as keyof typeof LEAGUE_TIERS].name : null;
  const prevTierName = leagueTier > 2 ? LEAGUE_TIERS[(leagueTier - 1) as keyof typeof LEAGUE_TIERS].name : null;
  const isProtectedFromRelegation = leagueTier <= 2;

  if (loading && members.length === 0) {
    return (
      <Card className="border border-border/60 bg-card/60 backdrop-blur-sm shadow-sm">
        <CardContent className="p-8 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
            <Trophy className="w-6 h-6 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">Loading weekly league standings...</p>
        </CardContent>
      </Card>
    );
  }

  if (error && members.length === 0) {
    return (
      <Card className="border border-destructive/20 bg-destructive/5">
        <CardContent className="p-6 text-center space-y-3">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border border-border/80 bg-gradient-to-b from-card via-card/95 to-background shadow-md overflow-hidden">
      {/* Header Banner */}
      <CardHeader className="p-5 sm:p-6 pb-4 border-b border-border/60 bg-muted/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner border ${tierConfig.borderColor} ${tierConfig.bgColor}`}>
              {tierConfig.badge}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl font-bold tracking-tight">
                  {tierConfig.name}
                </CardTitle>
                <Badge variant="outline" className="text-xs font-semibold px-2 py-0.5 border-primary/30 text-primary">
                  Group #{cohortNumber}
                </Badge>
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                {tierConfig.description}
              </CardDescription>
            </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            {currentUserMember && (
              <Button
                variant="outline"
                size="sm"
                onClick={onShareRank ? onShareRank : () => setShareModalOpen(true)}
                className="h-8 gap-1.5 text-xs font-medium"
              >
                <Share2 className="w-3.5 h-3.5" />
                Share Standing
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Refresh standings"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Status Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mt-4 pt-3 border-t border-border/40 text-xs">
          <div className="flex items-center gap-2 bg-background/60 rounded-lg p-2.5 border border-border/40">
            <Clock className="w-4 h-4 text-amber-500 shrink-0" />
            <div className="truncate">
              <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Weekly Reset</div>
              <div className="font-semibold text-foreground truncate">{cohortWindow.formattedCountdown}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-background/60 rounded-lg p-2.5 border border-border/40">
            <Users className="w-4 h-4 text-primary shrink-0" />
            <div className="truncate">
              <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Cohort Size</div>
              <div className="font-semibold text-foreground">{members.length} / 30 Scholars</div>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 flex items-center gap-2 bg-background/60 rounded-lg p-2.5 border border-border/40">
            <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0" />
            <div className="truncate">
              <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Your Position</div>
              <div className="font-semibold text-foreground truncate">
                {currentUserMember ? `Rank #${currentUserMember.rank} (${currentUserMember.weeklyEP.toLocaleString()} EP)` : "Not ranked yet"}
              </div>
            </div>
          </div>
        </div>

        {/* Promotion / Demotion Rules Legend */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3 pt-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <ArrowUp className="w-3.5 h-3.5" />
            <span>Top 5 Promoted {nextTierName ? `to ${nextTierName}` : ""}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <Minus className="w-3.5 h-3.5" />
            <span>Ranks 6–25 Retained</span>
          </div>
          {isProtectedFromRelegation ? (
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
              <Shield className="w-3.5 h-3.5" />
              <span>Ranks 26–30 Safe (Protected)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
              <ArrowDown className="w-3.5 h-3.5" />
              <span>Bottom 5 Relegated {prevTierName ? `to ${prevTierName}` : ""}</span>
            </div>
          )}
        </div>
      </CardHeader>

      {/* Cohort Leaderboard Rows */}
      <CardContent className="p-0">
        <div className="divide-y divide-border/40 max-h-[480px] overflow-y-auto">
          {members.map((member, idx) => {
            const isPromotion = member.rank <= PROMOTION_CUTOFF_RANK;
            const isRelegation = member.rank >= RELEGATION_START_RANK && !isProtectedFromRelegation;
            const isSafeProtected = member.rank >= RELEGATION_START_RANK && isProtectedFromRelegation;
            const isCurrentUser = member.isCurrentUser;

            return (
              <div
                key={member.studentId || idx}
                className={`flex items-center justify-between p-3 sm:px-5 transition-colors text-sm ${
                  isCurrentUser
                    ? "bg-primary/10 border-l-4 border-l-primary font-medium"
                    : isPromotion
                    ? "bg-emerald-500/[0.03] hover:bg-emerald-500/[0.06]"
                    : isRelegation
                    ? "bg-rose-500/[0.03] hover:bg-rose-500/[0.06]"
                    : "hover:bg-muted/30"
                }`}
              >
                {/* Left: Rank & Avatar & Name */}
                <div className="flex items-center gap-3 min-w-0">
                  {/* Rank Badge */}
                  <div className="w-8 text-center shrink-0">
                    {member.rank === 1 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs">
                        1
                      </span>
                    ) : member.rank === 2 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-400/20 text-slate-500 font-bold text-xs">
                        2
                      </span>
                    ) : member.rank === 3 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700/20 text-amber-700 dark:text-amber-500 font-bold text-xs">
                        3
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-muted-foreground">
                        #{member.rank}
                      </span>
                    )}
                  </div>

                  {/* Avatar */}
                  <Avatar className="h-9 w-9 border border-border shrink-0">
                    <AvatarImage src={member.avatarUrl} alt={member.name} />
                    <AvatarFallback className="text-xs font-bold bg-muted">
                      {member.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {/* Name & School */}
                  <div className="min-w-0 truncate">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className={`truncate ${isCurrentUser ? "text-primary font-bold" : "text-foreground"}`}>
                        {member.name}
                      </span>
                      {isCurrentUser && (
                        <Badge variant="secondary" className="text-[10px] py-0 px-1 font-bold shrink-0">
                          You
                        </Badge>
                      )}
                    </div>
                    {member.schoolName && (
                      <div className="text-[11px] text-muted-foreground truncate">
                        {member.schoolName}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Zone Indicator & Weekly EP */}
                <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                  {/* Status Indicator */}
                  <div className="text-right">
                    {isPromotion ? (
                      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] py-0.5 gap-1 hover:bg-emerald-500/20">
                        <ArrowUp className="w-3 h-3" />
                        <span className="hidden sm:inline">Promoting</span>
                      </Badge>
                    ) : isRelegation ? (
                      <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 text-[10px] py-0.5 gap-1 hover:bg-rose-500/20">
                        <ArrowDown className="w-3 h-3" />
                        <span className="hidden sm:inline">Relegation</span>
                      </Badge>
                    ) : isSafeProtected ? (
                      <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] py-0.5 gap-1">
                        <Shield className="w-3 h-3" />
                        <span className="hidden sm:inline">Protected</span>
                      </Badge>
                    ) : (
                      <Badge variant="ghost" className="text-muted-foreground text-[10px] py-0.5 gap-1">
                        <Minus className="w-3 h-3" />
                        <span className="hidden sm:inline">Safe</span>
                      </Badge>
                    )}
                  </div>

                  {/* Points */}
                  <div className="text-right min-w-[70px]">
                    <span className="font-bold text-foreground text-sm">
                      {member.weeklyEP.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-1">EP</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-muted/10 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground text-center sm:text-left">
            Earn Éclat Points from Quizzes and Challenges this week to climb toward promotion!
          </p>
          <Button
            size="sm"
            onClick={() => navigate("/dashboard/student/practice")}
            className="w-full sm:w-auto text-xs font-semibold gap-1.5 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Practice Now
          </Button>
        </div>
      </CardContent>
    </Card>

    {currentUserMember && (
      <SocialShareModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        config={{
          type: "league",
          studentName: currentUserMember.name,
          leagueName: tierConfig.name,
          leagueBadge: tierConfig.badge,
          rank: currentUserMember.rank,
          headline: `${tierConfig.name} Rank #${currentUserMember.rank}`,
          narrative:
            currentUserMember.rank <= 5
              ? `Currently ranked in the Top 5 Promotion Zone of the 30-player weekly league!`
              : `Holding strong with ${currentUserMember.weeklyEP.toLocaleString()} EP in this week's 30-player cohort!`,
          rewardEP: currentUserMember.weeklyEP,
        }}
      />
    )}
  </>
  );
}

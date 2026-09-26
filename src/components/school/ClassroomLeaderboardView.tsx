import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Search, Flame, Shield, Award, Sparkles, BookOpen, ChevronRight } from "lucide-react";
import { LEAGUE_TIERS, LeagueTierNumber } from "@/services/gamification/leagueEngine";

export interface EnrichedStudentRecord {
  id: string;
  user_id: string;
  class_year: "year_6" | "year_9" | null;
  is_premium: boolean | null;
  name: string;
  username: string;
  unique_id: string;
  avatar: string;
  avgScore: number;
  quizCount: number;
  // Four Pillars Gamification
  lifetime_ep: number;
  current_level: number;
  weekly_ep: number;
  league_tier: number;
  current_streak: number;
  mastered_topics_count: number;
  weak_topics_count: number;
  mastery_percentage: number;
}

interface ClassroomLeaderboardViewProps {
  students: EnrichedStudentRecord[];
  onSelectStudent: (student: EnrichedStudentRecord) => void;
}

export function ClassroomLeaderboardView({
  students,
  onSelectStudent,
}: ClassroomLeaderboardViewProps) {
  const [selectedCohort, setSelectedCohort] = useState<"all" | "year_6" | "year_9">("all");
  const [rankingMetric, setRankingMetric] = useState<"ep" | "weekly_ep" | "mastery" | "score">("ep");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAndRankedStudents = useMemo(() => {
    let result = students.filter((s) => {
      if (selectedCohort !== "all") {
        if (selectedCohort === "year_6" && s.class_year !== "year_6") return false;
        if (selectedCohort === "year_9" && (s.class_year !== "year_9" && s.class_year !== null)) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return s.name.toLowerCase().includes(q) || (s.username && s.username.toLowerCase().includes(q));
      }
      return true;
    });

    // Sort by chosen metric
    result.sort((a, b) => {
      if (rankingMetric === "ep") {
        return b.lifetime_ep - a.lifetime_ep || b.avgScore - a.avgScore;
      }
      if (rankingMetric === "weekly_ep") {
        return b.weekly_ep - a.weekly_ep || b.lifetime_ep - a.lifetime_ep;
      }
      if (rankingMetric === "mastery") {
        return b.mastery_percentage - a.mastery_percentage || b.lifetime_ep - a.lifetime_ep;
      }
      return b.avgScore - a.avgScore || b.lifetime_ep - a.lifetime_ep;
    });

    return result;
  }, [students, selectedCohort, rankingMetric, searchQuery]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-xl bg-card border-2 border-border/60">
        <div className="flex flex-wrap items-center gap-3">
          {/* Cohort Filter */}
          <Select
            value={selectedCohort}
            onValueChange={(val) => setSelectedCohort(val as "all" | "year_6" | "year_9")}
          >
            <SelectTrigger className="w-[180px] h-9 font-bold text-xs">
              <SelectValue placeholder="Cohort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All School Students</SelectItem>
              <SelectItem value="year_6">Year 6 (Common Entrance)</SelectItem>
              <SelectItem value="year_9">Year 9 (BECE)</SelectItem>
            </SelectContent>
          </Select>

          {/* Ranking Metric */}
          <Select
            value={rankingMetric}
            onValueChange={(val) => setRankingMetric(val as any)}
          >
            <SelectTrigger className="w-[200px] h-9 font-bold text-xs">
              <SelectValue placeholder="Sort Metric" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ep">🏆 Lifetime Éclat Points (EP)</SelectItem>
              <SelectItem value="weekly_ep">⚡ Weekly EP Pace</SelectItem>
              <SelectItem value="mastery">🎯 Curriculum Mastery %</SelectItem>
              <SelectItem value="score">📝 Average Quiz Score %</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search student..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
      </div>

      {/* Leaderboard Table / Cards */}
      {filteredAndRankedStudents.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="font-bold text-foreground">No students match your criteria</p>
            <p className="text-xs text-muted-foreground mt-1">Try clearing your search query or changing filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAndRankedStudents.map((student, idx) => {
            const rank = idx + 1;
            const tierConfig = LEAGUE_TIERS[student.league_tier as LeagueTierNumber] || LEAGUE_TIERS[1];
            const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;

            return (
              <div
                key={student.id}
                onClick={() => onSelectStudent(student)}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 border-2 rounded-2xl transition-all cursor-pointer hover:shadow-md hover:scale-[1.01] ${
                  rank === 1
                    ? "border-amber-400/60 bg-amber-400/5 shadow-xs"
                    : rank === 2
                    ? "border-slate-300 bg-slate-100/30 dark:bg-slate-900/30"
                    : rank === 3
                    ? "border-amber-700/40 bg-amber-700/5"
                    : "border-border/70 bg-card hover:border-primary"
                }`}
              >
                {/* Left: Rank & Avatar & Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-8 text-center flex-shrink-0">
                    {medal ? (
                      <span className="text-2xl leading-none">{medal}</span>
                    ) : (
                      <span className="text-sm font-black text-muted-foreground">#{rank}</span>
                    )}
                  </div>

                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl border border-primary/20 flex-shrink-0">
                    {student.avatar}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-base text-foreground truncate">{student.name}</h4>
                      {student.is_premium && (
                        <Badge className="bg-gradient-hero text-[10px] py-0">PRO</Badge>
                      )}
                      <Badge variant="outline" className="text-[10px] font-bold border-primary/30 text-primary">
                        Lvl {student.current_level}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap mt-0.5">
                      <span>{student.class_year === "year_6" ? "Year 6 (Pri 6)" : "Year 9 (BECE)"}</span>
                      <span>•</span>
                      <span className="font-semibold text-foreground/80">{tierConfig.name}</span>
                      {student.current_streak > 0 && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                            <Flame className="h-3 w-3 fill-amber-500" />
                            {student.current_streak}d
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Four Pillars & Stats */}
                <div className="flex items-center justify-between sm:justify-end gap-5 pt-3 sm:pt-0 border-t sm:border-t-0 border-border/50 mt-2 sm:mt-0">
                  {/* EP Metric */}
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Éclat Points</p>
                    <p className="text-base font-black text-primary leading-tight">
                      {student.lifetime_ep.toLocaleString()} <span className="text-[10px] uppercase font-bold text-muted-foreground">EP</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground">+{student.weekly_ep.toLocaleString()} this wk</p>
                  </div>

                  {/* Mastery % */}
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Mastery</p>
                    <p className="text-base font-black text-emerald-600 leading-tight">
                      {student.mastery_percentage}%
                    </p>
                    <p className="text-[10px] text-muted-foreground">{student.mastered_topics_count} mastered</p>
                  </div>

                  {/* Quiz Avg */}
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Quiz Avg</p>
                    <p className="text-base font-black text-accent leading-tight">
                      {student.avgScore}%
                    </p>
                    <p className="text-[10px] text-muted-foreground">{student.quizCount} tests</p>
                  </div>

                  <Button variant="outline" size="sm" className="gap-1 font-bold text-xs h-8">
                    <span>Report</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

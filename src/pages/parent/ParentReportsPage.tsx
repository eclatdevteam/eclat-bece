import { useState, useEffect, useMemo } from "react";
import { 
  ArrowDownToLine, 
  BarChart3, 
  CheckCircle2, 
  ChevronDown, 
  CircleAlert, 
  Download, 
  Search, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Loader2, 
  Award, 
  Calendar,
  Sparkles,
  Printer,
  Shield,
  Trophy,
  Flame,
  Target
} from "lucide-react";
import { WeeklyGrowthDigestCard } from "@/components/parent/WeeklyGrowthDigestCard";
import logoDark from "@/assets/logo-dark.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useParentAccount } from "@/hooks/useParentAccount";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface LinkedChild {
  id: string;
  user_id: string;
  class_year: string | null;
  is_premium: boolean;
  profile: {
    full_name: string | null;
    unique_id: string;
    username: string | null;
  };
}

interface SubjectStat {
  name: string;
  score: number;
  count: number;
  totalQuestions: number;
  trend: "up" | "down";
}

interface QuizItem {
  id: string;
  subject: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  completed_at: string;
}

export default function ParentReportsPage() {
  const { user } = useAuth();
  const { parentId, loading: parentLoading } = useParentAccount();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<LinkedChild[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [timeRange, setTimeRange] = useState<"week" | "month" | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Child specific data
  const [quizResults, setQuizResults] = useState<QuizItem[]>([]);
  const [streak, setStreak] = useState<number>(0);
  const [totalAssignments, setTotalAssignments] = useState<number>(0);
  const [completedAssignments, setCompletedAssignments] = useState<number>(0);
  const [gamificationProfile, setGamificationProfile] = useState<any>(null);
  const [topicMasteries, setTopicMasteries] = useState<Array<{ subject: string; topic: string; rolling_accuracy: number; status: string }>>([]);

  const selectedChild = useMemo(() => {
    return children.find((c) => c.id === selectedChildId) || children[0] || null;
  }, [children, selectedChildId]);

  // 1. Initial Load: Fetch Linked Children using parentId
  useEffect(() => {
    const fetchChildren = async (pId: string) => {
      try {
        setLoading(true);
        const { data: childrenData, error: childrenError } = await supabase
          .from("students")
          .select("id, user_id, class_year, is_premium, profile:profiles(full_name, unique_id, username)")
          .eq("parent_id", pId);

        if (childrenError) throw childrenError;

        const typed = (childrenData || []) as unknown as LinkedChild[];
        setChildren(typed);
        if (typed.length > 0) {
          setSelectedChildId((prev) => prev || typed[0].id);
        }
      } catch (err) {
        console.error("Error loading parent reports:", err);
        toast.error("Failed to load children profiles");
      } finally {
        setLoading(false);
      }
    };

    if (parentId) {
      fetchChildren(parentId);
    } else if (!parentLoading) {
      setLoading(false);
    }
  }, [parentId, parentLoading]);

  // 2. Fetch Report Data whenever selected child or timeRange changes
  useEffect(() => {
    const fetchChildReportData = async () => {
      if (!selectedChild) return;
      try {
        // Fetch Quizzes
        let query = supabase
          .from("quiz_results")
          .select("id, subject, score, total_questions, correct_answers, completed_at")
          .eq("student_id", selectedChild.id)
          .order("completed_at", { ascending: false });

        if (timeRange === "week") {
          const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
          query = query.gte("completed_at", oneWeekAgo);
        } else if (timeRange === "month") {
          const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
          query = query.gte("completed_at", oneMonthAgo);
        }

        const [quizRes, streakRes, assignRes, gameProfRes, masteryRes] = await Promise.all([
          query,
          supabase
            .from("student_streaks")
            .select("current_streak")
            .eq("student_id", selectedChild.id)
            .maybeSingle(),
          supabase
            .from("practice_assignments")
            .select("status")
            .eq("student_id", selectedChild.id),
          supabase
            .from("student_gamification_profile" as any)
            .select("*")
            .eq("student_id", selectedChild.id)
            .maybeSingle(),
          supabase
            .from("student_topic_mastery" as any)
            .select("subject, topic, rolling_accuracy, status")
            .eq("student_id", selectedChild.id),
        ]);

        if (quizRes.data) {
          setQuizResults(quizRes.data as QuizItem[]);
        }
        if (gameProfRes.data) {
          setGamificationProfile(gameProfRes.data as any);
          setStreak(Number((gameProfRes.data as any)?.streak_count ?? (streakRes.data?.current_streak || 0)));
        } else {
          setStreak(streakRes.data?.current_streak || 0);
        }

        if (masteryRes.data) {
          setTopicMasteries(masteryRes.data as any);
        }

        if (assignRes.data) {
          setTotalAssignments(assignRes.data.length);
          setCompletedAssignments(assignRes.data.filter((a) => a.status === "completed").length);
        } else {
          setTotalAssignments(0);
          setCompletedAssignments(0);
        }
      } catch (err) {
        console.error("Error loading child analytics:", err);
      }
    };

    fetchChildReportData();
  }, [selectedChild, timeRange]);

  // Derived calculations
  const totalQuizzes = quizResults.length;
  const overallAvg = useMemo(() => {
    if (totalQuizzes === 0) return 0;
    const sum = quizResults.reduce((acc, q) => acc + q.score, 0);
    return Math.round(sum / totalQuizzes);
  }, [quizResults, totalQuizzes]);

  // Group by subjects
  const subjectScores: SubjectStat[] = useMemo(() => {
    const map: Record<string, { total: number; count: number; questions: number; scores: number[] }> = {};
    quizResults.forEach((q) => {
      const name = q.subject.charAt(0).toUpperCase() + q.subject.slice(1);
      if (!map[name]) {
        map[name] = { total: 0, count: 0, questions: 0, scores: [] };
      }
      map[name].total += q.score;
      map[name].count += 1;
      map[name].questions += q.total_questions;
      map[name].scores.push(q.score);
    });

    return Object.entries(map).map(([name, data]) => {
      const avg = Math.round(data.total / data.count);
      const latest = data.scores[0];
      return {
        name,
        score: avg,
        count: data.count,
        totalQuestions: data.questions,
        trend: (latest >= avg ? "up" : "down") as "up" | "down",
      };
    }).sort((a, b) => b.score - a.score);
  }, [quizResults]);

  // Filtered subjects based on search
  const filteredSubjects = useMemo(() => {
    if (!searchQuery.trim()) return subjectScores;
    const q = searchQuery.toLowerCase();
    return subjectScores.filter((s) => s.name.toLowerCase().includes(q));
  }, [subjectScores, searchQuery]);

  // Areas of concern (subjects with avg < 65)
  const weakSubjects = useMemo(() => {
    return subjectScores.filter((s) => s.score < 65);
  }, [subjectScores]);

  // Sparkline data (last 10 quizzes, chronological)
  const chronologicalScores = useMemo(() => {
    return [...quizResults]
      .slice(0, 12)
      .reverse()
      .map((q) => ({
        score: q.score,
        subject: q.subject,
        date: q.completed_at ? format(new Date(q.completed_at), "MMM d") : "",
      }));
  }, [quizResults]);

  const handlePrint = () => {
    window.print();
  };

  const getFormatClassName = (classYear?: string | null) => {
    if (classYear === "year_6") return "Primary 6 (Year 6)";
    if (classYear === "year_9") return "JSS 3 (Year 9)";
    return classYear || "Student";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium animate-pulse">Loading academic reports...</p>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="w-full px-3 pb-20 pt-6 md:px-6">
        <Card className="rounded-[2.5rem] border-3 border-dashed border-border/60 bg-muted/10 p-16 text-center space-y-4">
          <Users className="h-12 w-12 text-muted-foreground/30 mx-auto" />
          <h2 className="text-2xl font-black">No Children Registered</h2>
          <p className="text-muted-foreground max-w-sm mx-auto text-sm">
            Add a child to your parent portal to begin tracking performance and viewing academic reports.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full px-3 pb-20 pt-6 md:px-6 print:p-0">
      {/* Official Institutional Report Header (Only visible when printing / saving PDF) */}
      <div className="hidden print:block mb-6 border-b-2 border-slate-900 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoDark} alt="Éclat Logo" className="h-10 w-auto object-contain" />
            <div>
              <h1 className="text-xl font-black uppercase tracking-wider text-slate-900 leading-tight">
                Éclat Academic Performance &amp; Diagnostic Report
              </h1>
              <p className="text-xs text-slate-600 font-semibold mt-0.5">
                Continuous Scholar Diagnostic &amp; Curriculum Mastery Summary
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block px-2.5 py-1 rounded bg-slate-100 text-slate-800 text-[10px] font-black uppercase tracking-wider border border-slate-300">
              Verified Academic Report
            </span>
            <p className="text-[10px] text-slate-500 font-bold mt-1">
              Generated: {format(new Date(), "MMMM d, yyyy")}
            </p>
          </div>
        </div>

        {/* Scholar Identification Metadata Strip */}
        <div className="mt-4 grid grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500 block">Scholar Name</span>
            <span className="font-black text-slate-900 text-sm">
              {selectedChild?.profile.full_name || "Scholar"}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500 block">Exam Cohort</span>
            <span className="font-bold text-slate-900">
              {getFormatClassName(selectedChild?.class_year)}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500 block">Student Unique ID</span>
            <span className="font-mono font-bold text-slate-700">
              {selectedChild?.profile.unique_id || "—"}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500 block">Academic Standing</span>
            <span className="font-bold text-slate-900">
              Level {gamificationProfile?.current_level || 1} • {(gamificationProfile?.lifetime_ep || 0).toLocaleString()} EP
            </span>
          </div>
        </div>
      </div>

      {/* Screen Header (Hidden on print) */}
      <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between print:hidden">
        <div>
          <div className="parent-section-chip">Academic Service</div>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-foreground md:text-5xl">
            Performance Reports
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            Detailed insights and progress tracking for{" "}
            <span className="font-bold text-foreground">
              {selectedChild?.profile.full_name || "Child"}
            </span>{" "}
            ({getFormatClassName(selectedChild?.class_year)}).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Child Selector if multiple children exist */}
          {children.length > 1 && (
            <Select value={selectedChildId} onValueChange={setSelectedChildId}>
              <SelectTrigger className="h-12 min-w-[200px] rounded-xl border border-border/60 bg-background/50 font-bold text-sm">
                <SelectValue placeholder="Select child" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {children.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="font-bold text-sm">
                    {c.profile.full_name || "Child"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Filter subjects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="parent-search h-12 bg-background/40 pl-10"
            />
          </div>

          <Button
            onClick={handlePrint}
            className="h-12 rounded-xl bg-primary px-5 text-sm font-black text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90"
          >
            <Printer className="mr-2 h-4 w-4" />
            Export / Print PDF
          </Button>
        </div>
      </div>

      {/* Weekly Parent Growth Digest (PRD §10.1 & Phase 3 Epic PAR-01) */}
      {parentId && selectedChild && (
        <div className="mb-8">
          <WeeklyGrowthDigestCard
            parentId={parentId}
            studentId={selectedChild.id}
            studentName={selectedChild.profile.full_name || "Child"}
          />
        </div>
      )}

      {/* Top 4 KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 print:grid-cols-4 print:gap-2.5 print:mb-6 print:break-inside-avoid">
        {/* Overall Score */}
        <Card className="parent-panel rounded-[1.5rem] border border-border/60 bg-card/60 p-5 shadow-sm print:p-3 print:bg-white print:border print:border-slate-300 print:rounded-xl print:shadow-none">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground print:text-slate-600">
            Overall Score
          </div>
          <div className="mt-3 flex items-end gap-2 print:mt-1.5">
            <div className="text-4xl font-black text-foreground print:text-2xl print:text-slate-900">
              {totalQuizzes > 0 ? `${overallAvg}%` : "—"}
            </div>
            {totalQuizzes > 0 && (
              <div className={`mb-1 text-sm font-bold print:text-xs ${overallAvg >= 75 ? "text-emerald-500 print:text-emerald-700" : overallAvg >= 50 ? "text-amber-500 print:text-amber-700" : "text-rose-500 print:text-rose-700"}`}>
                {overallAvg >= 75 ? "+Good" : overallAvg >= 50 ? "Average" : "Needs Work"}
              </div>
            )}
          </div>
          <div className="mt-2 text-xs text-muted-foreground print:mt-1 print:text-[10px] print:text-slate-500">
            Based on {totalQuizzes} completed quizzes
          </div>
        </Card>

        {/* Assignments Progress */}
        <Card className="parent-panel rounded-[1.5rem] border border-border/60 bg-card/60 p-5 shadow-sm print:p-3 print:bg-white print:border print:border-slate-300 print:rounded-xl print:shadow-none">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground print:text-slate-600">
            Assignments Done
          </div>
          <div className="mt-3 flex items-end gap-2 print:mt-1.5">
            <div className="text-4xl font-black text-foreground print:text-2xl print:text-slate-900">
              {completedAssignments}
            </div>
            <div className="mb-1 text-sm font-bold text-muted-foreground print:text-xs print:text-slate-600">
              /{totalAssignments}
            </div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted print:mt-1.5 print:h-1.5 print:bg-slate-200">
            <div
              className="h-full rounded-full bg-primary print:bg-slate-800 transition-all duration-500"
              style={{
                width: `${totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0}%`,
              }}
            />
          </div>
        </Card>

        {/* Current Streak */}
        <Card className="parent-panel rounded-[1.5rem] border border-border/60 bg-card/60 p-5 shadow-sm print:p-3 print:bg-white print:border print:border-slate-300 print:rounded-xl print:shadow-none">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground print:text-slate-600">
            Current Streak
          </div>
          <div className="mt-3 flex items-end gap-2 print:mt-1.5">
            <div className="text-4xl font-black text-foreground print:text-2xl print:text-slate-900">
              {streak}
            </div>
            <div className="mb-1 text-sm font-bold text-amber-500 print:text-xs print:text-slate-800">
              Days
            </div>
          </div>
          <div className="mt-2 text-xs font-semibold text-amber-500 print:mt-1 print:text-[10px] print:text-slate-600">
            {streak > 0 ? "🔥 Consistency on track" : "Complete today's quiz"}
          </div>
        </Card>

        {/* Areas of Concern */}
        <Card className="parent-panel rounded-[1.5rem] border border-border/60 bg-card/60 p-5 shadow-sm print:p-3 print:bg-white print:border print:border-slate-300 print:rounded-xl print:shadow-none">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground print:text-slate-600">
            Areas of Concern
          </div>
          <div className="mt-3 flex items-end gap-2 print:mt-1.5">
            <div className={`text-4xl font-black print:text-2xl ${weakSubjects.length > 0 ? "text-[#ff6a70] print:text-rose-700" : "text-emerald-500 print:text-emerald-700"}`}>
              {weakSubjects.length}
            </div>
            <div className="mb-1 text-sm font-bold text-muted-foreground print:text-xs print:text-slate-600">
              Subjects
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground print:mt-1 print:text-[10px]">
            {weakSubjects.length > 0 ? (
              <>
                <CircleAlert className="h-3.5 w-3.5 text-[#ff6a70] print:text-rose-700" />
                <span className="text-[#ff6a70] print:text-rose-700 font-semibold">Action recommended</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 print:text-emerald-700" />
                <span className="text-emerald-500 print:text-emerald-700 font-semibold">All subjects passing</span>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Main Grid: Trend Chart & Subject Breakdown */}
      <div className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_1fr] print:mt-4 print:flex print:flex-col print:gap-5">
        {/* Left Column: Trend & Quiz History */}
        <div className="space-y-6 print:space-y-4">
          <div className="rounded-[1.8rem] border border-border/60 bg-card/60 p-5 shadow-sm print:p-4 print:bg-white print:border print:border-slate-300 print:rounded-2xl print:shadow-none print:break-inside-avoid">
            <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:mb-3">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-foreground print:text-lg print:text-slate-900">Score Trend History</h2>
                <p className="text-xs text-muted-foreground print:text-slate-600">Performance progression over recent quizzes</p>
              </div>
              <div className="flex gap-1.5 print:hidden">
                <Button
                  variant={timeRange === "week" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeRange("week")}
                  className="rounded-xl font-bold text-xs"
                >
                  Week
                </Button>
                <Button
                  variant={timeRange === "month" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeRange("month")}
                  className="rounded-xl font-bold text-xs"
                >
                  Month
                </Button>
                <Button
                  variant={timeRange === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeRange("all")}
                  className="rounded-xl font-bold text-xs"
                >
                  All Time
                </Button>
              </div>
            </div>

            {chronologicalScores.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
                <BarChart3 className="h-10 w-10 text-muted-foreground/30" />
                <p className="font-bold text-muted-foreground">No quiz attempts recorded in this period</p>
                <p className="text-xs text-muted-foreground">Assign or encourage your child to complete quizzes to see trend progression.</p>
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-border/60 bg-background/30 p-5 print:p-3 print:bg-slate-50/70 print:border print:border-slate-200 print:rounded-xl">
                <div className="mb-4 flex h-52 items-end gap-2 sm:gap-3 print:h-40 print:mb-2">
                  {chronologicalScores.map((item, index) => (
                    <div key={index} className="flex flex-1 flex-col items-center justify-end gap-1.5 group relative">
                      {/* Tooltip on hover / score label on print */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 bg-popover text-popover-foreground text-[10px] font-bold py-1 px-2 rounded-lg border shadow-md pointer-events-none whitespace-nowrap z-10 print:opacity-100 print:static print:bg-transparent print:border-none print:shadow-none print:text-slate-800 print:p-0 print:text-[10px]">
                        {item.score}%
                      </div>
                      <div
                        className="w-full rounded-t-xl bg-gradient-to-t from-primary/30 via-primary/70 to-primary print:bg-primary transition-all duration-300 hover:brightness-110"
                        style={{ height: `${Math.max(item.score, 6)}%` }}
                      />
                      <span className="text-[10px] font-medium text-muted-foreground print:text-slate-600 truncate w-full text-center">
                        {item.date || `#${index + 1}`}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground print:text-slate-600 border-t border-border/40 print:border-slate-200 pt-3">
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary" />
                    Quiz Score (%)
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    Passing Target (70%)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Actionable Recommendations */}
          <div className="rounded-[1.8rem] border border-border/60 bg-card/60 p-5 shadow-sm space-y-4 print:p-4 print:bg-white print:border print:border-slate-300 print:rounded-2xl print:shadow-none print:break-inside-avoid print:space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <h3 className="text-xl font-black text-foreground print:text-base print:text-slate-900">Curriculum Insights & Recommendations</h3>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {subjectScores.length > 0 && (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-1 print:border-slate-300 print:bg-emerald-50/40 print:p-3 print:rounded-xl">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500 print:text-emerald-700">Strongest Subject</span>
                  <p className="font-bold text-foreground text-base print:text-slate-900">
                    {subjectScores[0].name} ({subjectScores[0].score}%)
                  </p>
                  <p className="text-xs text-muted-foreground print:text-slate-700">
                    Shows outstanding grasp of concepts. Encourage child to aim for full marks in school tests.
                  </p>
                </div>
              )}

              {weakSubjects.length > 0 ? (
                <div className="rounded-2xl border border-[#ff6a70]/30 bg-[#ff6a70]/5 p-4 space-y-1 print:border-slate-300 print:bg-rose-50/40 print:p-3 print:rounded-xl">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#ff6a70] print:text-rose-700">Focus Needed</span>
                  <p className="font-bold text-foreground text-base print:text-slate-900">
                    {weakSubjects[0].name} ({weakSubjects[0].score}%)
                  </p>
                  <p className="text-xs text-muted-foreground print:text-slate-700">
                    Performance indicates gap in key sub-topics. Consider creating targeted practice drills in this subject.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-1 print:border-slate-300 print:bg-emerald-50/40 print:p-3 print:rounded-xl">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500 print:text-emerald-700">Comprehensive Mastery</span>
                  <p className="font-bold text-foreground text-base print:text-slate-900">All subjects above target</p>
                  <p className="text-xs text-muted-foreground print:text-slate-700">
                    Great balance across syllabus. Keep practicing timed mock exams.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Subject Breakdown List */}
        <div className="space-y-6 print:space-y-4">
          <div className="rounded-[1.8rem] border border-border/60 bg-card/60 p-5 shadow-sm print:p-4 print:bg-white print:border print:border-slate-300 print:rounded-2xl print:shadow-none print:break-inside-avoid">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-foreground print:text-lg print:text-slate-900">Subject Mastery</h3>
                <p className="text-xs text-muted-foreground print:text-slate-600">Breakdown across all tested disciplines</p>
              </div>
              <Badge variant="outline" className="font-black text-xs print:bg-slate-100 print:text-slate-800 print:border-slate-300">
                {subjectScores.length} Subjects
              </Badge>
            </div>

            {/* Screen View: Interactive Cards List */}
            <div className="space-y-3 print:hidden">
              {filteredSubjects.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No subjects found matching your search.
                </div>
              ) : (
                filteredSubjects.map((sub) => (
                  <div
                    key={sub.name}
                    className="rounded-2xl border border-border/60 bg-background/40 p-4 transition-all hover:border-primary/40 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{sub.name}</span>
                        {sub.trend === "up" ? (
                          <TrendingUp className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-amber-500" />
                        )}
                      </div>
                      <span className={`text-base font-black ${sub.score >= 75 ? "text-emerald-500" : sub.score >= 60 ? "text-primary" : "text-[#ff6a70]"}`}>
                        {sub.score}%
                      </span>
                    </div>

                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${sub.score >= 75 ? "bg-emerald-500" : sub.score >= 60 ? "bg-primary" : "bg-[#ff6a70]"}`}
                        style={{ width: `${sub.score}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{sub.count} Quizzes completed</span>
                      <span>{sub.totalQuestions} Questions solved</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Print View: Structured Official Academic Table */}
            <div className="hidden print:block overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-black text-[10px] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Subject</th>
                    <th className="py-2.5 px-3 text-center">Score</th>
                    <th className="py-2.5 px-3 text-center">Quizzes</th>
                    <th className="py-2.5 px-3 text-center">Questions</th>
                    <th className="py-2.5 px-3 text-center">Diagnostic Level</th>
                    <th className="py-2.5 px-3 text-right">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {subjectScores.map((sub) => {
                    const status = sub.score >= 75 ? "Mastered" : sub.score >= 50 ? "Proficient" : "Needs Support";
                    const statusColor =
                      sub.score >= 75
                        ? "text-emerald-700 bg-emerald-50 border-emerald-300"
                        : sub.score >= 50
                        ? "text-blue-700 bg-blue-50 border-blue-300"
                        : "text-rose-700 bg-rose-50 border-rose-300";
                    return (
                      <tr key={sub.name} className="break-inside-avoid">
                        <td className="py-2 px-3 font-bold text-slate-900">{sub.name}</td>
                        <td className="py-2 px-3 text-center font-black text-slate-900">{sub.score}%</td>
                        <td className="py-2 px-3 text-center text-slate-700">{sub.count}</td>
                        <td className="py-2 px-3 text-center text-slate-700">{sub.totalQuestions}</td>
                        <td className="py-2 px-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase border ${statusColor}`}>
                            {status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-slate-700">
                          {sub.trend === "up" ? "↗ Upward" : "↘ Needs Focus"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* PRD Pillar 2: Topic Mastery Status Matrix */}
          <div className="rounded-[1.8rem] border border-border/60 bg-card/60 p-5 shadow-sm space-y-4 print:p-4 print:bg-white print:border print:border-slate-300 print:rounded-2xl print:shadow-none print:break-inside-avoid">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-foreground flex items-center gap-2 print:text-base print:text-slate-900">
                  <Target className="h-5 w-5 text-primary" />
                  Topic Mastery Matrix
                </h3>
                <p className="text-xs text-muted-foreground print:text-slate-600">Rolling 30-question diagnostic status per syllabus unit</p>
              </div>
              <Badge variant="outline" className="font-bold text-[10px] print:bg-slate-100 print:text-slate-800 print:border-slate-300">
                {topicMasteries.length} Topics
              </Badge>
            </div>

            {topicMasteries.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground font-semibold">
                Topic mastery will populate as {selectedChild?.profile.full_name || "your child"} completes curriculum questions.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1 print:max-h-none print:overflow-visible print:grid print:grid-cols-2 print:gap-2.5 print:space-y-0">
                {topicMasteries.map((m, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl border border-border/60 bg-background/50 p-3 hover:border-primary/30 transition-colors print:bg-slate-50/70 print:border-slate-200 print:p-2.5 print:rounded-lg print:break-inside-avoid"
                  >
                    <div>
                      <p className="text-xs font-bold text-foreground print:text-slate-900">{m.topic}</p>
                      <p className="text-[10px] text-muted-foreground print:text-slate-600">{m.subject}</p>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <span className="text-xs font-mono font-black text-foreground print:text-slate-900">
                        {Math.round(m.rolling_accuracy)}%
                      </span>
                      <Badge
                        className={`text-[9px] font-black uppercase ${
                          m.status === "Strong"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 print:bg-emerald-50 print:text-emerald-800 print:border-emerald-300"
                            : m.status === "Developing"
                            ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 print:bg-blue-50 print:text-blue-800 print:border-blue-300"
                            : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 print:bg-amber-50 print:text-amber-800 print:border-amber-300"
                        }`}
                      >
                        {m.status === "Weak" ? "Focus Area" : m.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Official Institutional Report Footer (Print Only) */}
      <div className="hidden print:flex print:flex-col print:gap-4 print:pt-6 print:mt-6 print:border-t-2 print:border-slate-300 print:break-inside-avoid text-slate-600 text-xs">
        <div className="grid grid-cols-2 gap-8 pt-2">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Parent / Guardian Verification</span>
            <div className="border-b border-dashed border-slate-400 pt-8"></div>
            <p className="text-[10px] text-slate-500 mt-1">Signature & Date</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Institutional Academic Attestation</span>
            <div className="border-b border-dashed border-slate-400 pt-8"></div>
            <p className="text-[10px] text-slate-500 mt-1">Curriculum Lead / Éclat BECE Academic Advisory</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-[10px] text-slate-500">
          <span>Éclat Academic Intelligence Engine • BECE Diagnostic Framework</span>
          <span>Confidential Academic Report • Verified Record</span>
        </div>
      </div>
    </div>
  );
}

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
  Printer
} from "lucide-react";
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

        const [quizRes, streakRes, assignRes] = await Promise.all([
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
        ]);

        if (quizRes.data) {
          setQuizResults(quizRes.data as QuizItem[]);
        }
        setStreak(streakRes.data?.current_streak || 0);

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
        trend: latest >= avg ? "up" : "down",
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
      {/* Header */}
      <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between print:mb-4">
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

        <div className="flex flex-wrap items-center gap-3 print:hidden">
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

      {/* Top 4 KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        {/* Overall Score */}
        <Card className="parent-panel rounded-[1.5rem] border border-border/60 bg-card/60 p-5 shadow-sm">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            Overall Score
          </div>
          <div className="mt-3 flex items-end gap-2">
            <div className="text-4xl font-black text-foreground">
              {totalQuizzes > 0 ? `${overallAvg}%` : "—"}
            </div>
            {totalQuizzes > 0 && (
              <div className={`mb-1 text-sm font-bold ${overallAvg >= 75 ? "text-emerald-500" : overallAvg >= 50 ? "text-amber-500" : "text-rose-500"}`}>
                {overallAvg >= 75 ? "+Good" : overallAvg >= 50 ? "Average" : "Needs Work"}
              </div>
            )}
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Based on {totalQuizzes} completed quizzes
          </div>
        </Card>

        {/* Assignments Progress */}
        <Card className="parent-panel rounded-[1.5rem] border border-border/60 bg-card/60 p-5 shadow-sm">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            Assignments Done
          </div>
          <div className="mt-3 flex items-end gap-2">
            <div className="text-4xl font-black text-foreground">
              {completedAssignments}
            </div>
            <div className="mb-1 text-sm font-bold text-muted-foreground">
              /{totalAssignments}
            </div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{
                width: `${totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0}%`,
              }}
            />
          </div>
        </Card>

        {/* Current Streak */}
        <Card className="parent-panel rounded-[1.5rem] border border-border/60 bg-card/60 p-5 shadow-sm">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            Current Streak
          </div>
          <div className="mt-3 flex items-end gap-2">
            <div className="text-4xl font-black text-foreground">
              {streak}
            </div>
            <div className="mb-1 text-sm font-bold text-amber-500">
              Days
            </div>
          </div>
          <div className="mt-2 text-xs font-semibold text-amber-500">
            {streak > 0 ? "🔥 Consistency on track" : "Complete today's quiz"}
          </div>
        </Card>

        {/* Areas of Concern */}
        <Card className="parent-panel rounded-[1.5rem] border border-border/60 bg-card/60 p-5 shadow-sm">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            Areas of Concern
          </div>
          <div className="mt-3 flex items-end gap-2">
            <div className={`text-4xl font-black ${weakSubjects.length > 0 ? "text-[#ff6a70]" : "text-emerald-500"}`}>
              {weakSubjects.length}
            </div>
            <div className="mb-1 text-sm font-bold text-muted-foreground">
              Subjects
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            {weakSubjects.length > 0 ? (
              <>
                <CircleAlert className="h-3.5 w-3.5 text-[#ff6a70]" />
                <span className="text-[#ff6a70] font-semibold">Action recommended</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-emerald-500 font-semibold">All subjects passing</span>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Main Grid: Trend Chart & Subject Breakdown */}
      <div className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        {/* Left Column: Trend & Quiz History */}
        <div className="space-y-6">
          <div className="rounded-[1.8rem] border border-border/60 bg-card/60 p-5 shadow-sm">
            <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-foreground">Score Trend History</h2>
                <p className="text-xs text-muted-foreground">Performance progression over recent quizzes</p>
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
              <div className="rounded-[1.5rem] border border-border/60 bg-background/30 p-5">
                <div className="mb-4 flex h-52 items-end gap-2 sm:gap-3">
                  {chronologicalScores.map((item, index) => (
                    <div key={index} className="flex flex-1 flex-col items-center justify-end gap-2 group relative">
                      {/* Tooltip on hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 bg-popover text-popover-foreground text-[10px] font-bold py-1 px-2 rounded-lg border shadow-md pointer-events-none whitespace-nowrap z-10">
                        {item.subject}: {item.score}%
                      </div>
                      <div
                        className="w-full rounded-t-xl bg-gradient-to-t from-primary/30 via-primary/70 to-primary transition-all duration-300 hover:brightness-110"
                        style={{ height: `${Math.max(item.score, 6)}%` }}
                      />
                      <span className="text-[10px] font-medium text-muted-foreground truncate w-full text-center">
                        {item.date || `#${index + 1}`}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground border-t border-border/40 pt-3">
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
          <div className="rounded-[1.8rem] border border-border/60 bg-card/60 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <h3 className="text-xl font-black text-foreground">Curriculum Insights & Recommendations</h3>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {subjectScores.length > 0 && (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500">Strongest Subject</span>
                  <p className="font-bold text-foreground text-base">
                    {subjectScores[0].name} ({subjectScores[0].score}%)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Shows outstanding grasp of concepts. Encourage child to aim for full marks in school tests.
                  </p>
                </div>
              )}

              {weakSubjects.length > 0 ? (
                <div className="rounded-2xl border border-[#ff6a70]/30 bg-[#ff6a70]/5 p-4 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#ff6a70]">Focus Needed</span>
                  <p className="font-bold text-foreground text-base">
                    {weakSubjects[0].name} ({weakSubjects[0].score}%)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Performance indicates gap in key sub-topics. Consider creating targeted practice drills in this subject.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500">Comprehensive Mastery</span>
                  <p className="font-bold text-foreground text-base">All subjects above target</p>
                  <p className="text-xs text-muted-foreground">
                    Great balance across syllabus. Keep practicing timed mock exams.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Subject Breakdown List */}
        <div className="space-y-6">
          <div className="rounded-[1.8rem] border border-border/60 bg-card/60 p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-foreground">Subject Mastery</h3>
                <p className="text-xs text-muted-foreground">Breakdown across all tested disciplines</p>
              </div>
              <Badge variant="outline" className="font-black text-xs">
                {subjectScores.length} Subjects
              </Badge>
            </div>

            {filteredSubjects.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No subjects found matching your search.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSubjects.map((sub) => (
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
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

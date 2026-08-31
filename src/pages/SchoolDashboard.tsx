import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { School, Users, TrendingUp, AlertCircle, FileDown, Plus, LogOut, Settings, Trophy, Copy, Check, Sparkles, BookOpen } from "lucide-react";
import { CompetitionLeaderboards, LeaderboardStudent } from "@/components/CompetitionLeaderboards";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { StudentReportDialog } from "@/components/StudentReportDialog";
import { ClassAnalyticsDialog, AnalyticsStudent, AnalyticsQuizResult } from "@/components/ClassAnalyticsDialog";
import { SchoolSettingsDialog, SchoolData } from "@/components/school/SchoolSettingsDialog";
import { SchoolAssignPracticeDialog } from "@/components/school/SchoolAssignPracticeDialog";
import { fetchLeaderboardData } from "@/utils/leaderboard";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import logoDark from "@/assets/logo-dark.png";
import logoLight from "@/assets/logo-light.png";

interface StudentRecord {
  id: string;
  user_id: string;
  class_year: "year_6" | "year_9" | null;
  is_premium: boolean | null;
  created_at: string;
  name: string;
  username: string;
  unique_id: string;
  avatar: string;
  avgScore: number;
  quizCount: number;
  progress: number;
  rank: number;
}

const avatars = ["👩‍🎓", "👨‍🎓", "👧", "👦", "🌟", "💫", "🎯", "🎓"];
const getEmojiAvatar = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatars[Math.abs(hash) % avatars.length];
};

export default function SchoolDashboard() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { theme } = useTheme();

  const logo = theme === "dark" ? logoLight : logoDark;

  // Loading & Base State
  const [isLoading, setIsLoading] = useState(true);
  const [school, setSchool] = useState<SchoolData | null>(null);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [quizResults, setQuizResults] = useState<AnalyticsQuizResult[]>([]);
  const [copiedCode, setCopiedCode] = useState(false);

  // Selection & Dialog States
  const [selectedCohort, setSelectedCohort] = useState<"year_6" | "year_9" | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [analyticsCohort, setAnalyticsCohort] = useState<"year_6" | "year_9">("year_9");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<{ id: string; name: string; class: string; avatar: string } | null>(null);

  // Competition Leaderboard Data
  const [monthlyLeaders, setMonthlyLeaders] = useState<LeaderboardStudent[]>([]);
  const [annualLeaders, setAnnualLeaders] = useState<LeaderboardStudent[]>([]);

  const loadSchoolDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/school-login");
        return;
      }

      // 1. Fetch School Record
      const { data: initialSchool, error: schoolError } = await supabase
        .from("schools")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (schoolError) throw schoolError;

      let schoolData = initialSchool;
      if (!schoolData) {
        // Auto-create school record if not present
        const { data: newSchool, error: insertError } = await supabase
          .from("schools")
          .insert({
            user_id: user.id,
            school_name: user.user_metadata?.full_name || user.user_metadata?.school_name || "My School",
          })
          .select("*")
          .single();

        if (insertError) throw insertError;
        schoolData = newSchool;
      }

      setSchool(schoolData as SchoolData);

      // 2. Fetch Linked Students & Profiles
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select(`
          id,
          user_id,
          class_year,
          is_premium,
          created_at
        `)
        .eq("school_id", schoolData.id);

      if (studentsError) throw studentsError;

      const rawStudents = studentsData || [];
      const studentIds = rawStudents.map((s) => s.id);
      const studentUserIds = rawStudents.map((s) => s.user_id);

      // 3. Fetch Profiles for Students
      let profileMap = new Map<string, { full_name: string | null; username: string | null; unique_id: string }>();
      if (studentUserIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name, username, unique_id")
          .in("id", studentUserIds);

        if (profilesData) {
          profileMap = new Map(profilesData.map((p) => [p.id, p]));
        }
      }

      // 4. Fetch Quiz Results for Linked Students
      let allQuizResults: AnalyticsQuizResult[] = [];
      if (studentIds.length > 0) {
        const { data: quizData, error: quizError } = await supabase
          .from("quiz_results")
          .select("id, student_id, score, subject, total_questions, correct_answers, completed_at")
          .in("student_id", studentIds)
          .order("completed_at", { ascending: false });

        if (!quizError && quizData) {
          allQuizResults = quizData as AnalyticsQuizResult[];
        }
      }
      setQuizResults(allQuizResults);

      // 5. Aggregate Student Metrics
      const studentQuizMap: Record<string, { totalScore: number; count: number }> = {};
      allQuizResults.forEach((q) => {
        if (!studentQuizMap[q.student_id]) {
          studentQuizMap[q.student_id] = { totalScore: 0, count: 0 };
        }
        studentQuizMap[q.student_id].totalScore += q.score;
        studentQuizMap[q.student_id].count += 1;
      });

      const parsedStudents: StudentRecord[] = rawStudents.map((s) => {
        const profile = profileMap.get(s.user_id);
        const name = profile?.full_name || profile?.username || "Student";
        const username = profile?.username || "";
        const uniqueId = profile?.unique_id || "";
        const quizStats = studentQuizMap[s.id];
        const avgScore = quizStats && quizStats.count > 0 ? Math.round(quizStats.totalScore / quizStats.count) : 0;
        const quizCount = quizStats?.count || 0;
        const progress = Math.min(100, Math.round((quizCount / 10) * 100));

        return {
          id: s.id,
          user_id: s.user_id,
          class_year: s.class_year,
          is_premium: s.is_premium,
          created_at: s.created_at,
          name,
          username,
          unique_id: uniqueId,
          avatar: getEmojiAvatar(s.id),
          avgScore,
          quizCount,
          progress,
          rank: 0,
        };
      });

      // Compute rank within school
      parsedStudents.sort((a, b) => b.avgScore - a.avgScore || b.quizCount - a.quizCount);
      parsedStudents.forEach((s, idx) => {
        s.rank = idx + 1;
      });

      setStudents(parsedStudents);

      // 6. Fetch Competition Leaderboard
      const leaderboardRes = await fetchLeaderboardData(user.id);
      setMonthlyLeaders(leaderboardRes.monthlyLeaders);
      setAnnualLeaders(leaderboardRes.annualLeaders);
    } catch (err: unknown) {
      console.error("Error loading school dashboard data:", err);
      toast.error("Failed to load school dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadSchoolDashboardData();
  }, [loadSchoolDashboardData]);

  const handleCopyCode = async () => {
    if (!school?.school_code) return;
    try {
      await navigator.clipboard.writeText(school.school_code);
      setCopiedCode(true);
      toast.success("School code copied to clipboard!");
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      toast.error("Failed to copy code");
    }
  };

  const handleExportCSV = (cohortStudents: StudentRecord[], cohortName: string) => {
    if (cohortStudents.length === 0) {
      toast.error("No student data to export");
      return;
    }

    const headers = ["Rank", "Name", "Username", "Class Cohort", "Average Score (%)", "Quizzes Completed"];
    const rows = cohortStudents.map((s) => [
      s.rank,
      `"${s.name.replace(/"/g, '""')}"`,
      s.username || "—",
      s.class_year === "year_6" ? "Year 6 / Primary 6" : "Year 9 / JSS 3",
      s.avgScore,
      s.quizCount,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${school?.school_name || "School"}_${cohortName}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Report downloaded successfully!");
  };

  // Cohort Breakdowns
  const year6Students = students.filter((s) => s.class_year === "year_6");
  const year9Students = students.filter((s) => s.class_year === "year_9" || !s.class_year);

  const calculateCohortAvg = (cohortStudents: StudentRecord[]) => {
    const active = cohortStudents.filter((s) => s.quizCount > 0);
    if (active.length === 0) return 0;
    return Math.round(active.reduce((acc, s) => acc + s.avgScore, 0) / active.length);
  };

  const year6Avg = calculateCohortAvg(year6Students);
  const year9Avg = calculateCohortAvg(year9Students);

  const classes = [
    {
      id: "year_9" as const,
      name: "Year 9 / JSS 3 (BECE Cohort)",
      badge: "BECE Exam Prep",
      studentsCount: year9Students.length,
      avgScore: year9Avg,
      students: year9Students,
      subjects: ["Mathematics", "English Language", "Basic Science", "Social Studies", "Business Studies"],
    },
    {
      id: "year_6" as const,
      name: "Year 6 / Primary 6 (Common Entrance)",
      badge: "Common Entrance",
      studentsCount: year6Students.length,
      avgScore: year6Avg,
      students: year6Students,
      subjects: ["Mathematics", "English Language", "Basic Science", "Social Studies"],
    },
  ];

  // Overview Stats
  const totalStudents = students.length;
  const activeStudents = students.filter((s) => s.quizCount > 0);
  const overallAvgScore = activeStudents.length > 0
    ? Math.round(activeStudents.reduce((acc, s) => acc + s.avgScore, 0) / activeStudents.length)
    : 0;
  const atRiskCount = activeStudents.filter((s) => s.avgScore < 65).length;
  const topPerformers = [...students].filter((s) => s.quizCount > 0).slice(0, 5);

  const currentSelectedStudents = selectedCohort === "year_6" ? year6Students : year9Students;
  const currentSelectedName = selectedCohort === "year_6" ? "Year 6 / Primary 6 (Common Entrance)" : "Year 9 / JSS 3 (BECE)";

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light/20 via-background to-accent-light/20 dashboard-theme">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="Éclat Logo"
              className="h-12 w-auto cursor-pointer"
              onClick={() => navigate("/")}
            />
            <span className="hidden sm:inline text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
              School Portal
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSettingsOpen(true)}
              className="gap-2 hidden sm:flex"
            >
              <Settings size={16} />
              Settings
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSettingsOpen(true)}
              className="sm:hidden"
            >
              <Settings size={20} />
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut} title="Sign Out">
              <LogOut size={20} />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {!selectedCohort ? (
          <>
            {/* Welcome Section */}
            <div className="mb-8 animate-fade-in flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black text-foreground mb-1 flex items-center gap-2">
                  <span>{school?.school_name || "School Dashboard"}</span>
                  <Sparkles className="h-6 w-6 text-accent" />
                </h2>
                <p className="text-muted-foreground text-sm">
                  Real-time exam preparation diagnostics, class cohorts, and national performance standings
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="hero"
                  onClick={() => setAssignOpen(true)}
                  disabled={students.length === 0}
                  className="gap-2 shadow-md"
                >
                  <Plus size={18} />
                  Assign Practice Quiz
                </Button>
              </div>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-slide-up">
              <Card className="border-2 hover:shadow-hover transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Exam Cohorts</p>
                      <p className="text-3xl font-black text-primary">2</p>
                      <p className="text-[11px] text-muted-foreground mt-1">Year 6 & Year 9</p>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                      <School size={28} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 hover:shadow-hover transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Enrolled Students</p>
                      <p className="text-3xl font-black text-primary">{totalStudents}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">{activeStudents.length} active quiz-takers</p>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                      <Users size={28} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 hover:shadow-hover transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">School Avg Score</p>
                      <p className="text-3xl font-black text-accent">{overallAvgScore}%</p>
                      <p className="text-[11px] text-muted-foreground mt-1">Across all completed quizzes</p>
                    </div>
                    <div className="p-3 bg-accent/10 rounded-2xl text-accent">
                      <TrendingUp size={28} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 hover:shadow-hover transition-all border-accent/40">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">At-Risk Students</p>
                      <p className="text-3xl font-black text-destructive">{atRiskCount}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">Scoring &lt; 65% average</p>
                    </div>
                    <div className="p-3 bg-destructive/10 rounded-2xl text-destructive">
                      <AlertCircle size={28} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Classes List */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-2 animate-scale-in">
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <div>
                      <CardTitle className="text-xl font-bold">Class Cohorts</CardTitle>
                      <CardDescription>Track performance across curriculum levels</CardDescription>
                    </div>
                    <Button
                      variant="hero"
                      size="sm"
                      onClick={() => setAssignOpen(true)}
                      disabled={students.length === 0}
                      className="gap-1.5"
                    >
                      <Plus size={16} />
                      Assign Quiz
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {classes.map((cls) => (
                      <div
                        key={cls.id}
                        className="p-5 border-2 rounded-2xl hover:border-primary hover:shadow-soft transition-all bg-card cursor-pointer"
                        onClick={() => setSelectedCohort(cls.id)}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-black text-lg text-foreground">{cls.name}</h4>
                              <Badge variant="secondary" className="text-xs font-semibold">
                                {cls.badge}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {cls.subjects.join(" • ")}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCohort(cls.id);
                              }}
                            >
                              View Students
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAnalyticsCohort(cls.id);
                                setAnalyticsOpen(true);
                              }}
                            >
                              View Analytics
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase">Students</p>
                            <p className="text-2xl font-black text-primary">{cls.studentsCount}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase">Cohort Avg Score</p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-hero rounded-full"
                                  style={{ width: `${cls.avgScore}%` }}
                                ></div>
                              </div>
                              <span className="text-lg font-black text-accent">{cls.avgScore}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* School Connection Code Card */}
                <Card className="border-2 border-primary/50 shadow-sm animate-scale-in">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <School className="h-5 w-5 text-primary" />
                      School Connection Code
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Share with your students so they can connect their accounts
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-4 bg-primary/10 rounded-2xl text-center border border-primary/20">
                      <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">
                        Unique School Code
                      </p>
                      <p className="text-3xl font-black text-primary tracking-widest font-mono">
                        {school?.school_code || "—"}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full gap-2 font-bold"
                      onClick={handleCopyCode}
                    >
                      {copiedCode ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      {copiedCode ? "Copied to Clipboard" : "Copy School Code"}
                    </Button>
                    <p className="text-[11px] text-muted-foreground text-center">
                      Students go to <strong>Settings → School Connection</strong> and enter this code.
                    </p>
                  </CardContent>
                </Card>

                {/* Top Performers Card */}
                <Card className="border-2 animate-scale-in">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Trophy className="text-accent h-5 w-5" />
                      School Top Performers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {topPerformers.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6">
                        No student quiz scores recorded yet.
                      </p>
                    ) : (
                      <div className="space-y-2.5">
                        {topPerformers.map((student, idx) => (
                          <div
                            key={student.id}
                            className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors cursor-pointer"
                            onClick={() => {
                              setSelectedStudent({
                                id: student.id,
                                name: student.name,
                                class: student.class_year === "year_6" ? "Year 6" : "Year 9",
                                avatar: student.avatar,
                              });
                              setReportOpen(true);
                            }}
                          >
                            <span className="text-2xl">{student.avatar}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm truncate">{student.name}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {student.class_year === "year_6" ? "Year 6" : "Year 9"} • #{idx + 1}
                              </p>
                            </div>
                            <span className="text-base font-black text-primary">{student.avgScore}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* School-Wide Competition Leaderboards */}
            <div className="mt-10 animate-fade-in">
              <div className="mb-4">
                <h3 className="text-2xl font-black text-foreground">National Competition Standings</h3>
                <p className="text-muted-foreground text-sm">
                  View how your students rank in national monthly and annual scholarship competitions
                </p>
              </div>
              <CompetitionLeaderboards
                monthlyLeaders={monthlyLeaders}
                annualLeaders={annualLeaders}
              />
            </div>
          </>
        ) : (
          <>
            {/* Class Detail View */}
            <Button
              variant="ghost"
              className="mb-6 gap-2 font-bold hover:bg-primary/10"
              onClick={() => setSelectedCohort(null)}
            >
              ← Back to Overview
            </Button>

            <div className="mb-8 animate-fade-in flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black text-foreground mb-1">{currentSelectedName}</h2>
                <p className="text-muted-foreground text-sm">
                  Manage enrolled students, assign targeted practice, and view detailed progress reports
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2.5">
                <Button
                  variant="hero"
                  onClick={() => setAssignOpen(true)}
                  disabled={currentSelectedStudents.length === 0}
                  className="gap-2"
                >
                  <Plus size={18} />
                  Assign Quiz
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExportCSV(currentSelectedStudents, selectedCohort)}
                  disabled={currentSelectedStudents.length === 0}
                  className="gap-2"
                >
                  <FileDown size={18} />
                  Export CSV Report
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setAnalyticsCohort(selectedCohort);
                    setAnalyticsOpen(true);
                  }}
                  className="gap-2"
                >
                  <TrendingUp size={18} />
                  Cohort Analytics
                </Button>
              </div>
            </div>

            {/* Students List */}
            <Card className="border-2 animate-scale-in">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Enrolled Students ({currentSelectedStudents.length})</CardTitle>
                <CardDescription>Click any student to view comprehensive diagnostic reports</CardDescription>
              </CardHeader>
              <CardContent>
                {currentSelectedStudents.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
                    <p className="font-bold text-foreground">No students in this cohort yet</p>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Share your school code <strong>{school?.school_code}</strong> with your students to have them connect.
                    </p>
                    <Button variant="outline" size="sm" onClick={handleCopyCode} className="gap-2">
                      <Copy className="h-4 w-4" /> Copy School Code
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {currentSelectedStudents.map((student) => (
                      <div
                        key={student.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-2 rounded-2xl hover:border-primary hover:shadow-soft transition-all bg-card gap-4"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl border border-primary/20">
                            {student.avatar}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-base text-foreground">{student.name}</h4>
                              {student.is_premium && (
                                <Badge className="bg-gradient-hero text-[10px] py-0">PRO</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {student.username ? `@${student.username}` : `ID: ${student.unique_id}`} • Rank #{student.rank}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                          <div>
                            <p className="text-xs text-muted-foreground uppercase font-semibold">Average</p>
                            <p className="text-lg font-black text-primary">{student.avgScore}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase font-semibold">Quizzes</p>
                            <p className="text-lg font-black text-accent">{student.quizCount}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedStudent({
                                id: student.id,
                                name: student.name,
                                class: currentSelectedName,
                                avatar: student.avatar,
                              });
                              setReportOpen(true);
                            }}
                          >
                            View Report
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Dialogs */}
      {selectedStudent && (
        <StudentReportDialog
          open={reportOpen}
          onOpenChange={setReportOpen}
          studentId={selectedStudent.id}
          studentName={selectedStudent.name}
          studentClass={selectedStudent.class}
          avatar={selectedStudent.avatar}
        />
      )}

      <ClassAnalyticsDialog
        open={analyticsOpen}
        onOpenChange={setAnalyticsOpen}
        className={analyticsCohort === "year_6" ? "Year 6 / Primary 6 (Common Entrance)" : "Year 9 / JSS 3 (BECE)"}
        students={(analyticsCohort === "year_6" ? year6Students : year9Students).map((s) => ({
          id: s.id,
          name: s.name,
          avatar: s.avatar,
        }))}
        quizResults={quizResults}
      />

      <SchoolSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        school={school}
        onSuccess={(updated) => {
          setSchool((prev) => (prev ? { ...prev, ...updated } : null));
        }}
      />

      {school && (
        <SchoolAssignPracticeDialog
          open={assignOpen}
          onOpenChange={setAssignOpen}
          schoolId={school.id}
          defaultCohort={selectedCohort || "year_9"}
          students={students.map((s) => ({
            id: s.id,
            name: s.name,
            class_year: s.class_year,
          }))}
          onSuccess={() => {
            loadSchoolDashboardData();
          }}
        />
      )}
    </div>
  );
}

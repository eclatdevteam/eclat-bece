import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { School, Users, TrendingUp, AlertCircle, FileDown, Plus, LogOut, Settings, Trophy, Copy, Check, Sparkles, BookOpen, ChevronRight, Flame, BarChart3, ShieldAlert } from "lucide-react";
import { CompetitionLeaderboards, LeaderboardStudent } from "@/components/CompetitionLeaderboards";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { StudentReportDialog } from "@/components/StudentReportDialog";
import { ClassAnalyticsDialog, AnalyticsQuizResult } from "@/components/ClassAnalyticsDialog";
import { SchoolSettingsDialog, SchoolData } from "@/components/school/SchoolSettingsDialog";
import { SchoolAssignPracticeDialog } from "@/components/school/SchoolAssignPracticeDialog";
import { CurriculumWeaknessHeatmap, SchoolTopicMasteryRecord } from "@/components/school/CurriculumWeaknessHeatmap";
import { ClassroomLeaderboardView, EnrichedStudentRecord } from "@/components/school/ClassroomLeaderboardView";
import { fetchLeaderboardData } from "@/utils/leaderboard";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import logoDark from "@/assets/logo-dark.png";
import logoLight from "@/assets/logo-light.png";

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
  const [students, setStudents] = useState<EnrichedStudentRecord[]>([]);
  const [topicMastery, setTopicMastery] = useState<SchoolTopicMasteryRecord[]>([]);
  const [quizResults, setQuizResults] = useState<AnalyticsQuizResult[]>([]);
  const [copiedCode, setCopiedCode] = useState(false);

  // Tabs State
  const [mainTab, setMainTab] = useState<"overview" | "leaderboard" | "heatmap" | "competitions">("overview");

  // Selection & Dialog States
  const [selectedCohort, setSelectedCohort] = useState<"year_6" | "year_9" | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [analyticsCohort, setAnalyticsCohort] = useState<"year_6" | "year_9">("year_9");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignInitialSubject, setAssignInitialSubject] = useState<string | undefined>(undefined);
  const [assignInitialTopic, setAssignInitialTopic] = useState<string | undefined>(undefined);
  const [selectedStudent, setSelectedStudent] = useState<{ id: string; name: string; class: string; avatar: string } | null>(null);

  // Competition Leaderboard Data
  const [weeklyLeaders, setWeeklyLeaders] = useState<LeaderboardStudent[]>([]);
  const [monthlyLeaders, setMonthlyLeaders] = useState<LeaderboardStudent[]>([]);
  const [annualLeaders, setAnnualLeaders] = useState<LeaderboardStudent[]>([]);
  const [mathLeaders, setMathLeaders] = useState<LeaderboardStudent[]>([]);
  const [englishLeaders, setEnglishLeaders] = useState<LeaderboardStudent[]>([]);

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

      // 2. Fetch Linked Students
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

      // 4. Fetch Quiz Results
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

      // 5. Fetch Gamification Profiles
      const gamificationMap = new Map<string, any>();
      if (studentIds.length > 0) {
        const { data: gamificationProfiles } = await supabase
          .from("student_gamification_profile" as any)
          .select("student_id, lifetime_ep, current_level, weekly_ep, league_tier, current_streak")
          .in("student_id", studentIds);

        (gamificationProfiles || []).forEach((gp: any) => {
          gamificationMap.set(gp.student_id, gp);
        });
      }

      // 6. Fetch Topic Mastery Records
      let fetchedTopicMastery: SchoolTopicMasteryRecord[] = [];
      if (studentIds.length > 0) {
        const { data: masteryRecords } = await supabase
          .from("student_topic_mastery" as any)
          .select("student_id, subject, topic, rolling_accuracy, status, total_attempted")
          .in("student_id", studentIds);

        fetchedTopicMastery = (masteryRecords || []).map((tm: any) => ({
          student_id: tm.student_id,
          subject: tm.subject,
          topic: tm.topic,
          rolling_accuracy: Number(tm.rolling_accuracy || 0),
          status: tm.status || "developing",
          total_attempted: Number(tm.total_attempted || 0),
        }));
      }
      setTopicMastery(fetchedTopicMastery);

      // Aggregate Topic Mastery per Student
      const studentMasteryMap = new Map<string, { mastered: number; weak: number; total: number; accuracySum: number }>();
      fetchedTopicMastery.forEach((tm) => {
        if (!studentMasteryMap.has(tm.student_id)) {
          studentMasteryMap.set(tm.student_id, { mastered: 0, weak: 0, total: 0, accuracySum: 0 });
        }
        const entry = studentMasteryMap.get(tm.student_id)!;
        entry.total++;
        entry.accuracySum += tm.rolling_accuracy;
        if (tm.status === "mastered" || tm.rolling_accuracy >= 85) entry.mastered++;
        else if (tm.status === "weak" || tm.rolling_accuracy < 60) entry.weak++;
      });

      // 7. Aggregate Student Metrics
      const studentQuizMap: Record<string, { totalScore: number; count: number }> = {};
      allQuizResults.forEach((q) => {
        if (!studentQuizMap[q.student_id]) {
          studentQuizMap[q.student_id] = { totalScore: 0, count: 0 };
        }
        studentQuizMap[q.student_id].totalScore += q.score;
        studentQuizMap[q.student_id].count += 1;
      });

      const parsedStudents: EnrichedStudentRecord[] = rawStudents.map((s) => {
        const profile = profileMap.get(s.user_id);
        const name = profile?.full_name || profile?.username || "Student";
        const username = profile?.username || "";
        const uniqueId = profile?.unique_id || "";
        const quizStats = studentQuizMap[s.id];
        const avgScore = quizStats && quizStats.count > 0 ? Math.round(quizStats.totalScore / quizStats.count) : 0;
        const quizCount = quizStats?.count || 0;

        const gp = gamificationMap.get(s.id);
        const sm = studentMasteryMap.get(s.id);
        const lifetime_ep = Number(gp?.lifetime_ep || 0);
        const current_level = Number(gp?.current_level || 1);
        const weekly_ep = Number(gp?.weekly_ep || 0);
        const league_tier = Number(gp?.league_tier || 1);
        const current_streak = Number(gp?.current_streak || 0);
        const mastered_topics_count = sm?.mastered || 0;
        const weak_topics_count = sm?.weak || 0;
        const mastery_percentage = sm && sm.total > 0 ? Math.round(sm.accuracySum / sm.total) : avgScore;

        return {
          id: s.id,
          user_id: s.user_id,
          class_year: s.class_year,
          is_premium: s.is_premium,
          name,
          username,
          unique_id: uniqueId,
          avatar: getEmojiAvatar(s.id),
          avgScore,
          quizCount,
          lifetime_ep,
          current_level,
          weekly_ep,
          league_tier,
          current_streak,
          mastered_topics_count,
          weak_topics_count,
          mastery_percentage,
        };
      });

      // Rank students: Sort by lifetime EP (primary) and avgScore (secondary)
      parsedStudents.sort((a, b) => b.lifetime_ep - a.lifetime_ep || b.avgScore - a.avgScore);
      setStudents(parsedStudents);

      // 8. Fetch Competition Leaderboard
      const leaderboardRes = await fetchLeaderboardData(user.id);
      setWeeklyLeaders(leaderboardRes.weeklyLeaders);
      setMonthlyLeaders(leaderboardRes.monthlyLeaders);
      setAnnualLeaders(leaderboardRes.annualLeaders);
      setMathLeaders(leaderboardRes.mathLeaders);
      setEnglishLeaders(leaderboardRes.englishLeaders);
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

  const handleExportCSV = (cohortStudents: EnrichedStudentRecord[], cohortName: string) => {
    if (cohortStudents.length === 0) {
      toast.error("No student data to export");
      return;
    }

    const headers = [
      "Rank",
      "Name",
      "Username",
      "Class Cohort",
      "Level",
      "Lifetime EP",
      "Active Streak (days)",
      "Curriculum Mastery (%)",
      "Average Quiz Score (%)",
      "Quizzes Completed",
    ];
    const rows = cohortStudents.map((s, idx) => [
      idx + 1,
      `"${s.name.replace(/"/g, '""')}"`,
      s.username || "—",
      s.class_year === "year_6" ? "Year 6 / Primary 6" : "Year 9 / JSS 3",
      s.current_level,
      s.lifetime_ep,
      s.current_streak,
      s.mastery_percentage,
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

  const handleAssignFocusPractice = (subject: string, topic: string, cohort: "year_6" | "year_9") => {
    setAssignInitialSubject(subject);
    setAssignInitialTopic(topic);
    setSelectedCohort(cohort);
    setAssignOpen(true);
  };

  // Cohort Breakdowns
  const year6Students = students.filter((s) => s.class_year === "year_6");
  const year9Students = students.filter((s) => s.class_year === "year_9" || !s.class_year);

  const calculateCohortAvg = (cohortStudents: EnrichedStudentRecord[]) => {
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
  const atRiskCount = activeStudents.filter((s) => s.avgScore < 65 || s.weak_topics_count > 0).length;

  // Top 3 Scholars by Lifetime EP
  const top3Scholars = useMemo(() => {
    return [...students]
      .filter((s) => s.lifetime_ep > 0 || s.quizCount > 0)
      .sort((a, b) => b.lifetime_ep - a.lifetime_ep || b.avgScore - a.avgScore)
      .slice(0, 3);
  }, [students]);

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
              School Hub &amp; Classroom Portal
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSettingsOpen(true)}
              className="gap-2 hidden sm:flex font-bold"
            >
              <Settings size={16} />
              Settings
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 font-bold"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Log out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {!selectedCohort ? (
          <>
            {/* School Greeting & Subtitle */}
            <div className="mb-6 animate-fade-in flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
                  {school?.school_name || "School Dashboard"}
                </h1>
                <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                  Track classroom mastery, diagnose curriculum weaknesses, and motivate students with Four-Pillar gamification.
                </p>
              </div>
            </div>

            {/* Quick Action & School Connection Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-background to-accent/10 border-2 border-primary/20 shadow-sm animate-fade-in mb-6">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-background border border-primary/30 shadow-xs">
                  <School className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold text-muted-foreground">School Code:</span>
                  <span className="font-mono font-black text-sm tracking-wider text-primary">
                    {school?.school_code || "—"}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs font-bold rounded-lg border-primary/30 hover:bg-primary/10"
                  onClick={handleCopyCode}
                >
                  {copiedCode ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedCode ? "Copied" : "Copy Code"}
                </Button>
                <span className="hidden md:inline text-xs text-muted-foreground">
                  Share code with students to link them to your institutional portal
                </span>
              </div>

              <Button
                variant="hero"
                size="sm"
                onClick={() => {
                  setAssignInitialSubject(undefined);
                  setAssignInitialTopic(undefined);
                  setAssignOpen(true);
                }}
                disabled={students.length === 0}
                className="gap-1.5 h-9 font-bold px-5 bg-gradient-to-r from-primary to-accent shadow-md"
              >
                <Plus size={16} />
                Assign Practice Quiz
              </Button>
            </div>

            {/* Hub Primary Navigation Tabs */}
            <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as any)} className="w-full mb-8">
              <TabsList className="mb-6 h-11 p-1 bg-muted/70 rounded-xl border border-border/50 grid grid-cols-2 md:grid-cols-4 w-full">
                <TabsTrigger value="overview" className="gap-2 font-bold text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:shadow-xs">
                  <School size={16} /> Overview
                </TabsTrigger>
                <TabsTrigger value="leaderboard" className="gap-2 font-bold text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:shadow-xs">
                  <Trophy size={16} /> Classroom Hub
                </TabsTrigger>
                <TabsTrigger value="heatmap" className="gap-2 font-bold text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:shadow-xs relative">
                  <Flame size={16} className="text-amber-500" /> Curriculum Heatmap
                  {topicMastery.some((t) => t.status === "weak" || t.rolling_accuracy < 60) && (
                    <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                  )}
                </TabsTrigger>
                <TabsTrigger value="competitions" className="gap-2 font-bold text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:shadow-xs">
                  <Sparkles size={16} className="text-accent" /> National Standings
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: OVERVIEW */}
              <TabsContent value="overview" className="space-y-8 mt-0 animate-fade-in">
                {/* Overview KPI Cards */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border-2 hover:shadow-hover transition-all">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Exam Cohorts</p>
                          <p className="text-3xl font-black text-foreground">2</p>
                          <p className="text-[11px] text-muted-foreground mt-1">Year 6 &amp; Year 9 levels</p>
                        </div>
                        <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                          <School size={26} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 hover:shadow-hover transition-all">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Enrolled Scholars</p>
                          <p className="text-3xl font-black text-primary">{totalStudents}</p>
                          <p className="text-[11px] text-muted-foreground mt-1">{activeStudents.length} active quiz-takers</p>
                        </div>
                        <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                          <Users size={26} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 hover:shadow-hover transition-all">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">School Avg Score</p>
                          <p className="text-3xl font-black text-accent">{overallAvgScore}%</p>
                          <p className="text-[11px] text-muted-foreground mt-1">Across all completed quizzes</p>
                        </div>
                        <div className="p-3 bg-accent/10 rounded-2xl text-accent">
                          <TrendingUp size={26} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 hover:shadow-hover transition-all border-destructive/30">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Intervention Needed</p>
                          <p className="text-3xl font-black text-destructive">{atRiskCount}</p>
                          <p className="text-[11px] text-muted-foreground mt-1">Students with weak topics</p>
                        </div>
                        <div className="p-3 bg-destructive/10 rounded-2xl text-destructive">
                          <AlertCircle size={26} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* 2-Column Balanced Architecture: Class Cohorts Grid vs Top 3 Scholars */}
                <div className="grid lg:grid-cols-3 gap-8">
                  {/* Class Cohorts */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-black text-foreground flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-primary" />
                          Academic Class Cohorts
                        </h3>
                        <p className="text-xs text-muted-foreground">Curriculum cohorts and exam readiness tracking</p>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      {classes.map((cls) => (
                        <Card
                          key={cls.id}
                          className="border-2 rounded-2xl hover:border-primary hover:shadow-md transition-all bg-card flex flex-col justify-between"
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <Badge variant="outline" className="text-[11px] font-bold border-primary/40 text-primary mb-1.5">
                                  {cls.badge}
                                </Badge>
                                <CardTitle className="text-base font-bold text-foreground leading-snug">{cls.name}</CardTitle>
                              </div>
                            </div>
                            <CardDescription className="text-xs text-muted-foreground line-clamp-1 mt-1">
                              {cls.subjects.join(" • ")}
                            </CardDescription>
                          </CardHeader>

                          <CardContent className="space-y-4 pt-0">
                            {/* Stat Pills */}
                            <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/40">
                              <div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Enrolled</p>
                                <p className="text-lg font-black text-primary">{cls.studentsCount} scholars</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Cohort Avg</p>
                                <p className="text-lg font-black text-accent">{cls.avgScore}%</p>
                              </div>
                            </div>

                            {/* Score Progress Bar */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                                <span>Curriculum Progress</span>
                                <span className="font-bold text-foreground">{cls.avgScore}%</span>
                              </div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-hero rounded-full transition-all duration-500"
                                  style={{ width: `${cls.avgScore}%` }}
                                />
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40">
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full text-xs font-bold h-9"
                                onClick={() => setSelectedCohort(cls.id)}
                              >
                                View Students
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                className="w-full text-xs font-bold h-9"
                                onClick={() => {
                                  setAnalyticsCohort(cls.id);
                                  setAnalyticsOpen(true);
                                }}
                              >
                                Class Analytics
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* School Top Performers */}
                  <div className="space-y-4">
                    <Card className="border-2 rounded-2xl shadow-sm bg-card flex flex-col h-full">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between gap-2">
                          <CardTitle className="text-base font-bold flex items-center gap-2">
                            <Trophy className="text-accent h-5 w-5" />
                            Top Scholars (Lifetime EP)
                          </CardTitle>
                          <Badge variant="secondary" className="text-[10px] font-bold">
                            School Top 3
                          </Badge>
                        </div>
                        <CardDescription className="text-xs">
                          Leading school scholars ranked by cumulative Éclat Points
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="flex-1 flex flex-col justify-between space-y-3">
                        {top3Scholars.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-10 text-center">
                            <span className="text-3xl mb-2">🎯</span>
                            <p className="text-xs text-muted-foreground font-semibold">No quiz scores recorded yet.</p>
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            {top3Scholars.map((student, idx) => {
                              const medalIcons = ["🥇", "🥈", "🥉"];
                              const medalStyles = [
                                "border-accent/60 bg-accent/10 shadow-xs",
                                "border-slate-400/40 bg-slate-400/5",
                                "border-amber-700/30 bg-amber-700/5",
                              ];
                              return (
                                <div
                                  key={student.id}
                                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all hover:scale-[1.02] cursor-pointer ${medalStyles[idx] || "border-border bg-card"}`}
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
                                  <div className="relative flex-shrink-0">
                                    <span className="text-2xl">{student.avatar}</span>
                                    <span className="absolute -top-2 -right-2 text-sm">{medalIcons[idx]}</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm text-foreground truncate">{student.name}</p>
                                    <p className="text-[11px] font-semibold text-muted-foreground">
                                      {student.class_year === "year_6" ? "Year 6 / Pri 6" : "Year 9 / JSS 3"} • Lvl {student.current_level}
                                    </p>
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    <div className="text-base font-black text-primary leading-tight flex items-baseline justify-end gap-1">
                                      <span>{student.lifetime_ep.toLocaleString()}</span>
                                      <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">EP</span>
                                    </div>
                                    <p className="text-[10px] font-bold text-muted-foreground mt-0.5">
                                      {student.avgScore}% avg • {student.quizCount} tests
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        <p className="text-[10px] text-center text-muted-foreground border-t border-border/30 pt-2">
                          Click any scholar to inspect their complete diagnostic report.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* TAB 2: CLASSROOM LEADERBOARD VIEW */}
              <TabsContent value="leaderboard" className="mt-0 animate-fade-in">
                <ClassroomLeaderboardView
                  students={students}
                  onSelectStudent={(s) => {
                    setSelectedStudent({
                      id: s.id,
                      name: s.name,
                      class: s.class_year === "year_6" ? "Year 6" : "Year 9",
                      avatar: s.avatar,
                    });
                    setReportOpen(true);
                  }}
                />
              </TabsContent>

              {/* TAB 3: CURRICULUM WEAKNESS HEATMAP */}
              <TabsContent value="heatmap" className="mt-0 animate-fade-in">
                <CurriculumWeaknessHeatmap
                  topicMastery={topicMastery}
                  students={students.map((s) => ({
                    id: s.id,
                    name: s.name,
                    class_year: s.class_year,
                  }))}
                  onAssignFocusPractice={handleAssignFocusPractice}
                />
              </TabsContent>

              {/* TAB 4: NATIONAL COMPETITIONS */}
              <TabsContent value="competitions" className="mt-0 animate-fade-in">
                <CompetitionLeaderboards
                  weeklyLeaders={weeklyLeaders}
                  monthlyLeaders={monthlyLeaders}
                  annualLeaders={annualLeaders}
                  mathLeaders={mathLeaders}
                  englishLeaders={englishLeaders}
                />
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <>
            {/* Class Detail View */}
            <Button
              variant="ghost"
              className="mb-6 gap-2 font-bold hover:bg-primary/10"
              onClick={() => setSelectedCohort(null)}
            >
              ← Back to School Overview
            </Button>

            <div className="mb-8 animate-fade-in flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black text-foreground mb-1">{currentSelectedName}</h2>
                <p className="text-muted-foreground text-sm">
                  Manage enrolled scholars, monitor Four-Pillar gamification progress, and assign targeted practice.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2.5">
                <Button
                  variant="hero"
                  onClick={() => {
                    setAssignInitialSubject(undefined);
                    setAssignInitialTopic(undefined);
                    setAssignOpen(true);
                  }}
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
                <CardTitle className="text-xl font-bold">Enrolled Scholars ({currentSelectedStudents.length})</CardTitle>
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
                    {currentSelectedStudents.map((student, idx) => (
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
                              <Badge variant="outline" className="text-[10px] font-bold border-primary/30 text-primary">
                                Lvl {student.current_level}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {student.username ? `@${student.username}` : `ID: ${student.unique_id}`} • Rank #{idx + 1}
                              {student.current_streak > 0 && ` • 🔥 ${student.current_streak}d streak`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                          <div>
                            <p className="text-xs text-muted-foreground uppercase font-semibold">Éclat Points</p>
                            <p className="text-lg font-black text-primary">{student.lifetime_ep.toLocaleString()} EP</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase font-semibold">Mastery</p>
                            <p className="text-lg font-black text-emerald-600">{student.mastery_percentage}%</p>
                          </div>
                          <div className="hidden sm:block">
                            <p className="text-xs text-muted-foreground uppercase font-semibold">Average</p>
                            <p className="text-lg font-black text-accent">{student.avgScore}%</p>
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
      </main>

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
          onOpenChange={(isOpen) => {
            setAssignOpen(isOpen);
            if (!isOpen) {
              setAssignInitialSubject(undefined);
              setAssignInitialTopic(undefined);
            }
          }}
          schoolId={school.id}
          defaultCohort={selectedCohort || "year_9"}
          initialSubject={assignInitialSubject}
          initialTopic={assignInitialTopic}
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

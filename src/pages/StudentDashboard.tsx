import { useState, useEffect, useCallback, useRef } from "react";
import { BookOpen, Trophy, TrendingUp, Target, Flame, LogOut, Settings, Menu, Lock, ShieldCheck, Swords } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PracticeAssignment, Assignment } from "@/components/PracticeAssignment";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRank } from "@/contexts/RankContext";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "next-themes";
import logoDark from "@/assets/logo-dark.png";
import logoLight from "@/assets/logo-light.png";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { monthlyRank, monthlyPoints, monthlyLeaders, annualLeaders } = useRank();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState("subject");
  const [userName, setUserName] = useState("Student");
  const [classYear, setClassYear] = useState<string | null>(null);
  const [subjectCounts, setSubjectCounts] = useState<Record<string, number>>({});
  const [currentStreak, setCurrentStreak] = useState(0);
  const [completedQuizzesCount, setCompletedQuizzesCount] = useState(0);
  const [totalQuestionsAnswered, setTotalQuestionsAnswered] = useState(0);
  const [averageScore, setAverageScore] = useState(0);
  const [totalWins, setTotalWins] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(true);

  // Abort controller ref for cleanup on logout/unmount
  const abortControllerRef = useRef<AbortController | null>(null);

  // Calculate rank difference from 10
  const rankDifference = monthlyRank > 10 ? monthlyRank - 10 : 0;

  const logo = theme === "dark" ? logoLight : logoDark;

  const fetchUserData = useCallback(async (signal?: AbortSignal) => {
    if (!user) return;

    try {
      // Fetch user name
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      if (signal?.aborted) return;
      if (profileData?.full_name) {
        const firstName = profileData.full_name.split(" ")[0];
        setUserName(firstName);
      }

      // Fetch student's class year and premium status
      const { data: studentData } = await supabase
        .from("students")
        .select("class_year, is_premium")
        .eq("user_id", user.id)
        .single();

      if (signal?.aborted) return;
      if (studentData) {
        if (studentData.class_year) setClassYear(studentData.class_year);
        setIsPremium(!!studentData.is_premium);
      }
    } catch (error) {
      if (signal?.aborted) return;
      console.error("Error fetching user data:", error);
    }
  }, [user]);

  const fetchQuestionCounts = useCallback(async (signal?: AbortSignal) => {
    if (!user) return;

    try {
      // First get the student's class year
      const { data: studentData } = await supabase
        .from("students")
        .select("class_year")
        .eq("user_id", user.id)
        .single();

      if (signal?.aborted) return;
      if (!studentData?.class_year) return;

      // Determine which table to query based on class year
      const tableName: "quiz_questions_year6" | "quiz_questions_year9" = studentData.class_year === 'year_6'
        ? 'quiz_questions_year6'
        : 'quiz_questions_year9';

      const subjectsToFetch = ["Mathematics", "English Language", "Basic Science", "Social Studies"];
      const counts: Record<string, number> = {};
      
      await Promise.all(
        subjectsToFetch.map(async (subject) => {
          if (signal?.aborted) return;
          const { count, error } = await supabase
            .from(tableName)
            .select("*", { count: 'exact', head: true })
            .eq("subject", subject);
          
          if (!error && count !== null) {
            counts[subject] = count;
          }
        })
      );

      if (signal?.aborted) return;
      setSubjectCounts(counts);
    } catch (error) {
      if (signal?.aborted) return;
      console.error("Error fetching question counts:", error);
    }
  }, [user]);

  const fetchStreak = useCallback(async (signal?: AbortSignal) => {
    if (!user) return;

    // Abort previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const { data: studentData } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (signal?.aborted) return;
      if (!studentData?.id) return;

      const { data: streakData } = await supabase
        .from("student_streaks")
        .select("current_streak")
        .eq("student_id", studentData.id)
        .maybeSingle();

      if (signal?.aborted) return;
      if (streakData) {
        setCurrentStreak(streakData.current_streak);
      }
    } catch (error) {
      if (signal?.aborted) return;
      console.error("Error fetching streak:", error);
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, [user]);

  const fetchProgressStats = useCallback(async (signal?: AbortSignal) => {
    if (!user) return;

    try {
      const { data: studentData } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (signal?.aborted) return;
      if (!studentData?.id) return;

      const { data: quizResults } = await supabase
        .from("quiz_results")
        .select("total_questions, score")
        .eq("student_id", studentData.id);

      if (signal?.aborted) return;
      if (!quizResults) return;

      setCompletedQuizzesCount(quizResults.length);

      if (quizResults.length > 0) {
        const questionsAnswered = quizResults.reduce((sum, result) => sum + result.total_questions, 0);
        const average = quizResults.reduce((sum, result) => sum + result.score, 0) / quizResults.length;
        const wins = quizResults.filter((result) => result.score >= 80).length;

        if (signal?.aborted) return;
        setTotalQuestionsAnswered(questionsAnswered);
        setAverageScore(Math.round(average));
        setTotalWins(wins);
      } else {
        if (signal?.aborted) return;
        setTotalQuestionsAnswered(0);
        setAverageScore(0);
        setTotalWins(0);
      }
    } catch (error) {
      if (signal?.aborted) return;
      console.error("Error fetching progress stats:", error);
    }
  }, [user]);

  const fetchAssignments = useCallback(async (signal?: AbortSignal) => {
    if (!user) return;

    setIsLoadingAssignments(true);
    try {
      // First get student ID
      const { data: studentData } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (signal?.aborted) return;
      if (!studentData?.id) return;

      const { data, error } = await supabase
        .from("practice_assignments")
        .select("*")
        .eq("student_id", studentData.id)
        .order("created_at", { ascending: false });

      if (signal?.aborted) return;
      if (error) throw error;
      setAssignments(data as Assignment[]);
    } catch (error) {
      if (signal?.aborted) return;
      console.error("Error fetching assignments:", error);
    } finally {
      setIsLoadingAssignments(false);
    }
  }, [user]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchUserData(),
      fetchQuestionCounts(),
      fetchStreak(),
      fetchProgressStats(),
      fetchAssignments()
    ]);
    setRefreshing(false);
  }, [fetchAssignments, fetchProgressStats, fetchQuestionCounts, fetchStreak, fetchUserData]);

  useEffect(() => {
    // Create abort controller for this effect
    const controller = new AbortController();
    const signal = controller.signal;

    fetchUserData(signal);
    fetchQuestionCounts(signal);
    fetchStreak(signal);
    fetchProgressStats(signal);
    fetchAssignments(signal);

    // Cleanup: abort all requests on unmount/logout
    return () => {
      controller.abort();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [fetchAssignments, fetchProgressStats, fetchQuestionCounts, fetchStreak, fetchUserData]);

  // Cleanup on logout - abort requests and reset state
  useEffect(() => {
    if (!user) {
      // Abort any in-flight requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      
      // Reset all state
      setUserName("Student");
      setClassYear(null);
      setSubjectCounts({});
      setCurrentStreak(0);
      setCompletedQuizzesCount(0);
      setTotalQuestionsAnswered(0);
      setAverageScore(0);
      setTotalWins(0);
      setIsPremium(false);
      setAssignments([]);
      setIsLoadingAssignments(true);
    }
  }, [user]);

  // Pull to refresh logic
  useEffect(() => {
    let startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY;

      // Only trigger if at top of page and pulling down significantly
      if (window.scrollY === 0 && diff > 100 && !refreshing) {
        handleRefresh();
      }
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [handleRefresh, refreshing]);

  const subjects = [
    { name: "Mathematics", icon: "📐", difficulty: "Core Subject", questions: subjectCounts["Mathematics"] || 0, isPremium: false },
    { name: "English Language", icon: "📚", difficulty: "Core Subject", questions: subjectCounts["English Language"] || 0, isPremium: false },
    { name: "Basic Science", icon: "🔬", difficulty: "Core Subject", questions: subjectCounts["Basic Science"] || 0, isPremium: true },
    { name: "Social Studies", icon: "🌍", difficulty: "Core Subject", questions: subjectCounts["Social Studies"] || 0, isPremium: true },
  ];

  const topics = [
    { name: "Number & Numeration", subject: "Mathematics", icon: "➗", questions: 420, isPremium: false },
    { name: "Comprehension Passages", subject: "English", icon: "📖", questions: 380, isPremium: false },
    { name: "Living Things", subject: "Basic Science", icon: "🦋", questions: 325, isPremium: true },
    { name: "Grammar & Composition", subject: "English", icon: "✍️", questions: 290, isPremium: false },
    { name: "Algebraic Processes", subject: "Mathematics", icon: "📐", questions: 285, isPremium: true },
    { name: "Nigerian History", subject: "Social Studies", icon: "📜", questions: 245, isPremium: true },
  ];

  const badges = [
    { name: "First Quiz", icon: "🎯", earned: true },
    { name: "10 Quiz Master", icon: "⭐", earned: true },
    { name: "5-Day Streak", icon: "🔥", earned: true },
    { name: "Top 10%", icon: "👑", earned: false },
  ];

  const earnedBadgesCount = [
    completedQuizzesCount > 0,
    completedQuizzesCount >= 10,
    currentStreak >= 5,
    totalWins > 0,
    averageScore >= 80,
  ].filter(Boolean).length;

  const displayRank = monthlyRank ?? Math.max(
    1,
    100 - Math.round((averageScore * 0.6) + (currentStreak * 2) + (totalWins * 4) + (completedQuizzesCount * 1.5))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light/20 via-background to-accent-light/20 overflow-hidden">
      {refreshing && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-primary text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          Refreshing...
        </div>
      )}

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Welcome Section - Mobile Optimized */}
        <div className="mb-10 sm:mb-12 md:animate-fade-in">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:gap-6">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                Welcome back, {userName}! <span className="inline-block">🎉</span>
              </h2>
              {classYear && (
                <p className="text-base sm:text-lg font-semibold text-primary mb-2">
                  {classYear === 'year_6' ? 'Year 6 • Common Entrance' : 'Year 9 • BECE'}
                </p>
              )}
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
                Ready to ace your exams? <span className="hidden sm:inline">You're {rankDifference} ranks away from Top 10 nationally!</span>
                <span className="sm:hidden">Keep practicing!</span>
              </p>
            </div>

            <Card className="w-full xl:w-[420px] bg-card border-border/60 shadow-soft rounded-2xl overflow-hidden">
              <CardContent className="p-5 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border/60">
                  <div className="flex items-center gap-3 py-4 sm:py-0 sm:pr-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
                      <Flame size={20} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground leading-none">{currentStreak}</p>
                      <p className="text-sm text-muted-foreground mt-1">Day Streak</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 py-4 sm:py-0 sm:px-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 border border-purple-500/20">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground leading-none">
                        {monthlyPoints}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Points
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 py-4 sm:py-0 sm:pl-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-500/10 text-yellow-600 border border-yellow-500/20">
                      <Trophy size={20} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground leading-none">Rank {displayRank}</p>
                      <p className="text-sm text-muted-foreground mt-1">Monthly Rank</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Stats - Mobile Optimized */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 mt-2 sm:mt-3 animate-slide-up overflow-x-hidden">
          <Card className="bg-gradient-to-br from-primary-light/30 to-primary-light/10 border-primary-light/40 shadow-soft hover:shadow-hover transition-all cursor-pointer overflow-hidden" onClick={() => navigate("/dashboard/student/practice")}>
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Start Questions</p>
                  <p className="text-3xl font-bold text-primary">Start</p>
                </div>
                <Target className="text-primary" size={32} />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-primary-light/20 to-background border-primary-light/30 shadow-soft hover:shadow-hover transition-all cursor-pointer overflow-hidden" onClick={() => navigate("/dashboard/student/duel-of-minds")}>
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Duel of Minds</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-black text-primary">Compete</p>
                    <span className="text-xs font-semibold text-primary bg-purple-500/10 px-2 py-1 rounded-full">Challenge</span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className="relative">
                    <Swords className="text-primary" size={32} />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary/60 rounded-full animate-pulse" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-primary-light/20 to-background border-primary-light/30 shadow-soft hover:shadow-hover transition-all cursor-pointer overflow-hidden" onClick={() => navigate("/dashboard/student/leaderboard")}>
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">See Rankings</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-black text-primary">View</p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className="relative">
                    <Trophy className="text-accent" size={32} />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-10 opacity-[0.07]" />

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6 lg:space-y-10">
            {/* Practice Section */}
            <Card className="bg-gradient-to-br from-card to-background border-border/50 shadow-soft md:animate-scale-in max-w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="text-primary" size={24} />
                  Practice Zone
                </CardTitle>
                <CardDescription>Choose your learning path</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6">
                    <TabsTrigger value="subject" className="text-xs sm:text-sm">
                      <BookOpen className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="hidden xs:inline">By </span>Subject
                    </TabsTrigger>
                    <TabsTrigger value="topic" className="text-xs sm:text-sm">
                      <Target className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="hidden xs:inline">By </span>Topic
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="subject" className="space-y-3">
                    {subjects.map((subject, index) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border/30 hover:bg-primary-light/20 hover:border-primary/30 hover:shadow-soft transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl sm:text-3xl">{subject.icon}</span>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-foreground truncate">{subject.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                {subject.questions} questions
                              </p>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-primary-light text-primary font-medium hidden sm:inline-block">
                                {subject.difficulty}
                              </span>
                              {subject.isPremium && !isPremium && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500 font-medium flex items-center gap-1">
                                  <Lock size={12} /> Premium
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant={subject.isPremium && !isPremium ? "outline" : "hero"}
                          size="sm"
                          className="w-full sm:w-auto sm:min-w-[140px] min-h-[44px]"
                          onClick={() => {
                            if (subject.isPremium && !isPremium) {
                              // Ignore or show toast
                            } else {
                              navigate(`/quiz?subject=${encodeURIComponent(subject.name)}`)
                            }
                          }}
                          disabled={subject.isPremium && !isPremium}
                        >
                          {subject.isPremium && !isPremium ? "Locked" : "Start Practice"}
                        </Button>
                      </div>
                    ))}
                  </TabsContent>
                  <TabsContent value="topic" className="space-y-3">
                    {topics.map((topic, index) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg bg-muted/30 border border-border/30 hover:bg-primary-light/20 hover:border-primary/30 hover:shadow-soft transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl sm:text-3xl">{topic.icon}</span>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-foreground truncate">{topic.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                {topic.subject} • {topic.questions} questions
                              </p>
                              {topic.isPremium && !isPremium && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500 font-medium flex items-center gap-1">
                                  <Lock size={12} /> Premium
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant={topic.isPremium && !isPremium ? "outline" : "hero"}
                          size="sm"
                          className="w-full sm:w-auto sm:min-w-[140px] min-h-[44px]"
                          onClick={() => {
                            if (topic.isPremium && !isPremium) {
                              // ignore
                            } else {
                              navigate("/quiz")
                            }
                          }}
                          disabled={topic.isPremium && !isPremium}
                        >
                          {topic.isPremium && !isPremium ? "Locked" : "Start Practice"}
                        </Button>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Practice Assignments */}
            <div className="md:animate-scale-in" style={{ animationDelay: "0.1s" }}>
              <PracticeAssignment 
                assignments={assignments} 
                isLoading={isLoadingAssignments}
              />
            </div>
          </div>

          {/* Sidebar - Desktop Only for detailed view */}
          <div className="hidden lg:block space-y-6">
            {/* Progress Tracking */}
            <Card className="border-2 animate-scale-in" style={{ animationDelay: "0.2s" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="text-accent" size={20} />
                  Your Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Last 5 Sessions</span>
                    <span className="font-semibold text-accent">↑ 12%</span>
                  </div>
                  <div className="flex gap-1 h-24">
                    {[85, 78, 82, 90, 88].map((score, idx) => (
                      <div key={idx} className="flex-1 bg-muted rounded overflow-hidden flex items-end">
                        <div
                          className="bg-gradient-accent w-full"
                          style={{ height: `${score}%`, transition: "all 0.3s" }}
                        ></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm font-semibold text-muted-foreground mb-3">Badges Earned</p>
                  <div className="grid grid-cols-2 gap-2">
                    {badges.map((badge, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-2 p-2 rounded border ${badge.earned ? "bg-accent-light border-accent" : "bg-muted border-border opacity-50"
                          }`}
                      >
                        <span className="text-lg">{badge.icon}</span>
                        <span className="text-xs font-medium">{badge.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}

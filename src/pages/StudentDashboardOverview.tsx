import { useState, useEffect } from "react";
import { BookOpen, ClipboardList, TrendingUp, Trophy, Target, ArrowRight, Copy, Check, Swords } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { WinnerBadge, getBadgeLevel, BadgeLevel } from "@/components/WinnerBadge";

interface QuizResult {
  id: string;
  subject: string;
  score: number;
  total_questions: number;
  completed_at: string;
}

export default function StudentDashboardOverview() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userName, setUserName] = useState("Student");
  const [classYear, setClassYear] = useState<string | null>(null);
  const [recentActivity, setRecentActivity] = useState<QuizResult[]>([]);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [averageScore, setAverageScore] = useState(0);
  const [monthlyRank, setMonthlyRank] = useState<number | null>(null);
  const [studentCode, setStudentCode] = useState<string>("");
  const [currentStreak, setCurrentStreak] = useState(0);
  
  // Real database counts for badges
  const [availableQuestionsCount, setAvailableQuestionsCount] = useState(0);
  const [pendingAssignmentsCount, setPendingAssignmentsCount] = useState(0);
  const [completedQuizzesCount, setCompletedQuizzesCount] = useState(0);
  
  // Badge state
  const [totalWins, setTotalWins] = useState(0);
  const [badgeLevel, setBadgeLevel] = useState<BadgeLevel>('bronze');
  const [isFirstWin, setIsFirstWin] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, unique_id")
        .eq("id", user.id)
        .single();
      
      if (profileData?.full_name) {
        const firstName = profileData.full_name.split(" ")[0];
        setUserName(firstName);
      }

      if (profileData?.unique_id) {
        setStudentCode(profileData.unique_id);
      }

      const { data: studentData } = await supabase
        .from("students")
        .select("id, class_year")
        .eq("user_id", user.id)
        .single();
      
      if (studentData) {
        if (studentData.class_year) {
          setClassYear(studentData.class_year);
          
          // Fetch total available questions in database for the student's class year
          const tableName = studentData.class_year === 'year_6'
            ? 'quiz_questions_year6'
            : 'quiz_questions_year9';
            
          const { count: questionsCount } = await supabase
            .from(tableName as any)
            .select("*", { count: 'exact', head: true });
            
          if (questionsCount !== null) {
            setAvailableQuestionsCount(questionsCount);
          }
        }
        setStudentId(studentData.id);
        
        // Fetch streak data
        const { data: streakData } = await supabase
          .from("student_streaks")
          .select("current_streak")
          .eq("student_id", studentData.id)
          .maybeSingle();
        
        if (streakData) {
          setCurrentStreak(streakData.current_streak);
        }
        
        // Fetch actual pending assignments count
        const { count: pendingCount } = await supabase
          .from("practice_assignments")
          .select("*", { count: 'exact', head: true })
          .eq("student_id", studentData.id)
          .eq("status", "pending");
          
        if (pendingCount !== null) {
          setPendingAssignmentsCount(pendingCount);
        }
        
        // Fetch recent quiz results
        const { data: quizResults } = await supabase
          .from("quiz_results")
          .select("id, subject, score, total_questions, completed_at")
          .eq("student_id", studentData.id)
          .order("completed_at", { ascending: false })
          .limit(3);
        
        if (quizResults) {
          setRecentActivity(quizResults);
        }

        // Calculate total questions answered and average score
        const { data: allResults } = await supabase
          .from("quiz_results")
          .select("total_questions, score")
          .eq("student_id", studentData.id);
        
        if (allResults) {
          setCompletedQuizzesCount(allResults.length);
          if (allResults.length > 0) {
            const total = allResults.reduce((sum, result) => sum + result.total_questions, 0);
            setTotalQuestions(total);
            
            const avgScore = allResults.reduce((sum, result) => sum + result.score, 0) / allResults.length;
            setAverageScore(Math.round(avgScore));
            
            // Calculate wins (score >= 80%)
            const wins = allResults.filter(result => result.score >= 80).length;
            setTotalWins(wins);
            setBadgeLevel(getBadgeLevel(wins));
            setIsFirstWin(wins === 1);
          }
        }

        // Calculate monthly rank (by total points, matching the National Leaderboard)
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        
        const { data: monthlyResults } = await supabase
          .from("quiz_results")
          .select("student_id, correct_answers")
          .gte("completed_at", firstDayOfMonth);
        
        if (monthlyResults) {
          const { data: allStudents } = await supabase
            .from("students")
            .select("id, user_id");
            
          const { data: allProfiles } = await supabase
            .from("profiles")
            .select("id, full_name, username");
          
          if (allStudents && allProfiles) {
            const profileMap = new Map(allProfiles.map(p => [p.id, p]));
            const studentPointsMap = new Map<string, number>();
            const studentNamesMap = new Map<string, string>();
            
            allStudents.forEach(s => {
              studentPointsMap.set(s.id, 0);
              const p = profileMap.get(s.user_id);
              const name = p?.full_name || p?.username || "Unknown Student";
              studentNamesMap.set(s.id, name);
            });
            
            monthlyResults.forEach(result => {
              const currentPoints = studentPointsMap.get(result.student_id) || 0;
              studentPointsMap.set(result.student_id, currentPoints + (result.correct_answers * 100));
            });
            
            const rankings = Array.from(studentPointsMap.entries()).map(([studentId, points]) => ({
              studentId,
              points,
              name: studentNamesMap.get(studentId) || ""
            }));
            
            // Sort by points descending, then by name for stable sorting matching the leaderboard
            rankings.sort((a, b) => {
              if (b.points !== a.points) return b.points - a.points;
              return a.name.localeCompare(b.name);
            });
            
            const rank = rankings.findIndex(s => s.studentId === studentData.id) + 1;
            if (rank > 0) {
              setMonthlyRank(rank);
            }
          }
        }
      }
    };

    fetchUserData();
  }, [user]);

  const featureCards = [
    {
      title: "Start Practice",
      description: "Practice by subject or topic",
      icon: BookOpen,
      color: "text-primary",
      bgColor: "bg-primary/10",
      url: "/dashboard/student/practice",
      badge: availableQuestionsCount > 0 
        ? `${availableQuestionsCount.toLocaleString()} Questions`
        : "Start Now",
    },
    {
      title: "Duel of Minds",
      description: "Challenge other students",
      icon: Swords,
      color: "text-purple-600",
      bgColor: "bg-purple-500/10",
      url: "/dashboard/student/duel-of-minds",
      badge: "Compete Now",
    },
    {
      title: "View Assignments",
      description: "Check your practice assignments",
      icon: ClipboardList,
      color: "text-accent",
      bgColor: "bg-accent/10",
      url: "/dashboard/student/assignments",
      badge: `${pendingAssignmentsCount} Pending`,
    },
    {
      title: "Check Progress",
      description: "View your performance analytics",
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-500/10",
      url: "/dashboard/student/progress",
      badge: `${completedQuizzesCount} ${completedQuizzesCount === 1 ? 'Quiz' : 'Quizzes'}`,
    },
    {
      title: "See Rankings",
      description: "National leaderboard positions",
      icon: Trophy,
      color: "text-yellow-600",
      bgColor: "bg-yellow-500/10",
      url: "/dashboard/student/leaderboard",
      badge: monthlyRank ? `Rank #${monthlyRank}` : "Not Ranked",
    },
  ];

  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = async () => {
    if (studentCode) {
      await navigator.clipboard.writeText(studentCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl overflow-x-hidden">
      {/* Welcome Section */}
      <div className="mb-16 animate-fade-in">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <h2 className="text-3xl font-bold text-foreground">Welcome back, {userName}! 🎉</h2>
          {totalWins > 0 && (
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
              badgeLevel === 'platinum' ? 'bg-cyan-100 dark:bg-cyan-900/30 border-2 border-cyan-300 dark:border-cyan-600' :
              badgeLevel === 'gold' ? 'bg-yellow-100 dark:bg-yellow-900/30 border-2 border-yellow-300 dark:border-yellow-600' :
              badgeLevel === 'silver' ? 'bg-slate-100 dark:bg-slate-800/30 border-2 border-slate-300 dark:border-slate-600' :
              'bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-300 dark:border-amber-700'
            }`}>
              <span>{badgeLevel === 'platinum' ? '💎' : badgeLevel === 'gold' ? '🥇' : badgeLevel === 'silver' ? '🥈' : '🥉'}</span>
            </div>
          )}
        </div>
      {classYear && (
        <p className="text-lg font-semibold text-primary mb-2">
          {classYear === 'year_6' ? 'Year 6 • Common Entrance' : 'Year 9 • BECE'}
        </p>
      )}
    </div>

      <Separator className="my-10 opacity-10" />


      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-slide-up overflow-x-hidden">
        <Card className="bg-gradient-to-br from-primary-light/30 to-primary-light/10 border-primary-light/40 shadow-soft hover:shadow-hover transition-all cursor-pointer overflow-hidden" onClick={() => navigate("/dashboard/student/practice")}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Start Questions</p>
                <p className="text-3xl font-bold text-primary">Start</p>
              </div>
              <Target className="text-primary" size={32} />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/20 to-purple-500/10 border-purple-500/30 shadow-soft hover:shadow-hover transition-all cursor-pointer overflow-hidden" onClick={() => navigate("/dashboard/student/duel-of-minds")}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Duel of Minds</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-black text-purple-600">Compete</p>
                  <span className="text-xs font-semibold text-purple-600/70 bg-purple-500/10 px-2 py-1 rounded-full">Challenge</span>
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className="relative">
                  <Swords className="text-purple-600" size={32} />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-600 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-primary-light/20 to-background border-primary-light/30 shadow-soft hover:shadow-hover transition-all cursor-pointer overflow-hidden" onClick={() => navigate("/dashboard/student/leaderboard")}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
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

      {/* Feature Cards */}
      <div className="mb-12 overflow-x-hidden">
        <h3 className="text-2xl font-bold text-foreground mb-6">Quick Access</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {featureCards.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="bg-gradient-to-br from-card to-muted/20 border-border/50 shadow-soft hover:shadow-hover hover:scale-[1.02] transition-all cursor-pointer group animate-scale-in overflow-hidden"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => navigate(feature.url)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-lg ${feature.bgColor} mb-4`}>
                      <Icon className={feature.color} size={28} />
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full bg-primary-light text-primary font-medium">
                      {feature.badge}
                    </span>
                  </div>
                  <CardTitle className="flex items-center justify-between">
                    {feature.title}
                    <ArrowRight className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" size={20} />
                  </CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>

      <Separator className="my-10 opacity-[0.07]" />

    {/* Student Code Display */}
    {studentCode && (
      <Card className="mt-8 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30 shadow-lg animate-fade-in overflow-x-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Your Student Code</p>
              <p className="text-xs text-muted-foreground mb-3">Share this code with your parent to link accounts</p>
              <div className="flex items-center gap-3">
                <code className="text-2xl sm:text-3xl font-bold tracking-widest bg-background/50 px-4 py-2 rounded-lg border border-border text-primary">
                  {studentCode}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyCode}
                  className="shrink-0"
                >
                  {copiedCode ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )}
  </div>
);
}

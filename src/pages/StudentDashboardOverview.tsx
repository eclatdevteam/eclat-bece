import { useState, useEffect } from "react";
import { BookOpen, ClipboardList, TrendingUp, Trophy, Target, ArrowRight, Copy, Check, Swords, Sparkles, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { getBadgeLevel, BadgeLevel } from "@/components/WinnerBadge";

interface QuizResult {
  id: string;
  subject: string;
  score: number;
  total_questions: number;
  completed_at: string;
}

interface StudentBadge {
  name: string;
  icon: string;
  earned: boolean;
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
  const [badges, setBadges] = useState<StudentBadge[]>([]);

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
          const tableName: "quiz_questions_year6" | "quiz_questions_year9" = studentData.class_year === 'year_6'
            ? 'quiz_questions_year6'
            : 'quiz_questions_year9';
            
          const { count: questionsCount } = await supabase
            .from(tableName)
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

            // Calculate badges
            const firstQuiz = allResults.length >= 1;
            const tenQuiz = allResults.length >= 10;
            const streakBadge = currentStreak >= 5;
            const perfectScore = allResults.some(q => q.score === 100);
            
            // To determine Top 10%
            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const { data: monthlyResults } = await supabase
              .from("quiz_results")
              .select("student_id, score")
              .gte("completed_at", firstDayOfMonth);
            
            let top10Badge = false;
            if (monthlyResults && monthlyResults.length > 0) {
              const studentScores = new Map<string, number[]>();
              monthlyResults.forEach(r => {
                if (!studentScores.has(r.student_id)) {
                  studentScores.set(r.student_id, []);
                }
                studentScores.get(r.student_id)!.push(r.score);
              });
              const studentAverages = Array.from(studentScores.entries()).map(([id, scores]) => ({
                id,
                avg: scores.reduce((sum, score) => sum + score, 0) / scores.length
              }));
              studentAverages.sort((a, b) => b.avg - a.avg);
              const rank = studentAverages.findIndex(s => s.id === studentData.id) + 1;
              const totalStudents = studentAverages.length;
              top10Badge = rank > 0 && (rank / totalStudents <= 0.1 || rank <= 3);
            } else {
              top10Badge = avgScore >= 85;
            }

            setBadges([
              { name: "First Quiz", icon: "🎯", earned: firstQuiz },
              { name: "10 Quiz Master", icon: "⭐", earned: tenQuiz },
              { name: "5-Day Streak", icon: "🔥", earned: streakBadge },
              { name: "Top 10%", icon: "👑", earned: top10Badge },
              { name: "Perfect Score", icon: "💯", earned: perfectScore },
            ]);
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
  }, [user, currentStreak]);

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
    <div className="mx-auto max-w-6xl px-5 py-8 text-slate-100 sm:px-8">
      <section className="relative mb-7 overflow-hidden rounded-xl border border-[#25344d] bg-[#101c31] px-6 py-7 shadow-2xl sm:px-8">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,rgba(14,157,204,.22),transparent_65%)]" />
        <div className="relative max-w-xl">
          <p className="mb-2 flex items-center gap-2 text-sm text-slate-200">Welcome back, {userName}! <Sparkles className="h-4 w-4 text-[#f4d21f]" /></p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{classYear === 'year_6' ? 'Year 6 · Common Entrance' : 'Year 9 · BECE'}</h1>
          <p className="mt-2 text-sm text-slate-400">You&apos;re in the top 10 this month! Keep it up!</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => navigate('/dashboard/student/practice')} className="bg-[#72c9ed] text-[#071023] hover:bg-[#91d9f4]">continue practice <ArrowRight className="ml-2 h-4 w-4" /></Button>
            <Button onClick={() => navigate('/quiz')} variant="outline" className="border-slate-500 bg-transparent text-slate-100 hover:bg-slate-700">take mock exam</Button>
          </div>
        </div>
      </section>

      <section className="mb-8 grid gap-4 md:grid-cols-3">
        {[
          { label: 'Questions Solved', value: totalQuestions, note: `${currentStreak > 0 ? currentStreak : 0}% from last week`, icon: BookOpen, color: 'text-[#71c9ed]' },
          { label: 'Average Accuracy', value: `${averageScore}%`, note: '↑ 8% from last week', icon: Target, color: 'text-[#71c9ed]' },
          { label: 'Monthly Rank', value: monthlyRank ? `#${monthlyRank}` : '—', note: 'Nationwide', icon: Trophy, color: 'text-[#71c9ed]' },
        ].map(({ label, value, note, icon: Icon, color }) => (
          <div key={label} className="rounded-lg border border-[#1d2a40] bg-[#0e192b] p-5">
            <div className="mb-5 flex items-center gap-3"><div className="rounded-lg bg-[#183149] p-2.5"><Icon className={color} size={20} /></div><span className="text-sm font-medium text-slate-200">{label}</span></div>
            <p className={`text-3xl font-bold ${color}`}>{value}</p><p className="mt-1 text-xs text-slate-400">{note}</p>
          </div>
        ))}
      </section>

      <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
      <section className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {featureCards.slice(0, 4).map((feature) => { const Icon = feature.icon; return <button key={feature.title} onClick={() => navigate(feature.url)} className="group flex items-center gap-3 rounded-md border border-[#1d2a40] bg-[#0e192b] p-4 text-left transition hover:border-[#159dca] hover:bg-[#13223a]"><span className={`rounded-md bg-[#183149] p-2 ${feature.color}`}><Icon size={19} /></span><span className="min-w-0 flex-1"><strong className="block text-sm font-medium text-slate-100">{feature.title}</strong><small className="block text-xs text-slate-400">{feature.description}</small></span><ArrowRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-1 group-hover:text-[#71c9ed]" /></button>; })}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="rounded-lg border border-[#1d2a40] bg-[#0e192b] p-5"><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-semibold">Recent Activity</h2><button onClick={() => navigate('/dashboard/student/progress')} className="text-xs text-[#71c9ed]">View All</button></div>{recentActivity.length === 0 ? <p className="py-6 text-sm text-slate-400">Complete a practice quiz to see your recent activity.</p> : <div className="space-y-4">{recentActivity.map((activity) => <div key={activity.id} className="flex items-center gap-3"><span className="rounded-md bg-[#183149] p-2 text-[#71c9ed]"><BarChart3 size={18} /></span><div className="flex-1"><p className="text-sm font-medium">{activity.subject}</p><p className="text-xs text-slate-400">{activity.total_questions} questions · {formatDistanceToNow(new Date(activity.completed_at), { addSuffix: true })}</p></div><strong className={activity.score >= 80 ? 'text-[#71c9ed]' : 'text-[#f4a83a]'}>{activity.score}%</strong></div>)}</div>}</div>
        <div className="rounded-lg border border-[#1d2a40] bg-[#0e192b] p-5"><h2 className="text-lg font-semibold">Parent Link Code</h2><p className="mt-1 text-xs text-slate-400">Share this code with your parent or guardian</p>{studentCode ? <><code className="mt-5 block border border-dashed border-[#31506c] bg-[#091426] px-3 py-4 text-center text-2xl font-bold tracking-[0.25em] text-[#71c9ed]">{studentCode}</code><Button onClick={handleCopyCode} variant="outline" className="mt-3 w-full border-slate-500 text-slate-200">{copiedCode ? <><Check className="mr-2 h-4 w-4" />copied</> : <><Copy className="mr-2 h-4 w-4" />copy code</>}</Button></> : <p className="mt-6 text-sm text-slate-400">Your link code will appear here.</p>}</div>
      </section>
      {badges.length > 0 && totalWins > 0 && <p className="mt-5 text-xs text-slate-400">{badgeLevel} badge · {totalWins} high scores</p>}
    </div>
  );
}

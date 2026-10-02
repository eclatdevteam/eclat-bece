import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  CalendarCheck2,
  GraduationCap,
  Plus,
  TrendingUp,
  Users,
  BookOpen,
  Award,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SchoolLayout } from "@/components/school/SchoolLayout";
import { CreateClassDialog, CreateStudentDialog } from "@/components/school/SchoolCreateDialogs";
import { StatCard } from "./schoolPageShared";
import { useSchoolData } from "@/hooks/useSchoolData";

export function SchoolOverviewPage() {
  const navigate = useNavigate();
  const { school, students, classes, assignmentStats, cohortAverages, gamificationTotals, topicMastery, refresh } = useSchoolData();
  const [studentDialogOpen, setStudentDialogOpen] = useState(false);
  const [classDialogOpen, setClassDialogOpen] = useState(false);

  const totalStudents = students.length;
  const activeStudents = gamificationTotals.activeLearnersCount;
  const avgScore = cohortAverages.overall;

  const statCards = [
    {
      label: "Total students",
      value: totalStudents.toString(),
      hint: "Enrolled learners",
      icon: Users,
      tone: "primary" as const,
    },
    {
      label: "Active learners",
      value: activeStudents.toString(),
      hint: totalStudents > 0 ? `${Math.round((activeStudents / totalStudents) * 100)}% of total` : "Awaiting activity",
      icon: GraduationCap,
      tone: "success" as const,
    },
    {
      label: "Classes",
      value: classes.length.toString(),
      hint: "Active cohorts",
      icon: Briefcase,
      tone: "accent" as const,
    },
    {
      label: "Assignments",
      value: assignmentStats.total.toString(),
      hint: `${assignmentStats.completed} completed (${assignmentStats.completionRate}%)`,
      icon: CalendarCheck2,
      tone: "warning" as const,
    },
    {
      label: "Avg. score",
      value: avgScore > 0 ? `${avgScore}%` : "—",
      hint: "Overall institutional benchmark",
      icon: TrendingUp,
      tone: "primary" as const,
    },
  ];

  // Best performing subject
  const topSubjectInfo = useMemo(() => {
    if (topicMastery.length === 0) return { subject: "Mathematics", score: cohortAverages.overall || 75 };
    const subjectMap: Record<string, { total: number; count: number }> = {};
    topicMastery.forEach((m) => {
      if (!subjectMap[m.subject]) subjectMap[m.subject] = { total: 0, count: 0 };
      subjectMap[m.subject].total += m.rolling_accuracy;
      subjectMap[m.subject].count += 1;
    });
    let best = { subject: "Mathematics", score: 0 };
    Object.entries(subjectMap).forEach(([sub, data]) => {
      const avg = Math.round(data.total / data.count);
      if (avg > best.score) best = { subject: sub, score: avg };
    });
    return best;
  }, [topicMastery, cohortAverages.overall]);

  const topStudents = gamificationTotals.topAchievers.slice(0, 3);
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <SchoolLayout
      title={`Welcome back${school?.school_name ? `, ${school.school_name}` : ""}! 👋`}
      subtitle="Here's what's happening across your school this week."
      actions={
        <>
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard/school/reports")}
            className="border-[#2d9dc6] bg-transparent text-[#55c8ed] hover:bg-[#123047] h-9 text-xs sm:text-sm"
          >
            View reports
          </Button>
          <Button
            onClick={() => setStudentDialogOpen(true)}
            className="bg-[#2184a7] text-white hover:bg-[#2c9bc2] h-9 text-xs sm:text-sm"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add student
          </Button>
          <Button
            onClick={() => navigate("/dashboard/school/assignments")}
            className="bg-[#3bc2f3] text-[#041c2d] hover:bg-[#6cd8ff] h-9 text-xs sm:text-sm font-semibold"
          >
            <BookOpen className="mr-1.5 h-3.5 w-3.5" />
            Assign practice
          </Button>
        </>
      }
    >
      {/* Stat Cards - Fully Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* Main Grid: Overview & Activity */}
      <div className="mt-6 sm:mt-8 grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-4 sm:gap-6">
        <Card className="border border-[#2a3852] bg-[#151e33] text-slate-100 min-w-0">
          <CardHeader className="border-b border-[#202b43] pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-[#71c9ed]">Performance Overview</CardTitle>
              <span className="rounded-xl bg-[#25334b] px-2.5 py-1 text-[11px] text-[#7bd7f2]">Real-Time Metrics</span>
            </div>
          </CardHeader>
          <CardContent className="p-5 sm:p-6 space-y-6">
            {[
              {
                label: "Year 9 / JSS 3 (BECE Cohort)",
                value: cohortAverages.year_9,
                color: "bg-[#3bc2f3]",
              },
              {
                label: "Year 6 / Primary 6 (Common Entrance)",
                value: cohortAverages.year_6,
                color: "bg-[#7dd3fc]",
              },
              {
                label: "Overall institutional average",
                value: avgScore,
                color: "bg-[#8b5cf6]",
              },
            ].map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-slate-200">{item.label}</span>
                  <span className="font-bold text-white">
                    {item.value > 0 ? `${item.value}%` : "—"}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-[#0e1729]">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                    style={{ width: `${Math.min(item.value, 100)}%` }}
                  />
                </div>
              </div>
            ))}

            <div className="pt-2 flex flex-wrap gap-2 text-xs text-slate-300">
              <span className="rounded-md border border-[#2a3852] bg-[#0c1527] px-3 py-1.5 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                Top subject: {topSubjectInfo.subject} ({topSubjectInfo.score > 0 ? `${topSubjectInfo.score}%` : "—"})
              </span>
              <span className="rounded-md border border-[#2a3852] bg-[#0c1527] px-3 py-1.5">
                Target: 75% curriculum standard
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[#2a3852] bg-[#151e33] text-slate-100 min-w-0">
          <CardHeader className="border-b border-[#202b43] pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-[#71c9ed]">Top Student Achievers</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard/school/leaderboard")}
                className="text-xs text-[#7bd7f2] hover:text-white p-0 h-auto"
              >
                View all →
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 p-4 sm:p-5">
            {topStudents.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 space-y-2">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#162742] text-slate-500">
                  <Award className="h-5 w-5" />
                </div>
                <p className="font-semibold text-slate-300">No student activity recorded yet</p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  Learners and points will automatically populate as students complete practice quizzes and exams.
                </p>
              </div>
            ) : (
              topStudents.map((st, idx) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between rounded-lg border border-[#233148] bg-[#0d1628] p-3 transition-colors hover:border-[#384c6e]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#152943] text-base flex-shrink-0">
                      {medals[idx] || "⭐"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-white text-sm truncate">{st.name}</p>
                      <p className="text-xs text-slate-400 truncate">
                        {st.class_year === "year_6" ? "Year 6 • Common Entrance" : "Year 9 • BECE"} • {(st.lifetime_ep || 0).toLocaleString()} EP
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-[#7dd3fc] flex-shrink-0">
                    {st.avgScore > 0 ? `${st.avgScore}%` : "—"}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <CreateStudentDialog
        open={studentDialogOpen}
        onOpenChange={setStudentDialogOpen}
        onCreated={() => refresh()}
      />
      <CreateClassDialog
        open={classDialogOpen}
        onOpenChange={setClassDialogOpen}
        onCreated={() => refresh()}
      />
    </SchoolLayout>
  );
}

export default SchoolOverviewPage;

import { useState, useEffect, useCallback, useMemo } from "react";
import { RefreshCw, Building2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SchoolLayout } from "@/components/school/SchoolLayout";
import { CompetitionLeaderboards } from "@/components/CompetitionLeaderboards";
import { ClassroomLeaderboardView, EnrichedStudentRecord } from "@/components/school/ClassroomLeaderboardView";
import { StudentReportDialog } from "@/components/StudentReportDialog";
import { fetchLeaderboardData, LeaderboardData } from "@/utils/leaderboard";
import { useSchoolData } from "@/hooks/useSchoolData";

export function SchoolLeaderboardPage() {
  const { school, students, gamificationTotals, refresh: refreshSchoolData } = useSchoolData();
  const [activeTab, setActiveTab] = useState<"classroom" | "national">("classroom");
  const [nationalData, setNationalData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(false);

  // Student Report Modal
  const [selectedStudent, setSelectedStudent] = useState<EnrichedStudentRecord | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  const loadLeaders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchLeaderboardData(school?.id);
      setNationalData(res);
    } catch (err) {
      console.error("Error fetching leaderboard data:", err);
    } finally {
      setLoading(false);
    }
  }, [school?.id]);

  useEffect(() => {
    loadLeaders();
  }, [loadLeaders]);

  const topStudent = gamificationTotals.topAchievers[0];
  const maxLeagueTier = useMemo(() => {
    if (students.length === 0) return 1;
    return Math.max(...students.map((s) => s.league_tier || 1));
  }, [students]);

  return (
    <SchoolLayout
      title="Leaderboards & Competitions"
      subtitle="Track private classroom standings, multi-pillar EP progress, and national arena leaderboards."
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            loadLeaders();
            refreshSchoolData();
          }}
          disabled={loading}
          className="border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800 text-xs sm:text-sm"
        >
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh rankings
        </Button>
      }
    >
      {/* Institutional Gamification Metrics Header */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[
          {
            label: "Total Institution EP",
            value: gamificationTotals.totalEP.toLocaleString(),
            hint: "Cumulative Éclat Points",
            tone: "text-[#66d7ff]",
          },
          {
            label: "School Top Achiever",
            value: topStudent ? topStudent.name.split(" ")[0] : "—",
            hint: topStudent ? `${(topStudent.lifetime_ep || 0).toLocaleString()} EP (Level ${topStudent.current_level})` : "No activity yet",
            tone: "text-amber-400",
          },
          {
            label: "Active Competitors",
            value: `${gamificationTotals.activeLearnersCount} / ${students.length}`,
            hint: "Learners earning points",
            tone: "text-emerald-400",
          },
          {
            label: "Highest League Tier",
            value: `Tier ${maxLeagueTier}`,
            hint: "Tier 1: Starter to Tier 8: Legend",
            tone: "text-purple-400",
          },
        ].map((item) => (
          <Card key={item.label} className="border border-[#2a3852] bg-[#151e33] text-slate-100 min-w-0">
            <CardContent className="p-4 sm:p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 truncate">
                {item.label}
              </p>
              <p className={`mt-2 text-2xl sm:text-3xl font-black ${item.tone} truncate`}>
                {item.value}
              </p>
              <p className="mt-1 text-[11px] text-slate-400 truncate">{item.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Tab Navigation */}
      <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-[#26344d] pb-3 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab("classroom")}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
            activeTab === "classroom"
              ? "bg-[#2184a7] text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-[#15233c]"
          }`}
        >
          <Building2 className="h-4 w-4" />
          Classroom Leaderboard (Private School)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("national")}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
            activeTab === "national"
              ? "bg-[#2184a7] text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-[#15233c]"
          }`}
        >
          <Globe className="h-4 w-4" />
          National Competitions & Arenas
        </button>
      </div>

      {/* Tab: Private School Classroom Leaderboard */}
      {activeTab === "classroom" && (
        <div className="w-full min-w-0">
          <ClassroomLeaderboardView
            students={students}
            onSelectStudent={(student) => {
              setSelectedStudent(student);
              setReportOpen(true);
            }}
          />
        </div>
      )}

      {/* Tab: National Competitions */}
      {activeTab === "national" && (
        <div className="w-full min-w-0">
          <CompetitionLeaderboards
            weeklyLeaders={nationalData?.weeklyLeaders || []}
            monthlyLeaders={nationalData?.monthlyLeaders || []}
            annualLeaders={nationalData?.annualLeaders || []}
            mathLeaders={nationalData?.mathLeaders || []}
            englishLeaders={nationalData?.englishLeaders || []}
            schoolLeaders={nationalData?.schoolLeaders || []}
            showCurrentUserPosition={false}
          />
        </div>
      )}

      {/* Student Diagnostic Report Dialog */}
      {selectedStudent && (
        <StudentReportDialog
          open={reportOpen}
          onOpenChange={setReportOpen}
          studentId={selectedStudent.id}
          studentName={selectedStudent.name}
          studentClass={selectedStudent.class_year === "year_9" ? "Year 9 (BECE)" : "Year 6 (Common Entrance)"}
          avatar={selectedStudent.avatar || "🎓"}
        />
      )}
    </SchoolLayout>
  );
}

export default SchoolLeaderboardPage;

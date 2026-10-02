import { useState, useMemo } from "react";
import { GraduationCap, Plus, Calendar, Clock, CheckCircle2, ArrowRight, Users, Trash2, BookOpen, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SchoolLayout } from "@/components/school/SchoolLayout";
import { SchoolScheduleExamDialog } from "@/components/school/SchoolScheduleExamDialog";
import { SchoolExamRosterDialog } from "@/components/school/SchoolExamRosterDialog";
import { useSchoolData, SchoolExamItem } from "@/hooks/useSchoolData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function SchoolExamsPage() {
  const { school, students, classes, exams, refresh, isLoading } = useSchoolData();
  const [filter, setFilter] = useState("all");
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedRosterExam, setSelectedRosterExam] = useState<SchoolExamItem | null>(null);
  const [rosterDialogOpen, setRosterDialogOpen] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const filteredExams = useMemo(() => {
    return exams.filter((e) => {
      if (filter === "all") return true;
      if (filter === "scheduled") return e.status === "Scheduled";
      if (filter === "completed") return e.status === "Completed";
      return true;
    });
  }, [exams, filter]);

  const scheduledCount = exams.filter((e) => e.status === "Scheduled").length;
  const completedCount = exams.filter((e) => e.status === "Completed").length;

  const handleDeleteExam = async (examId: string, examTitle: string) => {
    if (!window.confirm(`Are you sure you want to cancel and delete "${examTitle}"?`)) {
      return;
    }

    setIsDeletingId(examId);
    try {
      const { error } = await supabase.from("school_exams" as any).delete().eq("id", examId);
      if (error) throw error;
      toast.success("Examination removed from schedule");
      refresh();
    } catch (err: any) {
      console.error("Error deleting exam:", err);
      toast.error(err.message || "Failed to remove examination");
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <SchoolLayout
      title="Exams & Evaluations"
      subtitle="Schedule formal mock evaluations, track BECE simulations, and review candidate seating."
      actions={
        <Button
          onClick={() => setScheduleDialogOpen(true)}
          className="bg-[#3bc2f3] text-[#041c2d] hover:bg-[#6cd8ff] font-semibold text-xs sm:text-sm"
        >
          <GraduationCap className="mr-1.5 h-4 w-4" />
          Schedule exam
        </Button>
      }
    >
      {/* Filter Tabs */}
      <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-[#26344d] pb-3 text-xs">
        {[
          { key: "all", label: `All Evaluations (${exams.length})` },
          { key: "scheduled", label: `Upcoming (${scheduledCount})` },
          { key: "completed", label: `Past Assessments (${completedCount})` },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              filter === tab.key
                ? "bg-[#2184a7] text-white"
                : "text-slate-400 hover:text-white hover:bg-[#15233c]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Exams Grid / Empty State */}
      {exams.length === 0 ? (
        <Card className="border border-dashed border-[#2a3852] bg-[#0c1628]/60 p-12 text-center">
          <CardContent className="space-y-4 max-w-md mx-auto">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#162945] text-[#71c9ed]">
              <GraduationCap className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">No Mock Examinations Scheduled</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Schedule formal BECE simulations, choose subject blueprints, and allocate candidate hall seating for your learners.
              </p>
            </div>
            <Button
              onClick={() => setScheduleDialogOpen(true)}
              className="bg-[#2184a7] text-white hover:bg-[#2c9bc2] text-xs font-semibold"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Schedule First Exam
            </Button>
          </CardContent>
        </Card>
      ) : filteredExams.length === 0 ? (
        <div className="rounded-xl border border-[#233148] bg-[#0c1628] p-8 text-center text-xs text-slate-400">
          No evaluations match this status filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredExams.map((exam) => (
            <Card
              key={exam.id}
              className="border border-[#233148] bg-[#0c1628] text-slate-100 min-w-0 hover:border-[#384c6e] transition-colors flex flex-col justify-between"
            >
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-[#58c4e8]">
                        {exam.cohort === "year_6" ? "Year 6 (Primary 6)" : "Year 9 (JSS 3)"}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-[11px] text-slate-300 font-medium">{exam.subject}</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-[#71c9ed] mt-1 leading-snug">
                      {exam.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Target: <span className="text-slate-200">{exam.class_name || "School-wide Cohort"}</span>
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold flex-shrink-0 border ${
                      exam.status === "Scheduled"
                        ? "bg-sky-500/10 text-sky-300 border-sky-500/30"
                        : exam.status === "Completed"
                        ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                        : "bg-slate-700/40 text-slate-400 border-slate-700"
                    }`}
                  >
                    {exam.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#1c2940] text-xs text-slate-300">
                  <div className="rounded-lg bg-[#071023] p-2">
                    <p className="text-[10px] text-slate-400">Date</p>
                    <p className="font-semibold text-white mt-0.5 truncate">{exam.exam_date}</p>
                    {exam.start_time && (
                      <p className="text-[10px] text-slate-400 mt-0.5">{exam.start_time}</p>
                    )}
                  </div>
                  <div className="rounded-lg bg-[#071023] p-2">
                    <p className="text-[10px] text-slate-400">Duration</p>
                    <p className="font-semibold text-white mt-0.5 truncate">{exam.duration_minutes} Mins</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{exam.question_count} Questions</p>
                  </div>
                  <div className="rounded-lg bg-[#071023] p-2">
                    <p className="text-[10px] text-slate-400">Hall Seating</p>
                    <p className="font-semibold text-[#7dd3fc] mt-0.5 truncate">
                      {exam.eligibleStudentCount || 0} Candidates
                    </p>
                    <p className="text-[10px] text-emerald-400 mt-0.5">Pass: {exam.passing_score}%</p>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-[#1c2940]">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isDeletingId === exam.id}
                    onClick={() => handleDeleteExam(exam.id, exam.title)}
                    className="h-8 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    Cancel
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedRosterExam(exam);
                      setRosterDialogOpen(true);
                    }}
                    className="bg-[#2184a7] text-white hover:bg-[#2c9bc2] text-xs font-semibold"
                  >
                    <Users className="mr-1.5 h-3.5 w-3.5" />
                    Review Seating Roster
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Schedule Exam Builder Dialog */}
      {school?.id && (
        <SchoolScheduleExamDialog
          open={scheduleDialogOpen}
          onOpenChange={setScheduleDialogOpen}
          schoolId={school.id}
          classes={classes}
          onCreated={() => refresh()}
        />
      )}

      {/* Candidate Seating Roster Dialog */}
      <SchoolExamRosterDialog
        open={rosterDialogOpen}
        onOpenChange={setRosterDialogOpen}
        exam={selectedRosterExam}
        students={students}
        classes={classes}
      />
    </SchoolLayout>
  );
}

export default SchoolExamsPage;

import { useState } from "react";
import { GraduationCap, Plus, Calendar, Clock, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SchoolLayout } from "@/components/school/SchoolLayout";
import { toast } from "sonner";

interface ExamItem {
  id: string;
  title: string;
  cohort: string;
  date: string;
  duration: string;
  questions: number;
  status: "Scheduled" | "In Progress" | "Completed" | "Draft";
}

const examsList: ExamItem[] = [
  { id: "1", title: "National BECE Full Mock Examination 1", cohort: "Year 9 (JSS 3)", date: "May 15, 2026", duration: "120 Mins", questions: 60, status: "Scheduled" },
  { id: "2", title: "Common Entrance Diagnostic Assessment", cohort: "Year 6 (Primary 6)", date: "May 22, 2026", duration: "90 Mins", questions: 50, status: "Scheduled" },
  { id: "3", title: "Mid-Term Mathematics & Science Drill", cohort: "Year 9 (JSS 3)", date: "Completed Apr 2026", duration: "60 Mins", questions: 40, status: "Completed" },
  { id: "4", title: "Inter-School Prep Mock Evaluation 2", cohort: "Year 9 (JSS 3)", date: "June 2026", duration: "120 Mins", questions: 60, status: "Draft" },
];

export function SchoolExamsPage() {
  const [filter, setFilter] = useState("all");

  const filteredExams = examsList.filter((e) => {
    if (filter === "all") return true;
    return e.status.toLowerCase() === filter.toLowerCase();
  });

  return (
    <SchoolLayout
      title="Exams & Evaluations"
      subtitle="Schedule formal mock evaluations, track BECE simulations, and review candidate seating."
      actions={
        <Button
          onClick={() => toast.info("New exam schedule builder will open shortly.")}
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
          { key: "all", label: "All Evaluations" },
          { key: "scheduled", label: "Upcoming" },
          { key: "completed", label: "Past Assessments" },
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

      {/* Exams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredExams.map((exam) => (
          <Card
            key={exam.id}
            className="border border-[#233148] bg-[#0c1628] text-slate-100 min-w-0 hover:border-[#384c6e] transition-colors flex flex-col justify-between"
          >
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-semibold text-[#58c4e8]">{exam.cohort}</span>
                  <h3 className="text-base sm:text-lg font-bold text-[#71c9ed] mt-1 leading-snug">
                    {exam.title}
                  </h3>
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
                  <p className="font-semibold text-white mt-0.5 truncate">{exam.date}</p>
                </div>
                <div className="rounded-lg bg-[#071023] p-2">
                  <p className="text-[10px] text-slate-400">Duration</p>
                  <p className="font-semibold text-white mt-0.5 truncate">{exam.duration}</p>
                </div>
                <div className="rounded-lg bg-[#071023] p-2">
                  <p className="text-[10px] text-slate-400">Items</p>
                  <p className="font-semibold text-white mt-0.5 truncate">{exam.questions} Qs</p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-slate-400">Passing benchmark: 70%</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.info(`${exam.title}: Standardized mock evaluation timed for ${exam.duration} with ${exam.questions} past examination items.`)}
                  className="border-slate-700 bg-slate-900/40 text-xs text-slate-200 hover:bg-slate-800"
                >
                  Inspect details
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </SchoolLayout>
  );
}

export default SchoolExamsPage;

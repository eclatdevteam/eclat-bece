import { useState, useMemo } from "react";
import { Building2, Plus, Search, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SchoolLayout } from "@/components/school/SchoolLayout";
import { CreateClassDialog } from "@/components/school/SchoolCreateDialogs";
import { useSchoolData } from "@/hooks/useSchoolData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function SchoolClassesPage() {
  const { school, students, classes, isLoading, refresh: refreshSchoolData } = useSchoolData();
  const [classDialogOpen, setClassDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteClass = async (classId: string, className: string) => {
    if (!window.confirm(`Are you sure you want to delete class "${className}"?`)) return;
    try {
      setDeletingId(classId);
      const { error } = await supabase
        .from("school_classes" as any)
        .delete()
        .eq("id", classId);

      if (error) throw error;
      toast.success(`Class "${className}" deleted`);
      refreshSchoolData();
    } catch (err: any) {
      console.error("Error deleting class:", err);
      toast.error(err?.message || "Failed to delete class");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredClasses = useMemo(() => {
    return classes.map((c) => ({
      ...c,
      avgScoreFormatted: c.avgScore > 0 ? `${c.avgScore}%` : "—",
    })).filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.level.toLowerCase().includes(search.toLowerCase()) ||
        (c.lead_teacher && c.lead_teacher.toLowerCase().includes(search.toLowerCase()));

      const matchesLevel =
        levelFilter === "all" ||
        (levelFilter === "year_9" && (c.class_year === "year_9" || c.level.toLowerCase().includes("jss"))) ||
        (levelFilter === "year_6" && (c.class_year === "year_6" || c.level.toLowerCase().includes("primary")));

      return matchesSearch && matchesLevel;
    });
  }, [classes, search, levelFilter]);

  const totalClassesCount = classes.length;
  const beceCandidates = students.filter((s) => s.class_year === "year_9").length;
  const commonEntranceCandidates = students.filter((s) => s.class_year === "year_6").length;

  return (
    <SchoolLayout
      title="Classes & Cohorts"
      subtitle="Manage examination cohorts, class streams, and assigned faculty."
      actions={
        <Button
          onClick={() => setClassDialogOpen(true)}
          className="bg-[#3bc2f3] text-[#041c2d] hover:bg-[#6cd8ff] font-semibold text-xs sm:text-sm shadow-md"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add class
        </Button>
      }
    >
      {/* Metric Cards */}
      <div className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          ["Total classes", totalClassesCount.toString(), "Active school cohorts"],
          ["Total learners", students.length.toString(), "Enrolled in institution"],
          ["BECE Candidates", beceCandidates.toString(), "Year 9 (JSS 3) students"],
          ["Common Entrance", commonEntranceCandidates.toString(), "Year 6 (Primary 6) students"],
        ].map(([label, value, hint]) => (
          <Card key={label} className="border border-[#2a3852] bg-[#151e33] text-slate-100 min-w-0">
            <CardContent className="p-4 sm:p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-300 truncate">
                {label}
              </p>
              <p className="mt-2 text-2xl sm:text-3xl font-black text-white truncate">{value}</p>
              <p className="mt-1 text-[11px] text-[#51c6eb] truncate">{hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-[#2a3852] bg-[#0f182b] p-3 text-xs">
        <div className="flex items-center gap-2 flex-1 rounded-lg border border-[#34415b] bg-[#071023] px-3 py-2 text-slate-200">
          <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search classes by name, level or lead teacher..."
            className="w-full bg-transparent text-xs text-white placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="rounded-lg border border-[#34415b] bg-[#071023] px-3 py-2 text-xs text-slate-200 focus:outline-none"
          >
            <option value="all">All Cohorts</option>
            <option value="year_9">Year 9 / JSS 3 (BECE)</option>
            <option value="year_6">Year 6 / Primary 6 (Common Entrance)</option>
          </select>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && classes.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 rounded-xl border border-[#2a3852] bg-[#0c1628] text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-[#3bc2f3] mb-3" />
          <p className="text-sm font-semibold">Loading class cohorts...</p>
        </div>
      ) : filteredClasses.length === 0 ? (
        /* Empty State */
        <Card className="border border-dashed border-[#2a3852] bg-[#0c1628]/60 p-12 text-center">
          <CardContent className="space-y-4 max-w-md mx-auto">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#162945] text-[#71c9ed]">
              <Building2 className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">No Classes Created Yet</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Organize your school learners into distinct class streams (e.g. JSS 3A, Primary 6 Gold) to manage exam preparation and track cohort averages.
              </p>
            </div>
            <Button
              onClick={() => setClassDialogOpen(true)}
              className="bg-[#2184a7] text-white hover:bg-[#2c9bc2] text-xs font-semibold"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Create First Class
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Class Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredClasses.map((klass) => (
            <Card
              key={klass.id}
              className="border border-[#2a3852] bg-[#151e33] text-slate-100 min-w-0 hover:border-[#384c6e] transition-colors flex flex-col justify-between"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg font-bold text-[#71c9ed] leading-tight truncate">
                    {klass.name}
                  </CardTitle>
                  <span className="rounded-full border border-sky-500/40 bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-sky-300 flex-shrink-0">
                    {klass.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 truncate">
                  Lead: {klass.lead_teacher || "Unassigned"}
                </p>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg border border-slate-700/60 bg-[#0c1424] p-2.5">
                    <p className="text-slate-400 text-[11px]">Enrolled</p>
                    <p className="mt-1 text-xl font-black text-white">{klass.studentsCount}</p>
                  </div>
                  <div className="rounded-lg border border-slate-700/60 bg-[#0c1424] p-2.5">
                    <p className="text-slate-400 text-[11px]">Cohort Avg</p>
                    <p className="mt-1 text-xl font-black text-[#7dd3fc]">{klass.avgScoreFormatted}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#233148] flex items-center justify-between text-xs text-slate-400">
                  <span className="text-[11px] text-slate-500">
                    Level: {klass.level}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={deletingId === klass.id}
                    onClick={() => handleDeleteClass(klass.id, klass.name)}
                    className="h-7 px-2 text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateClassDialog
        open={classDialogOpen}
        onOpenChange={setClassDialogOpen}
        onCreated={refreshSchoolData}
      />
    </SchoolLayout>
  );
}

export default SchoolClassesPage;

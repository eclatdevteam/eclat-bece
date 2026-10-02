import { useState, useMemo } from "react";
import { Briefcase, Search, Plus, Mail, Users, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SchoolLayout } from "@/components/school/SchoolLayout";
import { useSchoolData } from "@/hooks/useSchoolData";
import { toast } from "sonner";

export function SchoolTeachersPage() {
  const { classes } = useSchoolData();
  const [search, setSearch] = useState("");

  const facultyFromClasses = useMemo(() => {
    const teacherMap = new Map<string, { name: string; classes: string[]; count: number }>();
    classes.forEach((c) => {
      if (c.lead_teacher && c.lead_teacher.trim()) {
        const name = c.lead_teacher.trim();
        const existing = teacherMap.get(name) || { name, classes: [], count: 0 };
        existing.classes.push(c.name);
        existing.count += 1;
        teacherMap.set(name, existing);
      }
    });
    return Array.from(teacherMap.values());
  }, [classes]);

  const filteredFaculty = useMemo(() => {
    return facultyFromClasses.filter((t) => {
      const q = search.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        t.classes.some((c) => c.toLowerCase().includes(q))
      );
    });
  }, [facultyFromClasses, search]);

  return (
    <SchoolLayout
      title="Teacher Directory"
      subtitle="Manage faculty assignments, department allocations, and lead instructors."
      actions={
        <Button
          onClick={() => toast.info("Faculty invitation via email is rolling out in an upcoming release. In the meantime, assign lead teachers directly when creating or editing school classes.")}
          className="bg-[#3bc2f3] text-[#041c2d] hover:bg-[#6cd8ff] font-semibold text-xs sm:text-sm"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add teacher
        </Button>
      }
    >
      {/* Search Bar */}
      <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-[#2a3852] bg-[#0f182b] p-3 text-xs">
        <div className="flex items-center gap-2 flex-1 rounded-lg border border-[#34415b] bg-[#071023] px-3 py-2 text-slate-200">
          <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teachers by name or assigned class arm..."
            className="w-full bg-transparent text-xs text-white placeholder:text-slate-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Faculty List / Empty State */}
      {facultyFromClasses.length === 0 ? (
        <Card className="border border-dashed border-[#2a3852] bg-[#0c1628]/60 p-12 text-center">
          <CardContent className="space-y-4 max-w-md mx-auto">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#162945] text-[#71c9ed]">
              <Users className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">No Faculty Assigned Yet</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Faculty members assigned as lead teachers on your school classes and cohorts will appear in this directory automatically.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFaculty.map((teacher) => (
            <Card
              key={teacher.name}
              className="border border-[#233148] bg-[#151e33] text-slate-100 hover:border-[#384c6e] transition-colors"
            >
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-white text-base">{teacher.name}</h3>
                    <p className="text-xs text-[#71c9ed]">Lead Faculty</p>
                  </div>
                  <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-sky-300">
                    {teacher.count} {teacher.count === 1 ? "Class" : "Classes"}
                  </span>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-[#233148] text-xs">
                  <span className="text-[11px] text-slate-400 font-medium">Assigned Class Arms:</span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {teacher.classes.map((cls) => (
                      <span
                        key={cls}
                        className="rounded border border-slate-700/60 bg-[#0c1424] px-2 py-0.5 text-[11px] text-slate-200"
                      >
                        {cls}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </SchoolLayout>
  );
}

export default SchoolTeachersPage;

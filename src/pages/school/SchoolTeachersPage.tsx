import { useState, useMemo } from "react";
import { Briefcase, Search, Plus, Mail, Phone, Users, Building2, BookOpen, Edit2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SchoolLayout } from "@/components/school/SchoolLayout";
import { SchoolAddTeacherDialog } from "@/components/school/SchoolAddTeacherDialog";
import { SchoolEditTeacherDialog } from "@/components/school/SchoolEditTeacherDialog";
import { useSchoolData, SchoolTeacherItem } from "@/hooks/useSchoolData";

export function SchoolTeachersPage() {
  const { school, teachers, classes, refresh, isLoading } = useSchoolData();
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedEditTeacher, setSelectedEditTeacher] = useState<SchoolTeacherItem | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Derive unique departments for filtering
  const departments = useMemo(() => {
    const set = new Set<string>();
    teachers.forEach((t) => {
      if (t.department) set.add(t.department);
    });
    return Array.from(set);
  }, [teachers]);

  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      const q = search.toLowerCase();
      const matchesSearch =
        t.full_name.toLowerCase().includes(q) ||
        (t.email && t.email.toLowerCase().includes(q)) ||
        (t.department && t.department.toLowerCase().includes(q)) ||
        (t.primary_subject && t.primary_subject.toLowerCase().includes(q)) ||
        t.assigned_classes.some((c) => c.toLowerCase().includes(q));

      const matchesDept =
        deptFilter === "all" ||
        (t.department && t.department.toLowerCase() === deptFilter.toLowerCase());

      return matchesSearch && matchesDept;
    });
  }, [teachers, search, deptFilter]);

  return (
    <SchoolLayout
      title="Teacher Directory"
      subtitle="Manage faculty assignments, department allocations, and lead instructors."
      actions={
        <Button
          onClick={() => setAddDialogOpen(true)}
          className="bg-[#3bc2f3] text-[#041c2d] hover:bg-[#6cd8ff] font-semibold text-xs sm:text-sm"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add teacher
        </Button>
      }
    >
      {/* Search Bar & Department Filter */}
      <div className="mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 rounded-xl border border-[#2a3852] bg-[#0f182b] p-3 text-xs">
        <div className="flex items-center gap-2 flex-1 rounded-lg border border-[#34415b] bg-[#071023] px-3 py-2 text-slate-200">
          <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teachers by name, subject, department, or class arm..."
            className="w-full bg-transparent text-xs text-white placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        {departments.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 flex-shrink-0">Department:</span>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="h-9 rounded-lg border border-[#34415b] bg-[#071023] px-3 text-xs text-white"
            >
              <option value="all">All Departments ({teachers.length})</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Faculty List / Empty State */}
      {teachers.length === 0 ? (
        <Card className="border border-dashed border-[#2a3852] bg-[#0c1628]/60 p-12 text-center">
          <CardContent className="space-y-4 max-w-md mx-auto">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#162945] text-[#71c9ed]">
              <Users className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">No Faculty Members Registered</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Add faculty members to assign departments, allocate subject duties, and appoint lead teachers across class arms.
              </p>
            </div>
            <Button
              onClick={() => setAddDialogOpen(true)}
              className="bg-[#2184a7] text-white hover:bg-[#2c9bc2] text-xs font-semibold"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add First Teacher
            </Button>
          </CardContent>
        </Card>
      ) : filteredTeachers.length === 0 ? (
        <div className="rounded-xl border border-[#233148] bg-[#0c1628] p-8 text-center text-xs text-slate-400">
          No faculty members match your search criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeachers.map((teacher) => (
            <Card
              key={teacher.id}
              className="border border-[#233148] bg-[#151e33] text-slate-100 hover:border-[#384c6e] transition-colors flex flex-col justify-between"
            >
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-white text-base truncate">{teacher.full_name}</h3>
                    <p className="text-xs text-[#71c9ed] truncate">{teacher.department || "Faculty Member"}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold border flex-shrink-0 ${
                      teacher.status === "Active"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                        : "border-slate-600 bg-slate-700/30 text-slate-400"
                    }`}
                  >
                    {teacher.status}
                  </span>
                </div>

                {/* Primary Subject */}
                {teacher.primary_subject && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-300">
                    <BookOpen className="h-3.5 w-3.5 text-[#58c4e8] flex-shrink-0" />
                    <span>Specialization: <strong className="text-white">{teacher.primary_subject}</strong></span>
                  </div>
                )}

                {/* Contact info if provided */}
                <div className="space-y-1 text-xs text-slate-400 border-t border-[#202b43] pt-2">
                  {teacher.email && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
                      <span className="truncate">{teacher.email}</span>
                    </div>
                  )}
                  {teacher.phone && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Phone className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
                      <span className="truncate">{teacher.phone}</span>
                    </div>
                  )}
                </div>

                {/* Assigned Class Arms */}
                <div className="space-y-1.5 pt-2 border-t border-[#233148] text-xs">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    <span>Allocated Class Arms:</span>
                    <span className="text-sky-300 font-semibold">
                      {teacher.assigned_classes.length} {teacher.assigned_classes.length === 1 ? "Class" : "Classes"}
                    </span>
                  </div>
                  {teacher.assigned_classes.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic">No class arms currently assigned.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {teacher.assigned_classes.map((clsName) => (
                        <span
                          key={clsName}
                          className="inline-flex items-center gap-1 rounded-md border border-[#34415b] bg-[#0c1628] px-2 py-0.5 text-[10px] text-slate-200"
                        >
                          <Building2 className="h-2.5 w-2.5 text-[#58c4e8]" />
                          {clsName}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Trigger */}
                <div className="pt-2 border-t border-[#202b43] flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedEditTeacher(teacher);
                      setEditDialogOpen(true);
                    }}
                    className="h-7 px-2.5 border-[#34415b] bg-[#0c1628] text-xs text-slate-200 hover:text-white hover:border-[#3bc2f3]"
                  >
                    <Edit2 className="mr-1 h-3 w-3" />
                    Edit & Allocate
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Teacher Dialog */}
      {school?.id && (
        <SchoolAddTeacherDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          schoolId={school.id}
          classes={classes}
          onCreated={() => refresh()}
        />
      )}

      {/* Edit Teacher Dialog */}
      {school?.id && (
        <SchoolEditTeacherDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          teacher={selectedEditTeacher}
          classes={classes}
          schoolId={school.id}
          onSaved={() => refresh()}
        />
      )}
    </SchoolLayout>
  );
}

export default SchoolTeachersPage;

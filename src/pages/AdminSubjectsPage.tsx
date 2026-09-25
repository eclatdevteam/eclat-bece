import { useState, useMemo } from "react";
import { useSubjects } from "@/hooks/useSubjects";
import { SubjectWithCounts, SubjectCategory } from "@/types/subject";
import { CreateSubjectDialog } from "@/components/admin/CreateSubjectDialog";
import { EditSubjectDialog } from "@/components/admin/EditSubjectDialog";
import { DeleteSubjectDialog } from "@/components/admin/DeleteSubjectDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  Plus,
  Search,
  RefreshCw,
  Edit,
  Trash2,
  GraduationCap,
  Layers,
  CheckCircle2,
  HelpCircle,
  Library,
  Sparkles,
} from "lucide-react";

export default function AdminSubjectsPage() {
  const {
    subjects,
    loading,
    refetch,
    createSubject,
    updateSubject,
    renameSubjectCascade,
    deleteSubject,
  } = useSubjects({ onlyActive: false, withCounts: true });

  const [search, setSearch] = useState("");
  const [cohortFilter, setCohortFilter] = useState<"all" | "year_6" | "year_9" | "both">("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "core" | "elective">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Modals state
  const [createOpen, setCreateOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectWithCounts | null>(null);
  const [deletingSubject, setDeletingSubject] = useState<SubjectWithCounts | null>(null);

  // Filtered subjects
  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) => {
      // Search
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesName = s.name.toLowerCase().includes(query);
        const matchesCode = s.code.toLowerCase().includes(query);
        if (!matchesName && !matchesCode) return false;
      }

      // Cohort
      if (cohortFilter === "year_6" && (!s.available_year_6 || s.available_year_9)) return false;
      if (cohortFilter === "year_9" && (!s.available_year_9 || s.available_year_6)) return false;
      if (cohortFilter === "both" && (!s.available_year_6 || !s.available_year_9)) return false;

      // Category
      if (categoryFilter !== "all" && s.category !== categoryFilter) return false;

      // Status
      if (statusFilter === "active" && !s.is_active) return false;
      if (statusFilter === "inactive" && s.is_active) return false;

      return true;
    });
  }, [subjects, search, cohortFilter, categoryFilter, statusFilter]);

  // Metric Computations
  const totalSubjects = subjects.length;
  const activeSubjects = subjects.filter((s) => s.is_active).length;
  const year6Subjects = subjects.filter((s) => s.available_year_6 && s.is_active).length;
  const year9Subjects = subjects.filter((s) => s.available_year_9 && s.is_active).length;
  const totalQuestions = subjects.reduce((sum, s) => sum + (s.total_count || 0), 0);

  const handleToggleActive = async (subject: SubjectWithCounts) => {
    await updateSubject(subject.id, { is_active: !subject.is_active });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <Library className="h-6 w-6 text-primary" />
            Curriculum & Subjects
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage academic subjects, assign cohort availability (Year 6 & Year 9), and track question volume.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="sm:self-center">
          <Plus className="h-4 w-4 mr-1.5" />
          Add New Subject
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="border shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Subjects</p>
              <p className="text-xl font-bold">{totalSubjects}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Active in Curriculum</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{activeSubjects}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-sky-500/10 flex items-center justify-center shrink-0">
              <GraduationCap className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Year 6 Subjects</p>
              <p className="text-xl font-bold">{year6Subjects}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
              <GraduationCap className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Year 9 Subjects</p>
              <p className="text-xl font-bold">{year9Subjects}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm col-span-2 sm:col-span-1">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
              <Layers className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Questions</p>
              <p className="text-xl font-bold">{totalQuestions.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by subject name or short code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            {/* Cohort Filter */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select value={cohortFilter} onValueChange={(v: any) => setCohortFilter(v)}>
                <SelectTrigger className="w-full sm:w-[150px] h-9 text-xs">
                  <SelectValue placeholder="Cohort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cohorts</SelectItem>
                  <SelectItem value="year_6">Year 6 Only</SelectItem>
                  <SelectItem value="year_9">Year 9 Only</SelectItem>
                  <SelectItem value="both">Both Year 6 & 9</SelectItem>
                </SelectContent>
              </Select>

              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={(v: any) => setCategoryFilter(v)}>
                <SelectTrigger className="w-full sm:w-[130px] h-9 text-xs">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="core">Core</SelectItem>
                  <SelectItem value="elective">Elective</SelectItem>
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                <SelectTrigger className="w-full sm:w-[120px] h-9 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Archived</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => refetch()}
                className="h-9 w-9 shrink-0"
                title="Refresh subjects"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subjects Data Table */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-[60px] text-center">#</TableHead>
              <TableHead className="w-[280px]">Subject Name & Code</TableHead>
              <TableHead className="w-[120px]">Category</TableHead>
              <TableHead className="w-[180px]">Applicable Cohorts</TableHead>
              <TableHead className="w-[180px]">Question Volume</TableHead>
              <TableHead className="w-[120px] text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
                  Loading curriculum subjects...
                </TableCell>
              </TableRow>
            ) : filteredSubjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <HelpCircle className="h-6 w-6 text-muted-foreground/60" />
                    <p className="font-medium text-sm">No subjects match your filters.</p>
                    <p className="text-xs text-muted-foreground">
                      Try clearing filters or click &quot;Add New Subject&quot; to create one.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredSubjects.map((subject, idx) => (
                <TableRow key={subject.id} className={!subject.is_active ? "opacity-60 bg-muted/20" : ""}>
                  <TableCell className="text-center text-xs text-muted-foreground font-mono">
                    {subject.display_order ?? idx + 1}
                  </TableCell>

                  {/* Name & Code */}
                  <TableCell>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{subject.name}</span>
                        <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider">
                          {subject.code}
                        </Badge>
                      </div>
                      {subject.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {subject.description}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  {/* Category */}
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`text-[11px] font-medium ${
                        subject.category === "core"
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300"
                      }`}
                    >
                      {subject.category === "core" ? "Core" : "Elective"}
                    </Badge>
                  </TableCell>

                  {/* Cohorts */}
                  <TableCell>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {subject.available_year_6 && (
                        <Badge variant="outline" className="bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300 text-[10px]">
                          Year 6
                        </Badge>
                      )}
                      {subject.available_year_9 && (
                        <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-[10px]">
                          Year 9
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  {/* Questions */}
                  <TableCell>
                    <div className="text-xs space-y-0.5">
                      <div className="font-semibold">
                        {(subject.total_count || 0).toLocaleString()} questions
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Y6: {(subject.year_6_count || 0).toLocaleString()} • Y9: {(subject.year_9_count || 0).toLocaleString()}
                      </div>
                    </div>
                  </TableCell>

                  {/* Active Toggle */}
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Switch
                        checked={subject.is_active}
                        onCheckedChange={() => handleToggleActive(subject)}
                        title={subject.is_active ? "Active" : "Archived"}
                      />
                    </div>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingSubject(subject)}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        title="Edit Subject"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingSubject(subject)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        title="Delete or Deactivate Subject"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs */}
      <CreateSubjectDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={createSubject}
        defaultDisplayOrder={subjects.length + 1}
      />

      <EditSubjectDialog
        subject={editingSubject}
        open={!!editingSubject}
        onOpenChange={(open) => !open && setEditingSubject(null)}
        onUpdate={updateSubject}
        onRenameCascade={renameSubjectCascade}
      />

      <DeleteSubjectDialog
        subject={deletingSubject}
        open={!!deletingSubject}
        onOpenChange={(open) => !open && setDeletingSubject(null)}
        onDelete={deleteSubject}
      />
    </div>
  );
}

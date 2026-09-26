import { useState, useEffect, useCallback } from "react";
import { Users, TrendingUp, Plus, Award, Target, ChevronRight, AlertTriangle, Search, Bell, Settings, BookOpen, FileText, Zap, BarChart3, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useParentAccount } from "@/hooks/useParentAccount";
import { StudentReportDialog } from "@/components/StudentReportDialog";
import { AssignPracticeDialog } from "@/components/AssignPracticeDialog";
import { ChildOverviewCard } from "@/components/parent/ChildOverviewCard";
import { DummyPaymentModal } from "@/components/parent/DummyPaymentModal";
import { ParentActivityFeed } from "@/components/parent/ParentActivityFeed";
import { DeleteChildDialog } from "@/components/parent/DeleteChildDialog";
import { AddChildDialog } from "@/components/parent/AddChildDialog";
import { EditChildNameDialog } from "@/components/parent/EditChildNameDialog";
import { EditChildUsernameDialog } from "@/components/parent/EditChildUsernameDialog";
import { ChangeChildPasswordDialog } from "@/components/parent/ChangeChildPasswordDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LinkedChild, ChildAnalytics, QuizResult, Assignment } from "@/types/parent";
import { getEdgeFunctionError } from "@/lib/errorUtils";
import { QuestionSnapshotDialog } from "@/components/quiz/QuestionSnapshotDialog";
import eclatlLogo from "@/assets/logo.png";

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export default function ParentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [reportOpen, setReportOpen] = useState(false);
  const [selectedChild, setSelectedChild] = useState<LinkedChild | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [addChildOpen, setAddChildOpen] = useState(false);
  const [linkedChildren, setLinkedChildren] = useState<LinkedChild[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [parentUserId, setParentUserId] = useState<string | null>(null);
  const [childrenAnalytics, setChildrenAnalytics] = useState<Map<string, ChildAnalytics>>(new Map());
  const [globalActivities, setGlobalActivities] = useState<QuizResult[]>([]);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPaymentChild, setSelectedPaymentChild] = useState<{ id: string; name: string } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [managedChild, setManagedChild] = useState<LinkedChild | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [editUsernameOpen, setEditUsernameOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [activeChildIndex, setActiveChildIndex] = useState(0);

  // Review Assignment Snapshot State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewSnapshot, setReviewSnapshot] = useState<{
    questions: any[];
    userResponses: (number | null)[];
    answers: boolean[];
    subjectName: string;
    childName: string;
  } | null>(null);
  const [loadingReview, setLoadingReview] = useState(false);

  const handleReviewAssignment = async (assignment: Assignment, childName: string) => {
    // 1. If questions_snapshot exists, use it directly with guaranteed chronological order
    if (assignment.questions_snapshot?.questions?.length) {
      const snap = assignment.questions_snapshot;
      const sortedQuestions = [...snap.questions].sort((a: any, b: any) => {
        const orderA = a.question_number ?? a.original_order ?? 0;
        const orderB = b.question_number ?? b.original_order ?? 0;
        return orderA - orderB;
      });

      const sortedAnswers = sortedQuestions.map((q: any, i: number) =>
        q.isCorrect !== undefined ? q.isCorrect : (snap.answers?.[i] ?? false)
      );
      const sortedResponses = sortedQuestions.map((q: any, i: number) =>
        q.userResponse !== undefined ? q.userResponse : (snap.userResponses?.[i] ?? null)
      );

      setReviewSnapshot({
        questions: sortedQuestions,
        userResponses: sortedResponses,
        answers: sortedAnswers,
        subjectName: assignment.subject,
        childName,
      });
      setReviewModalOpen(true);
      return;
    }

    // 2. Fallback: fetch matching questions for this assignment's topics and subject
    setLoadingReview(true);
    try {
      const { data: student } = await supabase
        .from("students")
        .select("class_year")
        .eq("id", assignment.student_id)
        .maybeSingle();

      const classYear = student?.class_year || "year_6";
      const tableName = classYear === "year_6" ? "quiz_questions_year6" : "quiz_questions_year9";
      const optionsTableName = classYear === "year_6" ? "quiz_options_year6" : "quiz_options_year9";
      const passageTableName = classYear === "year_6" ? "comprehension_passages_year6" : "comprehension_passages_year9";

      let query = supabase.from(tableName).select(`*, passage:${passageTableName}(title, passage_text)`);
      if (assignment.subject) query = query.eq("subject", assignment.subject);
      if (assignment.topics?.length) query = query.in("topic", assignment.topics);

      const { data: qData, error: qErr } = await query.limit(assignment.num_questions || 10);
      if (qErr || !qData || qData.length === 0) {
        toast.info("No question snapshot found for this assignment.");
        return;
      }

      const qIds = qData.map((q: any) => q.id);
      const { data: optData } = await supabase.from(optionsTableName as any).select("*").in("question_id", qIds).order("display_order");
      const optMap = (optData || []).reduce((acc: any, opt: any) => {
        if (!acc[opt.question_id]) acc[opt.question_id] = [];
        acc[opt.question_id].push(opt);
        return acc;
      }, {});

      const fallbackQuestions = qData.map((q: any) => {
        const opts = optMap[q.id] || [];
        const corrIdx = opts.findIndex((o: any) => o.is_correct);
        return {
          id: q.id,
          question: q.question_text,
          options: opts.map((o: any) => ({ text: o.option_text, image_url: o.image_url || null })),
          correctAnswer: corrIdx >= 0 ? corrIdx : 0,
          explanation: q.explanation || "No explanation provided.",
          subject: q.subject,
          image_url: q.image_url || null,
          passage: q.passage || null,
        };
      });

      setReviewSnapshot({
        questions: fallbackQuestions,
        userResponses: fallbackQuestions.map((q, i) => (assignment.score && assignment.score >= 50 ? q.correctAnswer : null)),
        answers: fallbackQuestions.map(() => true),
        subjectName: assignment.subject,
        childName,
      });
      setReviewModalOpen(true);
    } catch (err) {
      console.error("Error loading assignment review:", err);
      toast.error("Could not load question snapshot.");
    } finally {
      setLoadingReview(false);
    }
  };

  // Derived Top-Level Metrics
  const totalChildren = linkedChildren.length;
  const premiumChildrenCount = linkedChildren.filter(c => c.is_premium).length;

  let totalQuizzesGlobal = 0;
  let totalScoreGlobal = 0;

  childrenAnalytics.forEach(analytics => {
    totalQuizzesGlobal += analytics.totalQuizzes;
    totalScoreGlobal += (analytics.averageScore * analytics.totalQuizzes); // Weighted sum
  });

  const overallAverage = totalQuizzesGlobal > 0 ? Math.round(totalScoreGlobal / totalQuizzesGlobal) : 0;

  const { parentId, loading: parentAccountLoading } = useParentAccount();

  const fetchLinkedChildren = useCallback(async (pId: string) => {
    try {
      setGlobalActivities([]); // Reset global activities before fetching
      const { data, error } = await supabase
        .from("students")
        .select(`
          id,
          user_id,
          class_year,
          is_premium,
          profile:profiles(full_name, unique_id, username)
        `)
        .eq("parent_id", pId);

      if (error) throw error;

      if (data && data.length > 0) {
        const studentIds = data.map((c) => c.id);
        const nameMap = new Map(data.map((c) => [c.id, c.profile?.full_name || "Unknown"]));

        // Batched parallel queries for all linked children
        const [quizzesRes, assignmentsRes] = await Promise.all([
          supabase
            .from("quiz_results")
            .select("*")
            .in("student_id", studentIds)
            .order("completed_at", { ascending: false }),
          supabase
            .from("practice_assignments")
            .select("*")
            .in("student_id", studentIds)
            .order("created_at", { ascending: false }),
        ]);

        const allQuizzes = (quizzesRes.data || []) as QuizResult[];
        const allAssignments = (assignmentsRes.data || []) as Assignment[];

        const analyticsMap = new Map<string, ChildAnalytics>();
        studentIds.forEach((sId) => {
          const childQuizzes = allQuizzes.filter((q) => q.student_id === sId);
          if (childQuizzes.length > 0) {
            const averageScore = childQuizzes.reduce((acc, result) => acc + result.score, 0) / childQuizzes.length;
            const subjectMap = new Map<string, { totalScore: number; count: number }>();
            childQuizzes.forEach((result) => {
              const existing = subjectMap.get(result.subject) || { totalScore: 0, count: 0 };
              subjectMap.set(result.subject, {
                totalScore: existing.totalScore + result.score,
                count: existing.count + 1,
              });
            });

            const subjectPerformance = Array.from(subjectMap.entries()).map(([subject, subData]) => ({
              subject: subject.charAt(0).toUpperCase() + subject.slice(1),
              avgScore: Math.round(subData.totalScore / subData.count),
              count: subData.count,
            }));

            analyticsMap.set(sId, {
              studentId: sId,
              averageScore: Math.round(averageScore),
              totalQuizzes: childQuizzes.length,
              subjectPerformance,
              recentQuizzes: childQuizzes.slice(0, 5),
            });
          }
        });
        setChildrenAnalytics(analyticsMap);

        const childrenWithAssignments = (data as unknown as LinkedChild[]).map((child) => ({
          ...child,
          assignments: allAssignments.filter((a) => a.student_id === child.id).slice(0, 5),
        }));
        setLinkedChildren(childrenWithAssignments);

        const activitiesWithName = allQuizzes.map((q) => ({
          ...q,
          student_name: nameMap.get(q.student_id) || "Student",
        }));
        setGlobalActivities(activitiesWithName.slice(0, 3));
      } else {
        setLinkedChildren([]);
      }
    } catch (error) {
      console.error("Error fetching linked children:", error);
      toast.error("Failed to load linked children");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (parentId) {
      setParentUserId(parentId);
      fetchLinkedChildren(parentId);
    } else if (!parentAccountLoading) {
      setIsLoading(false);
    }
  }, [parentId, parentAccountLoading, fetchLinkedChildren]);

  const handleDeleteChild = async () => {
    if (!managedChild) return;

    setIsDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-student-account", {
        body: { studentId: managedChild.id },
      });

      if (error) {
        const message = await getEdgeFunctionError(error, "Failed to delete student account");
        throw new Error(message);
      }
      if (data?.error) throw new Error(data.error);

      toast.success(`${managedChild.profile.full_name}'s account deleted.`);
      setDeleteDialogOpen(false);
      setManagedChild(null);

      if (parentUserId) {
        await fetchLinkedChildren(parentUserId);
      }
    } catch (error: unknown) {
      console.error("Error deleting child:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete student account");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="animate-fade-in pb-12 px-2 sm:px-4">
      {/* Welcome Section */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
        <div className="space-y-1">
          <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">Parent Portal <span className="text-primary">.</span></h2>
          <p className="text-muted-foreground font-medium text-sm sm:text-base">Empowering your children's educational success with data-driven insights.</p>
        </div>
      </div>

      {/* Top-Level Overview Metrics */}
      {!isLoading && linkedChildren.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-12 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <Card className="border-border/50 shadow-sm bg-background/50 backdrop-blur-sm rounded-[2rem] overflow-hidden group hover:border-primary/30 transition-all duration-300">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-primary/10 rounded-2xl shrink-0 group-hover:scale-110 transition-transform duration-300">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total</p>
                <p className="text-2xl font-black text-foreground">{totalChildren}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 shadow-sm bg-background/50 backdrop-blur-sm rounded-[2rem] overflow-hidden group hover:border-green-500/30 transition-all duration-300">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-green-500/10 rounded-2xl shrink-0 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Performance</p>
                <p className="text-2xl font-black text-foreground">{overallAverage}%</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 shadow-sm bg-background/50 backdrop-blur-sm rounded-[2rem] overflow-hidden group hover:border-blue-500/30 transition-all duration-300">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-blue-500/10 rounded-2xl shrink-0 group-hover:scale-110 transition-transform duration-300">
                <Target className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Completed</p>
                <p className="text-2xl font-black text-foreground">{totalQuizzesGlobal}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 shadow-sm bg-background/50 backdrop-blur-sm rounded-[2rem] overflow-hidden group hover:border-amber-500/30 transition-all duration-300">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-amber-500/10 rounded-2xl shrink-0 group-hover:scale-110 transition-transform duration-300">
                <Award className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Status</p>
                <p className="text-xl font-black text-foreground leading-tight">
                  {premiumChildrenCount} <span className="text-xs font-bold text-muted-foreground opacity-60">PREMIUM</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Children Overview */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading your children...</p>
        </div>
      ) : linkedChildren.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="py-20 text-center flex flex-col items-center justify-center bg-gradient-to-b from-card to-muted/20">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <Users className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Welcome to your Parent Portal!</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto text-lg">
              Let's get started by creating an account for your child. Once connected, you can track their progress and assign practice.
            </p>
            <Button size="lg" variant="hero" onClick={() => setAddChildOpen(true)} className="text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
              <Plus className="mr-2" size={24} />
              Create First Child Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-12">
          {/* Activity Feed Section */}
          <div className="space-y-6 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1.5 bg-primary rounded-full" />
                <h3 className="text-2xl font-black text-foreground tracking-tight uppercase">Recent Activities</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard/parent/activities")}
                className="rounded-xl font-bold text-primary hover:bg-primary/10 transition-colors"
              >
                View All <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            <ParentActivityFeed activities={globalActivities} isLoading={isLoading} />
          </div>

          {/* My Children Section */}
          <div id="children" className="space-y-6 scroll-mt-24 animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1.5 bg-primary rounded-full" />
                <h3 className="text-2xl font-black text-foreground tracking-tight uppercase">My Children</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard/parent/children")}
                className="rounded-xl font-bold text-primary hover:bg-primary/10 transition-colors"
              >
                View All <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>

            {linkedChildren.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {linkedChildren.map((child, index) => {
                  const isActive = (activeChildIndex === index) || (activeChildIndex >= linkedChildren.length && index === 0);
                  return (
                    <Button
                      key={child.id}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveChildIndex(index)}
                      className={`rounded-xl font-bold text-xs transition-all ${isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'border-border/60 hover:bg-primary/10'}`}
                    >
                      {child.profile?.full_name || `Child ${index + 1}`}
                      {child.is_premium && (
                        <span className="ml-1.5 rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[9px] font-black text-amber-500">PRO</span>
                      )}
                    </Button>
                  );
                })}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6">
              {(() => {
                const effectiveIndex = activeChildIndex < linkedChildren.length ? activeChildIndex : 0;
                const child = linkedChildren[effectiveIndex];
                if (!child) return null;
                return (
                  <ChildOverviewCard
                    key={child.id}
                    child={child}
                    index={effectiveIndex}
                    analytics={childrenAnalytics.get(child.id)}
                    assignments={child.assignments}
                    onViewReport={(c) => {
                      setSelectedChild(c);
                      setReportOpen(true);
                    }}
                    onAssignPractice={(c) => {
                      setSelectedChild(c);
                      setAssignOpen(true);
                    }}
                    onUpgradePremium={(c) => {
                      setSelectedPaymentChild({ id: c.id, name: c.profile.full_name || "Unknown" });
                      setPaymentModalOpen(true);
                    }}
                    onDeleteChild={(c) => {
                      setManagedChild(c);
                      setDeleteDialogOpen(true);
                    }}
                    onEditName={(c) => {
                      setManagedChild(c);
                      setEditNameOpen(true);
                    }}
                    onEditUsername={(c) => {
                      setManagedChild(c);
                      setEditUsernameOpen(true);
                    }}
                    onChangePassword={(c) => {
                      setManagedChild(c);
                      setChangePasswordOpen(true);
                    }}
                    onReviewAssignment={handleReviewAssignment}
                  />
                );
              })()}
            </div>
          </div>
        </div>
      )}


      <StudentReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        studentId={selectedChild?.id || ""}
        studentName={selectedChild?.profile.full_name || ""}
        studentClass={selectedChild?.class_year === "year_6" ? "Year 6" : "Year 9"}
        avatar={selectedChild?.profile.full_name?.charAt(0).toUpperCase() || "?"}
      />
      <AssignPracticeDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        child={selectedChild}
      />

      <AddChildDialog
        open={addChildOpen}
        onOpenChange={setAddChildOpen}
        parentId={parentUserId}
        onSuccess={() => parentUserId && fetchLinkedChildren(parentUserId)}
      />

      <DummyPaymentModal
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        studentId={selectedPaymentChild?.id || ""}
        studentName={selectedPaymentChild?.name || ""}
        onSuccess={() => {
          if (parentUserId) fetchLinkedChildren(parentUserId);
        }}
      />

      <DeleteChildDialog
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        child={managedChild}
        onConfirm={handleDeleteChild}
        isDeleting={isDeleting}
      />

      <EditChildNameDialog
        open={editNameOpen}
        onOpenChange={setEditNameOpen}
        child={managedChild}
        onSuccess={() => parentUserId && fetchLinkedChildren(parentUserId)}
      />
      
      <EditChildUsernameDialog
        open={editUsernameOpen}
        onOpenChange={setEditUsernameOpen}
        child={managedChild}
        onSuccess={() => parentUserId && fetchLinkedChildren(parentUserId)}
      />

      <ChangeChildPasswordDialog
        open={changePasswordOpen}
        onOpenChange={setChangePasswordOpen}
        child={managedChild}
      />

      {/* Question Snapshot Review Dialog for Parent */}
      {reviewSnapshot && (
        <QuestionSnapshotDialog
          open={reviewModalOpen}
          onOpenChange={setReviewModalOpen}
          questions={reviewSnapshot.questions}
          userResponses={reviewSnapshot.userResponses}
          answers={reviewSnapshot.answers}
          subjectName={reviewSnapshot.subjectName}
          isParentView={true}
          childName={reviewSnapshot.childName}
        />
      )}
    </div>
  );
}

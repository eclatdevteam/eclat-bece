import { useState, useEffect, useCallback } from "react";
import { Users, Plus, LayoutDashboard, Search, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { StudentReportDialog } from "@/components/StudentReportDialog";
import { AssignPracticeDialog } from "@/components/AssignPracticeDialog";
import { ChildOverviewCard } from "@/components/parent/ChildOverviewCard";
import { DummyPaymentModal } from "@/components/parent/DummyPaymentModal";
import { AddChildDialog } from "@/components/parent/AddChildDialog";
import { DeleteChildDialog } from "@/components/parent/DeleteChildDialog";
import { EditChildNameDialog } from "@/components/parent/EditChildNameDialog";
import { EditChildUsernameDialog } from "@/components/parent/EditChildUsernameDialog";
import { ChangeChildPasswordDialog } from "@/components/parent/ChangeChildPasswordDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useParentAccount } from "@/hooks/useParentAccount";
import { LinkedChild, ChildAnalytics, Assignment, QuizResult } from "@/types/parent";
import { getEdgeFunctionError } from "@/lib/errorUtils";
import { QuestionSnapshotDialog } from "@/components/quiz/QuestionSnapshotDialog";

const getErrorMessage = (error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback;

export default function MyChildren() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { parentId, loading: parentAccountLoading } = useParentAccount();

    const [children, setChildren] = useState<LinkedChild[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [parentUserId, setParentUserId] = useState<string | null>(null);
    const [childrenAnalytics, setChildrenAnalytics] = useState<Map<string, ChildAnalytics>>(new Map());
    const [childrenAssignments, setChildrenAssignments] = useState<Map<string, Assignment[]>>(new Map());

    const [reportOpen, setReportOpen] = useState(false);
    const [assignOpen, setAssignOpen] = useState(false);
    const [addChildOpen, setAddChildOpen] = useState(false);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editNameOpen, setEditNameOpen] = useState(false);
    const [editUsernameOpen, setEditUsernameOpen] = useState(false);
    const [changePasswordOpen, setChangePasswordOpen] = useState(false);

    // Review Assignment Snapshot State
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [reviewSnapshot, setReviewSnapshot] = useState<{
        questions: any[];
        userResponses: (number | null)[];
        answers: boolean[];
        subjectName: string;
        childName: string;
    } | null>(null);

    const handleReviewAssignment = async (assignment: Assignment, childName: string) => {
        if (assignment.questions_snapshot?.questions?.length) {
            setReviewSnapshot({
                questions: assignment.questions_snapshot.questions,
                userResponses: assignment.questions_snapshot.userResponses || [],
                answers: assignment.questions_snapshot.answers || [],
                subjectName: assignment.subject,
                childName,
            });
            setReviewModalOpen(true);
            return;
        }

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
                userResponses: fallbackQuestions.map((q) => (assignment.score && assignment.score >= 50 ? q.correctAnswer : null)),
                answers: fallbackQuestions.map(() => true),
                subjectName: assignment.subject,
                childName,
            });
            setReviewModalOpen(true);
        } catch (err) {
            console.error("Error loading assignment review:", err);
            toast.error("Could not load question snapshot.");
        }
    };

    const [selectedChild, setSelectedChild] = useState<LinkedChild | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchChildren = useCallback(async (pId: string) => {
        try {
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

                // Batched parallel queries for all children
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

                const assignMap = new Map<string, Assignment[]>();
                const analyticsMap = new Map<string, ChildAnalytics>();

                studentIds.forEach((sId) => {
                    const childAssignments = allAssignments.filter((a) => a.student_id === sId);
                    assignMap.set(sId, childAssignments);

                    const childQuizzes = allQuizzes.filter((q) => q.student_id === sId);
                    const pending = childAssignments.filter((a) => a.status === "pending").length;
                    const completed = childAssignments.filter((a) => a.status === "completed").length;

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
                            recentQuizzes: childQuizzes.slice(0, 5) as QuizResult[],
                            pendingAssignments: pending,
                            completedAssignments: completed,
                        });
                    } else {
                        analyticsMap.set(sId, {
                            studentId: sId,
                            averageScore: 0,
                            totalQuizzes: 0,
                            subjectPerformance: [],
                            recentQuizzes: [],
                            pendingAssignments: pending,
                            completedAssignments: completed,
                        });
                    }
                });

                setChildren(data as unknown as LinkedChild[]);
                setChildrenAssignments(assignMap);
                setChildrenAnalytics(analyticsMap);
            } else {
                setChildren([]);
            }
        } catch (error) {
            console.error("Error fetching children:", error);
            toast.error("Failed to load students");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (parentId) {
            setParentUserId(parentId);
            fetchChildren(parentId);
        } else if (!parentAccountLoading) {
            setIsLoading(false);
        }
    }, [parentId, parentAccountLoading, fetchChildren]);

    const handleDeleteChild = async () => {
        if (!selectedChild) return;
        try {
            const { data, error } = await supabase.functions.invoke("delete-student-account", {
                body: { studentId: selectedChild.id },
            });
            if (error) {
                const message = await getEdgeFunctionError(error, "Failed to delete account");
                throw new Error(message);
            }
            if (data?.error) throw new Error(data.error);
            toast.success(`${selectedChild.profile.full_name}'s account deleted`);
            setDeleteDialogOpen(false);
            if (parentUserId) fetchChildren(parentUserId);
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Failed to delete account");
        }
    };

    const filteredChildren = children.filter(child =>
        child.profile.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        child.profile.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-6 space-y-8 animate-fade-in max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-border/40">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider text-xs">
                        <Users className="h-4 w-4" />
                        <span>Student Management</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-foreground">
                        My <span className="text-primary italic">Children</span>.
                    </h1>
                    <p className="text-muted-foreground font-medium max-w-md">
                        Manage your children's accounts, track individual progress, and assign dedicated practice.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button
                        onClick={() => navigate("/dashboard/parent")}
                        variant="outline"
                        className="rounded-2xl border-2 font-bold h-12 shadow-sm hover:bg-muted"
                    >
                        <LayoutDashboard className="mr-2 h-5 w-5" />
                        Dashboard
                    </Button>
                    <Button
                        onClick={() => setAddChildOpen(true)}
                        variant="hero"
                        className="rounded-2xl font-black h-12 shadow-xl shadow-primary/20 px-6"
                    >
                        <Plus className="mr-2 h-6 w-6" />
                        Add New Child
                    </Button>
                </div>
            </div>

            {/* Metrics Overivew */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="rounded-[2rem] border-2 border-primary/10 bg-primary/5 p-6 space-y-2">
                    <p className="text-xs font-black uppercase tracking-widest text-primary/60">Total Students</p>
                    <div className="flex items-baseline gap-2">
                        <p className="text-4xl font-black text-primary">{children.length}</p>
                        <p className="text-sm font-bold text-primary/40">Active</p>
                    </div>
                </Card>
                <Card className="rounded-[2rem] border-2 border-amber-500/10 bg-amber-500/5 p-6 space-y-2">
                    <p className="text-xs font-black uppercase tracking-widest text-amber-600/60">Premium Access</p>
                    <div className="flex items-baseline gap-2">
                        <p className="text-4xl font-black text-amber-600">{children.filter(c => c.is_premium).length}</p>
                        <p className="text-sm font-bold text-amber-600/40">Students</p>
                    </div>
                </Card>
            </div>

            {/* Search and Filters */}
            <div className="relative group max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                    placeholder="Search by name or username..."
                    className="pl-12 h-14 rounded-2xl border-2 focus:border-primary/50 text-base font-medium shadow-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Children Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[1, 2].map(i => <div key={i} className="h-64 rounded-[2.5rem] bg-muted animate-pulse border-2 border-border/50" />)}
                </div>
            ) : filteredChildren.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
                    {filteredChildren.map((child, index) => (
                        <ChildOverviewCard
                            key={child.id}
                            child={child}
                            index={index}
                            analytics={childrenAnalytics.get(child.id)}
                            assignments={childrenAssignments.get(child.id) || []}
                            onViewReport={(c) => {
                                setSelectedChild(c);
                                setReportOpen(true);
                            }}
                            onAssignPractice={(c) => {
                                setSelectedChild(c);
                                setAssignOpen(true);
                            }}
                            onUpgradePremium={(c) => {
                                setSelectedChild(c);
                                setPaymentModalOpen(true);
                            }}
                            onDeleteChild={(c) => {
                                setSelectedChild(c);
                                setDeleteDialogOpen(true);
                            }}
                            onEditName={(c) => {
                                setSelectedChild(c);
                                setEditNameOpen(true);
                            }}
                            onEditUsername={(c) => {
                                setSelectedChild(c);
                                setEditUsernameOpen(true);
                            }}
                            onChangePassword={(c) => {
                                setSelectedChild(c);
                                setChangePasswordOpen(true);
                            }}
                            onReviewAssignment={handleReviewAssignment}
                        />
                    ))}
                </div>
            ) : (
                <Card className="rounded-[2.5rem] border-3 border-dashed border-border/60 bg-muted/20 p-20 flex flex-col items-center justify-center text-center space-y-6">
                    <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-2">
                        <Users className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black tracking-tight">No students found</h2>
                        <p className="text-muted-foreground font-medium max-w-xs mx-auto text-lg leading-relaxed">
                            {searchQuery ? "Try a different search term or clear the filter." : "Start by adding your first child to track their progress."}
                        </p>
                    </div>
                    {!searchQuery && (
                        <Button onClick={() => setAddChildOpen(true)} variant="hero" className="rounded-2xl h-14 px-8 font-black text-lg shadow-xl shadow-primary/20">
                            <Plus className="mr-2 h-6 w-6" />
                            Add First Child
                        </Button>
                    )}
                </Card>
            )}

            {/* Dialogs */}
            <StudentReportDialog
                open={reportOpen}
                onOpenChange={setReportOpen}
                studentId={selectedChild?.id || ""}
                studentName={selectedChild?.profile.full_name || ""}
                studentClass={selectedChild?.class_year === "year_6" ? "Year 6" : "Year 9"}
                avatar={selectedChild?.profile.full_name?.charAt(0)}
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
                onSuccess={() => parentUserId && fetchChildren(parentUserId)}
            />

            <DummyPaymentModal
                open={paymentModalOpen}
                onOpenChange={setPaymentModalOpen}
                studentId={selectedChild?.id || ""}
                studentName={selectedChild?.profile.full_name || ""}
                onSuccess={() => parentUserId && fetchChildren(parentUserId)}
            />

            <DeleteChildDialog
                isOpen={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                child={selectedChild}
                onConfirm={handleDeleteChild}
                isDeleting={false}
            />

            <EditChildNameDialog
                open={editNameOpen}
                onOpenChange={setEditNameOpen}
                child={selectedChild}
                onSuccess={() => parentUserId && fetchChildren(parentUserId)}
            />

            <EditChildUsernameDialog
                open={editUsernameOpen}
                onOpenChange={setEditUsernameOpen}
                child={selectedChild ? { id: selectedChild.id, profile: { username: selectedChild.profile.username } } : null}
                onSuccess={() => parentUserId && fetchChildren(parentUserId)}
            />

            <ChangeChildPasswordDialog
                open={changePasswordOpen}
                onOpenChange={setChangePasswordOpen}
                child={selectedChild}
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

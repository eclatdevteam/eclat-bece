import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { Edit, CheckCircle, AlertTriangle, ShieldAlert, Loader2, ArrowLeft, RefreshCw, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { EditQuestionDialog } from "@/components/admin/EditQuestionDialog";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { queryKeys } from "@/lib/queryKeys";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const PAGE_SIZE = 50;

interface FlagReport {
    id: string;
    student_id: string;
    class_year: string;
    question_id: string;
    subject: string;
    topic: string | null;
    question_text: string;
    reason: string;
    details: string | null;
    status: string;
    uploaded_by: string | null;
    created_at: string;
    resolved_at: string | null;
    resolved_by: string | null;
    student?: {
        profile?: {
            full_name: string;
            email: string;
        } | null;
    } | null;
    resolver?: {
        full_name: string;
    } | null;
}

interface FlagReportsResult {
    rows: FlagReport[];
    total: number;
    uploaderNames: Record<string, string>;
}

type ResolveActionType = "resolved" | "dismissed";

export default function FlagReportsPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [statusFilter, setStatusFilter] = useState<string>("pending");
    const [classYearFilter, setClassYearFilter] = useState<string>("all");
    const [reasonFilter, setReasonFilter] = useState<string>("all");
    const [page, setPage] = useState(1);
    const [selectedQuestion, setSelectedQuestion] = useState<{ id: string; classYear: "year_6" | "year_9" } | null>(null);
    const [pendingAction, setPendingAction] = useState<{
        flagId: string;
        actionType: ResolveActionType;
        questionText: string;
    } | null>(null);

    const listKey = queryKeys.flagReports({
        status: statusFilter,
        classYear: classYearFilter,
        reason: reasonFilter,
        page,
    });

    const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
        queryKey: listKey,
        queryFn: async (): Promise<FlagReportsResult> => {
            const from = (page - 1) * PAGE_SIZE;

            let query = supabase
                .from("flagged_questions")
                .select(
                    `
                    id, student_id, class_year, question_id, subject, topic, question_text,
                    reason, details, status, uploaded_by, created_at, resolved_at, resolved_by,
                    student:students(
                        profile:profiles(
                            full_name,
                            email
                        )
                    ),
                    resolver:profiles!flagged_questions_resolved_by_fkey(full_name)
                `,
                    { count: "exact" }
                )
                .order("created_at", { ascending: false })
                .range(from, from + PAGE_SIZE - 1);

            if (statusFilter !== "all") {
                query = query.eq("status", statusFilter);
            }
            if (classYearFilter !== "all") {
                query = query.eq("class_year", classYearFilter);
            }
            if (reasonFilter !== "all") {
                query = query.eq("reason", reasonFilter);
            }

            const { data: rows, error: fetchError, count } = await query;
            if (fetchError) throw fetchError;

            const flags = (rows ?? []) as FlagReport[];

            // Resolve uploader display names for this page. The admins table's RLS
            // only lets an admin read their own row, so names come from a gated RPC.
            const uploaderIds = [
                ...new Set(flags.map((f) => f.uploaded_by).filter((id): id is string => !!id)),
            ];
            const uploaderNames: Record<string, string> = {};
            if (uploaderIds.length > 0) {
                const { data: nameRows, error: namesError } = await supabase.rpc(
                    "get_admin_display_names",
                    { p_user_ids: uploaderIds }
                );
                if (namesError) {
                    console.error("Error fetching uploader names:", namesError);
                } else if (nameRows) {
                    for (const row of nameRows) {
                        uploaderNames[row.user_id] = row.full_name;
                    }
                }
            }

            return { rows: flags, total: count ?? 0, uploaderNames };
        },
        placeholderData: keepPreviousData,
    });

    const { data: pendingCount = 0 } = useQuery({
        queryKey: queryKeys.flagReportsPendingCount(),
        queryFn: async () => {
            const { count, error } = await supabase
                .from("flagged_questions")
                .select("id", { count: "exact", head: true })
                .eq("status", "pending");
            if (error) throw error;
            return count ?? 0;
        },
    });

    const resolveMutation = useMutation({
        mutationFn: async ({ flag, actionType }: { flag: FlagReport; actionType: ResolveActionType }) => {
            if (!user) throw new Error("Not signed in");

            const { error: updateError } = await supabase
                .from("flagged_questions")
                .update({
                    status: actionType,
                    resolved_at: new Date().toISOString(),
                    resolved_by: user.id,
                })
                .eq("id", flag.id);
            if (updateError) throw updateError;

            // Audit trail (best-effort; must not fail the resolve itself)
            try {
                const { data: adminId } = await supabase.rpc("get_admin_id", { _user_id: user.id });
                await supabase.rpc("log_admin_action", {
                    _admin_id: adminId,
                    _action: actionType === "resolved" ? "resolve_flag" : "dismiss_flag",
                    _resource_type: "flag",
                    _resource_id: flag.id,
                    _details: {
                        class_year: flag.class_year,
                        reason: flag.reason,
                        question_id: flag.question_id,
                        question_text: flag.question_text.substring(0, 100),
                    },
                });
            } catch (logError) {
                console.error("Error logging flag action:", logError);
            }
        },
        onMutate: async ({ flag, actionType }) => {
            await queryClient.cancelQueries({ queryKey: listKey });
            const previous = queryClient.getQueryData(listKey);
            queryClient.setQueryData<FlagReportsResult>(listKey, (old) =>
                old
                    ? {
                          ...old,
                          rows: old.rows.map((f) =>
                              f.id === flag.id
                                  ? {
                                        ...f,
                                        status: actionType,
                                        resolved_at: new Date().toISOString(),
                                        resolved_by: user?.id ?? null,
                                    }
                                  : f
                          ),
                      }
                    : old
            );
            return { previous };
        },
        onError: (mutError, _vars, context) => {
            if (context?.previous) queryClient.setQueryData(listKey, context.previous);
            console.error("Error updating flag status:", mutError);
            toast.error(mutError instanceof Error ? mutError.message : "Failed to update report status");
        },
        onSuccess: (_result, { actionType }) => {
            toast.success(`Report marked as ${actionType}`);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["flag-reports"] });
        },
    });

    const flags = data?.rows ?? [];
    const total = data?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages) return;
        setPage(newPage);
    };

    const applyFilter = (setter: (value: string) => void) => (value: string) => {
        setter(value);
        setPage(1);
    };

    const getReasonLabel = (reason: string) => {
        switch (reason) {
            case "incorrect_answer":
                return "Incorrect Answer";
            case "typo":
                return "Typo/Formatting";
            case "missing_image":
                return "Missing Image";
            case "incomplete":
                return "Incomplete";
            case "other":
                return "Other";
            default:
                return reason;
        }
    };

    const getReasonColor = (reason: string) => {
        switch (reason) {
            case "incorrect_answer":
                return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
            case "typo":
                return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
            case "missing_image":
                return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
            case "incomplete":
                return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
            default:
                return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "pending":
                return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200";
            case "resolved":
                return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200";
            case "dismissed":
                return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200";
            default:
                return "bg-slate-100 text-slate-700";
        }
    };

    const emptyState =
        statusFilter === "pending"
            ? { title: "All clear!", body: "No pending flag reports found." }
            : statusFilter === "resolved"
              ? { title: "Nothing here yet", body: "No resolved reports match your filters." }
              : statusFilter === "dismissed"
                ? { title: "Nothing here yet", body: "No dismissed reports match your filters." }
                : { title: "All clear!", body: "No flag reports match your filters." };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Question Flag Reports</h1>
                        <p className="text-muted-foreground">
                            Review and resolve errors reported by students on quiz questions
                        </p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ["flag-reports"] })}
                >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-muted-foreground">Status:</span>
                            <Select value={statusFilter} onValueChange={applyFilter(setStatusFilter)}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Reports</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="resolved">Resolved</SelectItem>
                                    <SelectItem value="dismissed">Dismissed</SelectItem>
                                </SelectContent>
                            </Select>
                            {pendingCount > 0 && statusFilter !== "pending" && (
                                <Badge
                                    className="bg-amber-600 hover:bg-amber-600 text-white cursor-pointer"
                                    title="Show pending reports"
                                    onClick={() => applyFilter(setStatusFilter)("pending")}
                                >
                                    {pendingCount} pending
                                </Badge>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-muted-foreground">Class Year:</span>
                            <Select value={classYearFilter} onValueChange={applyFilter(setClassYearFilter)}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Class Year" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Years</SelectItem>
                                    <SelectItem value="year_6">Year 6</SelectItem>
                                    <SelectItem value="year_9">Year 9</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-muted-foreground">Reason:</span>
                            <Select value={reasonFilter} onValueChange={applyFilter(setReasonFilter)}>
                                <SelectTrigger className="w-[160px]">
                                    <SelectValue placeholder="Reason" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Reasons</SelectItem>
                                    <SelectItem value="incorrect_answer">Incorrect Answer</SelectItem>
                                    <SelectItem value="typo">Typo/Formatting</SelectItem>
                                    <SelectItem value="missing_image">Missing Image</SelectItem>
                                    <SelectItem value="incomplete">Incomplete</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* List */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 text-destructive" />
                        Report History
                    </CardTitle>
                    <CardDescription>
                        {total} {total === 1 ? "report" : "reports"} matching your filters
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="py-20 flex justify-center items-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : isError ? (
                        <div className="py-20 text-center text-muted-foreground space-y-3">
                            <AlertTriangle className="h-10 w-10 text-destructive/50 mx-auto" />
                            <p className="font-semibold text-foreground">Failed to load reports</p>
                            <p className="text-sm">
                                {error instanceof Error ? error.message : "Something went wrong."}
                            </p>
                            <Button variant="outline" size="sm" onClick={() => refetch()}>
                                <RefreshCw className="h-4 w-4 mr-1.5" />
                                Retry
                            </Button>
                        </div>
                    ) : flags.length === 0 ? (
                        <div className="py-20 text-center text-muted-foreground space-y-2">
                            <CheckCircle className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                            <p className="font-semibold text-lg">{emptyState.title}</p>
                            <p className="text-sm">{emptyState.body}</p>
                        </div>
                    ) : (
                        <>
                            <div
                                className={`border rounded-lg overflow-hidden transition-opacity ${
                                    isFetching ? "opacity-60" : ""
                                }`}
                            >
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Reported</TableHead>
                                            <TableHead>Class</TableHead>
                                            <TableHead>Question Text</TableHead>
                                            <TableHead>Student</TableHead>
                                            <TableHead>Uploaded By</TableHead>
                                            <TableHead>Reason</TableHead>
                                            <TableHead>Details</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {flags.map((flag) => (
                                            <TableRow key={flag.id} className="hover:bg-muted/10">
                                                <TableCell className="text-xs whitespace-nowrap">
                                                    {formatDistanceToNow(new Date(flag.created_at), { addSuffix: true })}
                                                </TableCell>
                                                <TableCell className="text-xs font-semibold uppercase">
                                                    {flag.class_year === "year_6" ? "Year 6" : "Year 9"}
                                                </TableCell>
                                                <TableCell className="max-w-[200px]">
                                                    <p className="text-sm font-medium line-clamp-2" title={flag.question_text}>
                                                        {flag.question_text}
                                                    </p>
                                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                                                        {flag.subject} &bull; {flag.topic || "Mixed"}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <p className="text-sm font-medium">
                                                        {flag.student?.profile?.full_name || "Unknown student"}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {flag.student?.profile?.email || ""}
                                                    </p>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                                    {flag.uploaded_by
                                                        ? data?.uploaderNames[flag.uploaded_by] ?? "Unknown"
                                                        : "—"}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={`border-none ${getReasonColor(flag.reason)}`}>
                                                        {getReasonLabel(flag.reason)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="max-w-[200px] text-sm text-muted-foreground italic">
                                                    {flag.details || "-"}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={getStatusColor(flag.status)}>
                                                        {flag.status}
                                                    </Badge>
                                                    {flag.status !== "pending" && (
                                                        <p className="text-xs text-muted-foreground mt-1 whitespace-nowrap">
                                                            {flag.resolver?.full_name ?? "Unknown"}
                                                            {flag.resolved_at &&
                                                                ` · ${formatDistanceToNow(new Date(flag.resolved_at), { addSuffix: true })}`}
                                                        </p>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 gap-1.5"
                                                            onClick={() => setSelectedQuestion({
                                                                id: flag.question_id,
                                                                classYear: flag.class_year as "year_6" | "year_9"
                                                            })}
                                                        >
                                                            <Edit className="h-3.5 w-3.5" />
                                                            Edit
                                                        </Button>
                                                        {flag.status === "pending" && (
                                                            <>
                                                                <Button
                                                                    variant="default"
                                                                    size="sm"
                                                                    className="h-8 gap-1 bg-green-600 hover:bg-green-700 text-white"
                                                                    onClick={() => setPendingAction({
                                                                        flagId: flag.id,
                                                                        actionType: "resolved",
                                                                        questionText: flag.question_text
                                                                    })}
                                                                >
                                                                    <CheckCircle className="h-3.5 w-3.5" />
                                                                    Resolve
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 gap-1 text-destructive hover:bg-destructive/10"
                                                                    onClick={() => setPendingAction({
                                                                        flagId: flag.id,
                                                                        actionType: "dismissed",
                                                                        questionText: flag.question_text
                                                                    })}
                                                                >
                                                                    <XCircle className="h-3.5 w-3.5" />
                                                                    Dismiss
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between mt-4">
                                    <div className="text-sm text-muted-foreground">
                                        Showing {(page - 1) * PAGE_SIZE + 1} to{" "}
                                        {Math.min(page * PAGE_SIZE, total)} of {total} reports
                                    </div>
                                    <Pagination className="justify-end w-auto mx-0">
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    onClick={() => handlePageChange(page - 1)}
                                                    className={
                                                        page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
                                                    }
                                                />
                                            </PaginationItem>

                                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                                .filter(
                                                    (p) =>
                                                        p === 1 ||
                                                        p === totalPages ||
                                                        (p >= page - 1 && p <= page + 1)
                                                )
                                                .map((p, index, array) => (
                                                    <div key={p} className="flex items-center">
                                                        {index > 0 && array[index - 1] !== p - 1 && (
                                                            <PaginationItem>
                                                                <span className="px-2 text-muted-foreground">...</span>
                                                            </PaginationItem>
                                                        )}
                                                        <PaginationItem>
                                                            <PaginationLink
                                                                isActive={page === p}
                                                                onClick={() => handlePageChange(p)}
                                                                className="cursor-pointer"
                                                            >
                                                                {p}
                                                            </PaginationLink>
                                                        </PaginationItem>
                                                    </div>
                                                ))}

                                            <PaginationItem>
                                                <PaginationNext
                                                    onClick={() => handlePageChange(page + 1)}
                                                    className={
                                                        page === totalPages
                                                            ? "pointer-events-none opacity-50"
                                                            : "cursor-pointer"
                                                    }
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Confirmation Dialog for Resolve / Dismiss */}
            <AlertDialog
                open={!!pendingAction}
                onOpenChange={(open) => {
                    if (!open && !resolveMutation.isPending) setPendingAction(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {pendingAction?.actionType === "resolved"
                                ? "Mark Report as Resolved?"
                                : "Dismiss Question Report?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3">
                            <span className="block text-sm text-muted-foreground">
                                {pendingAction?.actionType === "resolved"
                                    ? "Are you sure you want to mark this flagged question report as resolved? This confirms that the issue has been inspected or addressed."
                                    : "Are you sure you want to dismiss this flagged question report? The report will be closed without modifications."}
                            </span>
                            {pendingAction?.questionText && (
                                <div className="p-3 bg-muted rounded-md text-xs italic text-foreground line-clamp-3">
                                    "{pendingAction.questionText}"
                                </div>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={resolveMutation.isPending}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            disabled={resolveMutation.isPending}
                            className={
                                pendingAction?.actionType === "resolved"
                                    ? "bg-green-600 hover:bg-green-700 text-white"
                                    : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            }
                            onClick={(e) => {
                                e.preventDefault();
                                if (!pendingAction) return;
                                const flag = flags.find((f) => f.id === pendingAction.flagId);
                                if (flag) {
                                    resolveMutation.mutate({ flag, actionType: pendingAction.actionType });
                                }
                            }}
                        >
                            {resolveMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                            {pendingAction?.actionType === "resolved" ? "Confirm Resolve" : "Confirm Dismiss"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Edit Question Dialog Integration */}
            {selectedQuestion && (
                <EditQuestionDialog
                    open={!!selectedQuestion}
                    onOpenChange={(open) => !open && setSelectedQuestion(null)}
                    questionId={selectedQuestion.id}
                    classYear={selectedQuestion.classYear}
                    onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ["flag-reports"] });
                        setSelectedQuestion(null);
                    }}
                />
            )}
        </div>
    );
}

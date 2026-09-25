import { useState, useEffect, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Loader2,
    CheckCircle2,
    AlertTriangle,
    Copy,
    Trash2,
    RefreshCw,
    Sparkles,
    EyeOff,
    Check,
    Image as ImageIcon,
    FileText,
    BookOpen
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { useSubjects } from "@/hooks/useSubjects";

export interface QuestionOption {
    id: string;
    option_text: string;
    is_correct: boolean;
    display_order: number;
}

export interface DuplicateQuestion {
    id: string;
    subject: string;
    topic: string;
    difficulty: string;
    question_text: string;
    correct_answer: string;
    explanation?: string | null;
    passage_id?: string | null;
    passage_title?: string | null;
    image_url?: string | null;
    created_at: string;
    options: QuestionOption[];
}

export interface DuplicateCluster {
    cluster_id: string;
    match_type: "exact_clone" | "same_prompt" | "fuzzy" | "exact";
    similarity_score: number;
    subject: string;
    questions: DuplicateQuestion[];
}

interface DuplicateQuestionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    classYear: "year_6" | "year_9";
    onClassYearChange: (classYear: "year_6" | "year_9") => void;
    onResolved: () => void;
}

export function DuplicateQuestionsModal({
    isOpen,
    onClose,
    classYear,
    onClassYearChange,
    onResolved,
}: DuplicateQuestionsModalProps) {
    const [clusters, setClusters] = useState<DuplicateCluster[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [subjectFilter, setSubjectFilter] = useState<string>("all");
    const { subjects } = useSubjects({ classYear, onlyActive: false });
    const [matchTypeFilter, setMatchTypeFilter] = useState<"all" | "exact_clone" | "same_prompt" | "fuzzy">("all");
    const [selectedCanonicals, setSelectedCanonicals] = useState<Record<string, string>>({});
    const [resolvingClusterId, setResolvingClusterId] = useState<string | null>(null);
    const [isAutoMerging, setIsAutoMerging] = useState(false);
    const [showAutoMergeConfirm, setShowAutoMergeConfirm] = useState(false);

    const fetchClusters = useCallback(async () => {
        setLoading(true);
        setFetchError(null);
        setClusters([]);
        try {
            const { data, error } = await supabase.rpc("find_duplicate_question_clusters", {
                p_class_year: classYear,
                p_subject: subjectFilter === "all" ? null : subjectFilter,
                p_match_type: matchTypeFilter,
                p_threshold: 0.85,
            });

            if (error) throw error;

            const fetchedClusters: DuplicateCluster[] = (data as any) || [];
            setClusters(fetchedClusters);

            // Initialize default canonical question for each cluster (the first one is sorted by best explanation)
            const initialCanonicals: Record<string, string> = {};
            fetchedClusters.forEach((cluster) => {
                if (cluster.questions.length > 0) {
                    initialCanonicals[cluster.cluster_id] = cluster.questions[0].id;
                }
            });
            setSelectedCanonicals(initialCanonicals);
        } catch (error: any) {
            console.error("Error fetching duplicate question clusters:", error);
            setFetchError(error.message || "Failed to load duplicate questions");
            toast.error(error.message || "Failed to load duplicate questions");
        } finally {
            setLoading(false);
        }
    }, [classYear, subjectFilter, matchTypeFilter]);

    useEffect(() => {
        if (isOpen) {
            fetchClusters();
        }
    }, [isOpen, fetchClusters]);

    const handleSelectCanonical = (clusterId: string, questionId: string) => {
        setSelectedCanonicals((prev) => ({
            ...prev,
            [clusterId]: questionId,
        }));
    };

    const handleResolveCluster = async (cluster: DuplicateCluster) => {
        const canonicalId = selectedCanonicals[cluster.cluster_id] || cluster.questions[0]?.id;
        if (!canonicalId) return;

        const duplicateIds = cluster.questions
            .map((q) => q.id)
            .filter((id) => id !== canonicalId);

        if (duplicateIds.length === 0) return;

        setResolvingClusterId(cluster.cluster_id);
        try {
            const { data, error } = await supabase.rpc("resolve_duplicate_questions", {
                p_class_year: classYear,
                p_canonical_id: canonicalId,
                p_duplicate_ids: duplicateIds,
                p_action: "merge",
            });

            if (error) throw error;

            toast.success(`Merged ${duplicateIds.length} duplicate question(s) into canonical version.`);
            setClusters((prev) => prev.filter((c) => c.cluster_id !== cluster.cluster_id));
            onResolved();
        } catch (error: any) {
            console.error("Error resolving duplicate questions:", error);
            toast.error(error.message || "Failed to resolve duplicates");
        } finally {
            setResolvingClusterId(null);
        }
    };

    const handleIgnoreCluster = async (cluster: DuplicateCluster) => {
        if (cluster.questions.length < 2) return;
        setResolvingClusterId(cluster.cluster_id);
        try {
            const questionIds = cluster.questions.map((q) => q.id);

            const { error } = await supabase.rpc("ignore_duplicate_cluster", {
                p_class_year: classYear,
                p_question_ids: questionIds,
            });

            if (error) throw error;

            toast.success("Marked as good to go. These questions will not be flagged as duplicates in future scans.");
            setClusters((prev) => prev.filter((c) => c.cluster_id !== cluster.cluster_id));
        } catch (error: any) {
            console.error("Error ignoring duplicate cluster:", error);
            toast.error(error.message || "Failed to mark as good to go");
        } finally {
            setResolvingClusterId(null);
        }
    };

    const handleAutoMergeAllExact = async () => {
        setIsAutoMerging(true);
        setShowAutoMergeConfirm(false);
        try {
            const { data, error } = await supabase.rpc("auto_merge_all_exact_duplicates", {
                p_class_year: classYear,
            });

            if (error) throw error;

            const result = data as any;
            toast.success(
                `Auto-merge complete! Merged ${result.clusters_merged || 0} clusters and removed ${result.duplicates_removed || 0} duplicate questions.`
            );
            fetchClusters();
            onResolved();
        } catch (error: any) {
            console.error("Error running auto-merge:", error);
            toast.error(error.message || "Failed to auto-merge exact duplicates");
        } finally {
            setIsAutoMerging(false);
        }
    };

    const exactCloneCount = clusters.filter((c) => c.match_type === "exact_clone" || c.match_type === "exact").length;
    const samePromptCount = clusters.filter((c) => c.match_type === "same_prompt").length;
    const fuzzyCount = clusters.filter((c) => c.match_type === "fuzzy").length;

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="max-w-5xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0">
                    <DialogHeader className="p-6 pb-4 border-b">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <DialogTitle className="text-2xl font-bold">Duplicate Questions Resolution</DialogTitle>
                                    <Badge variant="outline" className="text-xs uppercase font-semibold">
                                        {classYear === "year_6" ? "Year 6" : "Year 9"}
                                    </Badge>
                                </div>
                                <DialogDescription className="mt-1">
                                    Detect, review side-by-side, and resolve duplicate or highly similar questions across the question bank.
                                </DialogDescription>
                            </div>

                            {exactCloneCount > 0 && (
                                <Button
                                    variant="default"
                                    className="bg-amber-600 hover:bg-amber-700 text-white font-medium shrink-0 flex items-center gap-2"
                                    onClick={() => setShowAutoMergeConfirm(true)}
                                    disabled={isAutoMerging || loading}
                                >
                                    {isAutoMerging ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Sparkles className="h-4 w-4" />
                                    )}
                                    Auto-Merge Exact Clones ({exactCloneCount})
                                </Button>
                            )}
                        </div>

                        {/* Filter Bar */}
                        <div className="flex flex-wrap items-center gap-3 pt-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-muted-foreground">Class:</span>
                                <Select value={classYear} onValueChange={(val: any) => onClassYearChange(val)}>
                                    <SelectTrigger className="w-[110px] h-8 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="year_6">Year 6</SelectItem>
                                        <SelectItem value="year_9">Year 9</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-muted-foreground">Subject:</span>
                                <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                                    <SelectTrigger className="w-[160px] h-8 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Subjects</SelectItem>
                                        {subjects.map((sub) => (
                                            <SelectItem key={sub.id} value={sub.name}>
                                                {sub.icon} {sub.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-muted-foreground">Type:</span>
                                <Select value={matchTypeFilter} onValueChange={(v: any) => setMatchTypeFilter(v)}>
                                    <SelectTrigger className="w-[170px] h-8 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types ({clusters.length})</SelectItem>
                                        <SelectItem value="exact_clone">Exact Clones ({exactCloneCount})</SelectItem>
                                        <SelectItem value="same_prompt">Same Prompt ({samePromptCount})</SelectItem>
                                        <SelectItem value="fuzzy">Fuzzy Matches ({fuzzyCount})</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-xs ml-auto"
                                onClick={fetchClusters}
                                disabled={loading}
                            >
                                <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
                                Refresh
                            </Button>
                        </div>

                        {matchTypeFilter === "fuzzy" && subjectFilter === "all" && (
                            <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 rounded px-2.5 py-1 flex items-center gap-1.5">
                                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                <span>Tip: Selecting a specific subject will significantly speed up fuzzy scanning across large question pools.</span>
                            </div>
                        )}
                    </DialogHeader>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-hidden bg-slate-50 dark:bg-slate-950/40 p-6">
                        {loading ? (
                            <div className="h-full flex flex-col items-center justify-center gap-3">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p className="text-sm text-muted-foreground">Scanning question bank for duplicates...</p>
                            </div>
                        ) : fetchError ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
                                    <AlertTriangle className="h-6 w-6 text-destructive" />
                                </div>
                                <h3 className="text-lg font-semibold text-destructive">Failed to Load Duplicates</h3>
                                <p className="text-sm text-muted-foreground max-w-md mt-1 mb-4">
                                    {fetchError}
                                </p>
                                <Button variant="outline" size="sm" onClick={fetchClusters}>
                                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                                    Try Again
                                </Button>
                            </div>
                        ) : clusters.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center mb-3">
                                    <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                                <h3 className="text-lg font-semibold">No Duplicates Found!</h3>
                                <p className="text-sm text-muted-foreground max-w-md mt-1">
                                    Great news! There are no unresolved duplicate questions detected for {classYear === "year_6" ? "Year 6" : "Year 9"} under the selected filters.
                                </p>
                            </div>
                        ) : (
                            <ScrollArea className="h-full pr-4">
                                <div className="space-y-6 pb-6">
                                    {clusters.map((cluster, index) => {
                                        const canonicalId = selectedCanonicals[cluster.cluster_id] || cluster.questions[0]?.id;
                                        const isResolving = resolvingClusterId === cluster.cluster_id;

                                        return (
                                            <Card key={cluster.cluster_id} className="border shadow-sm overflow-hidden bg-white dark:bg-slate-900">
                                                <CardHeader className="p-4 bg-slate-100/60 dark:bg-slate-800/60 border-b flex flex-row items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-semibold text-muted-foreground">
                                                            Cluster #{index + 1}
                                                        </span>
                                                        {cluster.match_type === "exact_clone" || cluster.match_type === "exact" ? (
                                                            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                                                                100% Exact Clone
                                                            </Badge>
                                                        ) : cluster.match_type === "same_prompt" ? (
                                                            <Badge className="bg-sky-600 hover:bg-sky-700 text-white text-xs">
                                                                Same Prompt (Different Answers)
                                                            </Badge>
                                                        ) : (
                                                            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 border-amber-300 text-xs">
                                                                {`Fuzzy Match (${Math.round(cluster.similarity_score * 100)}% Similarity)`}
                                                            </Badge>
                                                        )}
                                                        <Badge variant="outline" className="text-xs">
                                                            {cluster.subject}
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground">
                                                            • {cluster.questions.length} matching questions
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-7 text-xs text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                                                            onClick={() => handleIgnoreCluster(cluster)}
                                                            disabled={isResolving}
                                                            title="Mark as distinct questions and permanently remember not to bring them up as duplicates again"
                                                        >
                                                            <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600 dark:text-emerald-400" />
                                                            Mark as Good (Keep All)
                                                        </Button>

                                                        <Button
                                                            variant="default"
                                                            size="sm"
                                                            className="h-7 text-xs bg-primary hover:bg-primary/90"
                                                            onClick={() => handleResolveCluster(cluster)}
                                                            disabled={isResolving}
                                                        >
                                                            {isResolving ? (
                                                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                                            ) : (
                                                                <Check className="h-3 w-3 mr-1" />
                                                            )}
                                                            Keep Selected & Merge ({cluster.questions.length - 1} removed)
                                                        </Button>
                                                    </div>
                                                </CardHeader>

                                                <CardContent className="p-4">
                                                    <p className="text-xs text-muted-foreground mb-3">
                                                        {cluster.match_type === "same_prompt" ? (
                                                            <>
                                                                These questions share the same instruction prompt but have different answers/options. If they are genuine distinct questions, click <strong className="text-emerald-600 dark:text-emerald-400">"Mark as Good (Keep All)"</strong> to permanently dismiss this cluster. Otherwise, select which version to keep.
                                                            </>
                                                        ) : (
                                                            <>
                                                                Select which version to <strong className="text-foreground">keep as the canonical question</strong>. The redundant copies will be merged and safely removed, or click <strong className="text-emerald-600 dark:text-emerald-400">"Mark as Good (Keep All)"</strong> to keep all copies.
                                                            </>
                                                        )}
                                                    </p>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {cluster.questions.map((q, qIndex) => {
                                                            const isCanonical = q.id === canonicalId;
                                                            return (
                                                                <div
                                                                    key={q.id}
                                                                    onClick={() => handleSelectCanonical(cluster.cluster_id, q.id)}
                                                                    className={`relative rounded-lg border p-4 cursor-pointer transition-all ${
                                                                        isCanonical
                                                                            ? "border-primary bg-primary/[0.03] shadow-sm ring-2 ring-primary/20"
                                                                            : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/20"
                                                                    }`}
                                                                >
                                                                    {/* Canonical selector radio */}
                                                                    <div className="flex items-start justify-between gap-2 mb-2">
                                                                        <div className="flex items-center gap-2">
                                                                            <div
                                                                                className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                                                                                    isCanonical
                                                                                        ? "border-primary bg-primary text-primary-foreground"
                                                                                        : "border-muted-foreground/40 bg-background"
                                                                                }`}
                                                                            >
                                                                                {isCanonical && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                                                                            </div>
                                                                            <span className={`text-xs font-semibold ${isCanonical ? "text-primary font-bold" : "text-muted-foreground"}`}>
                                                                                {isCanonical ? "★ Keep this Canonical Version" : `Option #${qIndex + 1} (Will be removed)`}
                                                                            </span>
                                                                        </div>

                                                                        <div className="flex items-center gap-1.5">
                                                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
                                                                                {q.difficulty}
                                                                            </Badge>
                                                                            <span className="text-[10px] text-muted-foreground">
                                                                                {format(new Date(q.created_at), "MMM d, yyyy")}
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    {/* Passage Info if any */}
                                                                    {q.passage_title && (
                                                                        <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-1 rounded mb-2">
                                                                            <BookOpen className="h-3.5 w-3.5" />
                                                                            <span className="font-medium truncate">Passage: {q.passage_title}</span>
                                                                        </div>
                                                                    )}

                                                                    {/* Question Prompt */}
                                                                    <div className="text-sm font-medium text-foreground mb-3 whitespace-pre-wrap">
                                                                        {q.question_text}
                                                                    </div>

                                                                    {/* Image Thumbnail if any */}
                                                                    {q.image_url && (
                                                                        <div className="mb-3 rounded overflow-hidden border max-w-xs">
                                                                            <img src={q.image_url} alt="Question Diagram" className="h-28 w-auto object-contain bg-white" />
                                                                        </div>
                                                                    )}

                                                                    {/* Options preview */}
                                                                    <div className="space-y-1.5 mb-3">
                                                                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                                                            Answer Options
                                                                        </span>
                                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                                                            {q.options?.map((opt) => (
                                                                                <div
                                                                                    key={opt.id}
                                                                                    className={`text-xs px-2.5 py-1.5 rounded flex items-center justify-between border ${
                                                                                        opt.is_correct
                                                                                            ? "bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-medium"
                                                                                            : "bg-background border-slate-200 dark:border-slate-800 text-muted-foreground"
                                                                                    }`}
                                                                                >
                                                                                    <span className="truncate mr-1">{opt.option_text}</span>
                                                                                    {opt.is_correct && <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>

                                                                    {/* Explanation */}
                                                                    <div className="text-xs text-muted-foreground bg-slate-100/80 dark:bg-slate-800/80 p-2 rounded">
                                                                        <span className="font-semibold text-foreground">Explanation: </span>
                                                                        {q.explanation?.trim() ? q.explanation : <em className="italic text-muted-foreground/70">None provided</em>}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </ScrollArea>
                        )}
                    </div>

                    <DialogFooter className="p-4 border-t bg-background flex flex-row items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                            Found <strong className="text-foreground">{clusters.length}</strong> total duplicate clusters ({exactCloneCount} exact clones, {samePromptCount} shared prompts, {fuzzyCount} fuzzy).
                        </div>
                        <Button variant="outline" onClick={onClose}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Auto-Merge Confirmation Modal */}
            <AlertDialog open={showAutoMergeConfirm} onOpenChange={setShowAutoMergeConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Auto-Merge All Exact Duplicate Questions?</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                            <p>
                                This will automatically analyze all <strong>{exactCloneCount} exact clone clusters</strong> in {classYear === "year_6" ? "Year 6" : "Year 9"} where both the question text and correct answers are identical.
                            </p>
                            <p>
                                For every cluster, the system will retain the canonical version with the most complete explanation and oldest creation date, re-link any flagged question references, and permanently remove the redundant duplicates.
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Questions sharing an instruction prompt with different answers ({samePromptCount} clusters) are <strong>excluded and kept safe</strong>.
                            </p>
                            <p className="font-semibold text-amber-600 dark:text-amber-400">
                                This action is safe and irreversible.
                            </p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleAutoMergeAllExact}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-medium"
                        >
                            Yes, Auto-Merge All Exact Clones ({exactCloneCount})
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

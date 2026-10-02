import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Loader2,
    Save,
    CheckCircle2,
    AlertCircle,
    MessageSquareText,
    Trash2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
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

// ─── Passage Form Schema ───────────────────────────────
const passageFormSchema = z.object({
    title: z.string().min(1, "Title is required"),
    passageText: z.string().min(10, "Passage must be at least 10 characters"),
});

// ─── Question + Options Types ──────────────────────────
interface QuestionOption {
    id: string;
    option_text: string;
    is_correct: boolean;
    display_order: number | null;
}

interface LinkedQuestion {
    id: string;
    question_text: string;
    correct_answer: string;
    explanation: string | null;
    difficulty: string | null;
    subject: string;
    topic: string | null;
    options: QuestionOption[];
}

// ─── Editable question state (local, unsaved) ─────────
interface EditableQuestion {
    id: string;
    question_text: string;
    correct_answer: string;
    explanation: string;
    options: { id: string; text: string; isCorrect: boolean }[];
    dirty: boolean;
    saving: boolean;
}

interface EditPassageDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    passageId: string;
    classYear: "year_6" | "year_9";
    onSuccess: () => void;
}

export function EditPassageDialog({
    open,
    onOpenChange,
    passageId,
    classYear,
    onSuccess,
}: EditPassageDialogProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(false);
    const [questions, setQuestions] = useState<EditableQuestion[]>([]);
    const [deleteQuestionId, setDeleteQuestionId] = useState<string | null>(null);

    const passageForm = useForm<z.infer<typeof passageFormSchema>>({
        resolver: zodResolver(passageFormSchema),
        defaultValues: { title: "", passageText: "" },
    });

    const passageLength = passageForm.watch("passageText")?.length || 0;

    // ─── Table name helpers ────────────────────────────
    const passageTable =
        classYear === "year_6"
            ? "comprehension_passages_year6"
            : "comprehension_passages_year9";
    const questionsTable =
        classYear === "year_6" ? "quiz_questions_year6" : "quiz_questions_year9";
    const optionsTable =
        classYear === "year_6" ? "quiz_options_year6" : "quiz_options_year9";

    // ─── Fetch passage + linked questions on open ──────
    useEffect(() => {
        if (open && passageId) {
            fetchData();
        }
    }, [open, passageId]);

    const fetchData = async () => {
        setFetchingData(true);
        try {
            // 1. Fetch passage
            const { data: passage, error: passageErr } = await supabase
                .from(passageTable)
                .select("*")
                .eq("id", passageId)
                .single();

            if (passageErr) throw passageErr;
            if (!passage) {
                toast.error("Passage not found");
                onOpenChange(false);
                return;
            }

            passageForm.reset({
                title: passage.title || "",
                passageText: passage.passage_text || "",
            });

            // 2. Fetch linked questions
            const { data: questionsData, error: questionsErr } = await supabase
                .from(questionsTable)
                .select("*")
                .eq("passage_id", passageId)
                .order("created_at", { ascending: true });

            if (questionsErr) throw questionsErr;

            // 3. Fetch options for each question
            const questionIds = (questionsData || []).map((q: any) => q.id);
            let allOptions: any[] = [];
            if (questionIds.length > 0) {
                const { data: optionsData, error: optionsErr } = await supabase
                    .from(optionsTable)
                    .select("*")
                    .in("question_id", questionIds)
                    .order("display_order", { ascending: true });

                if (optionsErr) throw optionsErr;
                allOptions = optionsData || [];
            }

            // 4. Map to editable state
            const editableQuestions: EditableQuestion[] = (questionsData || []).map(
                (q: any) => {
                    const qOptions = allOptions.filter(
                        (o: any) => o.question_id === q.id
                    );
                    return {
                        id: q.id,
                        question_text: q.question_text || "",
                        correct_answer: q.correct_answer || "",
                        explanation: q.explanation || "",
                        options: qOptions.map((o: any) => ({
                            id: o.id,
                            text: o.option_text || "",
                            isCorrect: !!o.is_correct,
                        })),
                        dirty: false,
                        saving: false,
                    };
                }
            );

            setQuestions(editableQuestions);
        } catch (error: any) {
            console.error("Error fetching passage data:", error);
            toast.error(error.message || "Failed to load passage data");
            onOpenChange(false);
        } finally {
            setFetchingData(false);
        }
    };

    // ─── Save passage (title + text) ───────────────────
    const onSavePassage = async (values: z.infer<typeof passageFormSchema>) => {
        if (!user) return;
        setLoading(true);
        try {
            const { error } = await supabase
                .from(passageTable)
                .update({
                    title: values.title,
                    passage_text: values.passageText,
                })
                .eq("id", passageId);

            if (error) throw error;

            // Log admin action
            try {
                await supabase.rpc("log_admin_action", {
                    _admin_id: (
                        await supabase.rpc("get_admin_id", { _user_id: user.id })
                    ).data,
                    _action: "update_passage",
                    _resource_type: "comprehension_passage",
                    _resource_id: passageId,
                    _details: {
                        class_year: classYear,
                        title: values.title,
                    },
                });
            } catch (logErr) {
                console.error("Error logging passage update:", logErr);
            }

            toast.success("Passage updated successfully");
            onSuccess();
        } catch (error: any) {
            console.error("Error updating passage:", error);
            toast.error(error.message || "Failed to update passage");
        } finally {
            setLoading(false);
        }
    };

    // ─── Question field updaters (local state) ─────────
    const updateQuestionField = (
        qIndex: number,
        field: "question_text" | "explanation",
        value: string
    ) => {
        setQuestions((prev) =>
            prev.map((q, i) =>
                i === qIndex ? { ...q, [field]: value, dirty: true } : q
            )
        );
    };

    const updateQuestionOption = (
        qIndex: number,
        optIndex: number,
        text: string
    ) => {
        setQuestions((prev) =>
            prev.map((q, i) => {
                if (i !== qIndex) return q;
                const newOptions = q.options.map((o, oi) =>
                    oi === optIndex ? { ...o, text } : o
                );
                return { ...q, options: newOptions, dirty: true };
            })
        );
    };

    const setCorrectOption = (qIndex: number, optIndex: number) => {
        setQuestions((prev) =>
            prev.map((q, i) => {
                if (i !== qIndex) return q;
                const newOptions = q.options.map((o, oi) => ({
                    ...o,
                    isCorrect: oi === optIndex,
                }));
                const correctText = newOptions[optIndex]?.text || q.correct_answer;
                return {
                    ...q,
                    options: newOptions,
                    correct_answer: correctText,
                    dirty: true,
                };
            })
        );
    };

    // ─── Save a single question ────────────────────────
    const saveQuestion = async (qIndex: number) => {
        if (!user) return;
        const q = questions[qIndex];
        if (!q) return;

        // Validate
        if (!q.question_text.trim()) {
            toast.error("Question text cannot be empty");
            return;
        }
        const filledOptions = q.options.filter((o) => o.text.trim());
        if (filledOptions.length < 2) {
            toast.error("At least 2 options are required");
            return;
        }
        const correctOpts = q.options.filter((o) => o.isCorrect);
        if (correctOpts.length !== 1) {
            toast.error("Exactly one option must be marked as correct");
            return;
        }

        setQuestions((prev) =>
            prev.map((item, i) => (i === qIndex ? { ...item, saving: true } : item))
        );

        try {
            const correctAnswer = q.options.find((o) => o.isCorrect)?.text || "";

            // 1. Update question record
            const { error: questionErr } = await supabase
                .from(questionsTable)
                .update({
                    question_text: q.question_text,
                    correct_answer: correctAnswer,
                    explanation: q.explanation || null,
                })
                .eq("id", q.id);

            if (questionErr) throw questionErr;

            // 2. Delete old options and re-insert
            const { error: deleteErr } = await supabase
                .from(optionsTable)
                .delete()
                .eq("question_id", q.id);

            if (deleteErr) throw deleteErr;

            const newOpts = q.options.map((o, idx) => ({
                question_id: q.id,
                option_text: o.text,
                is_correct: o.isCorrect,
                display_order: idx,
            }));

            const { error: insertErr } = await supabase
                .from(optionsTable)
                .insert(newOpts);

            if (insertErr) throw insertErr;

            // 3. Log
            try {
                await supabase.rpc("log_admin_action", {
                    _admin_id: (
                        await supabase.rpc("get_admin_id", { _user_id: user.id })
                    ).data,
                    _action: "update_question",
                    _resource_type: "question",
                    _resource_id: q.id,
                    _details: { class_year: classYear, from_passage_editor: true },
                });
            } catch (logErr) {
                console.error("Error logging question update:", logErr);
            }

            // Mark as not dirty
            setQuestions((prev) =>
                prev.map((item, i) =>
                    i === qIndex ? { ...item, dirty: false, saving: false } : item
                )
            );

            toast.success("Question updated successfully");
        } catch (error: any) {
            console.error("Error updating question:", error);
            toast.error(error.message || "Failed to update question");
            setQuestions((prev) =>
                prev.map((item, i) =>
                    i === qIndex ? { ...item, saving: false } : item
                )
            );
        }
    };

    // ─── Delete a question ─────────────────────────────
    const handleDeleteQuestion = async () => {
        if (!deleteQuestionId || !user) return;

        try {
            // Delete options first (cascade may handle this, but be safe)
            await supabase
                .from(optionsTable)
                .delete()
                .eq("question_id", deleteQuestionId);

            const { error } = await supabase
                .from(questionsTable)
                .delete()
                .eq("id", deleteQuestionId);

            if (error) throw error;

            // Log
            try {
                await supabase.rpc("log_admin_action", {
                    _admin_id: (
                        await supabase.rpc("get_admin_id", { _user_id: user.id })
                    ).data,
                    _action: "delete_question",
                    _resource_type: "question",
                    _resource_id: deleteQuestionId,
                    _details: {
                        class_year: classYear,
                        from_passage_editor: true,
                    },
                });
            } catch (logErr) {
                console.error("Error logging question deletion:", logErr);
            }

            setQuestions((prev) => prev.filter((q) => q.id !== deleteQuestionId));
            setDeleteQuestionId(null);
            toast.success("Question deleted");
            onSuccess();
        } catch (error: any) {
            console.error("Error deleting question:", error);
            toast.error(error.message || "Failed to delete question");
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[780px] max-h-[92vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Passage</DialogTitle>
                        <DialogDescription>
                            Update the passage text and edit any linked comprehension questions.
                        </DialogDescription>
                    </DialogHeader>

                    {fetchingData ? (
                        <div className="flex justify-center items-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <span className="ml-3 text-muted-foreground">
                                Loading passage data...
                            </span>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* ─── Passage Fields ─────────────────── */}
                            <Form {...passageForm}>
                                <form
                                    onSubmit={passageForm.handleSubmit(onSavePassage)}
                                    className="space-y-4"
                                >
                                    <FormField
                                        control={passageForm.control}
                                        name="title"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Passage Title</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="e.g. The Lion and the Mouse"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={passageForm.control}
                                        name="passageText"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Passage Text</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Enter the reading passage here..."
                                                        className="min-h-[180px] font-serif"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <div className="flex justify-between text-sm text-muted-foreground">
                                                    <span>{passageLength} characters</span>
                                                    <span>
                                                        {passageLength < 10
                                                            ? "Minimum 10 characters"
                                                            : ""}
                                                    </span>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <DialogFooter className="sm:justify-start">
                                        <Button type="submit" disabled={loading}>
                                            {loading && (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            )}
                                            <Save className="mr-2 h-4 w-4" />
                                            Save Passage
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </Form>

                            {/* ─── Linked Questions Section ──────── */}
                            <Separator />
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-semibold flex items-center gap-2">
                                        <MessageSquareText className="h-4 w-4 text-primary" />
                                        Linked Questions
                                        <Badge variant="secondary" className="ml-1">
                                            {questions.length}
                                        </Badge>
                                    </h3>
                                </div>

                                {questions.length === 0 ? (
                                    <div className="text-center py-6 text-muted-foreground border rounded-lg border-dashed">
                                        <AlertCircle className="h-5 w-5 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">
                                            No questions linked to this passage yet.
                                        </p>
                                    </div>
                                ) : (
                                    <Accordion type="single" collapsible className="space-y-2">
                                        {questions.map((q, qIndex) => (
                                            <AccordionItem
                                                key={q.id}
                                                value={q.id}
                                                className="border rounded-lg px-4"
                                            >
                                                <AccordionTrigger className="hover:no-underline py-3">
                                                    <div className="flex items-center gap-2 text-left flex-1 min-w-0">
                                                        <span className="text-xs font-bold text-primary shrink-0">
                                                            Q{qIndex + 1}
                                                        </span>
                                                        <span className="text-sm truncate">
                                                            {q.question_text || "Untitled Question"}
                                                        </span>
                                                        {q.dirty && (
                                                            <Badge
                                                                variant="outline"
                                                                className="text-amber-600 border-amber-400 text-[10px] shrink-0"
                                                            >
                                                                unsaved
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent className="space-y-4 pb-4">
                                                    {/* Question text */}
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-semibold text-muted-foreground">
                                                            Question Text
                                                        </label>
                                                        <Textarea
                                                            value={q.question_text}
                                                            onChange={(e) =>
                                                                updateQuestionField(
                                                                    qIndex,
                                                                    "question_text",
                                                                    e.target.value
                                                                )
                                                            }
                                                            className="min-h-[60px]"
                                                        />
                                                    </div>

                                                    {/* Options */}
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-semibold text-muted-foreground">
                                                            Answer Options{" "}
                                                            <span className="text-[10px] font-normal">
                                                                (click circle to mark correct)
                                                            </span>
                                                        </label>
                                                        <div className="space-y-2">
                                                            {q.options.map((opt, optIndex) => (
                                                                <div
                                                                    key={opt.id || optIndex}
                                                                    className="flex items-center gap-2"
                                                                >
                                                                    <div
                                                                        className={`cursor-pointer p-1.5 rounded-full transition-colors ${
                                                                            opt.isCorrect
                                                                                ? "text-green-600 bg-green-100 dark:bg-green-900/30"
                                                                                : "text-muted-foreground hover:bg-muted"
                                                                        }`}
                                                                        onClick={() =>
                                                                            setCorrectOption(qIndex, optIndex)
                                                                        }
                                                                    >
                                                                        <CheckCircle2 size={18} />
                                                                    </div>
                                                                    <Input
                                                                        value={opt.text}
                                                                        onChange={(e) =>
                                                                            updateQuestionOption(
                                                                                qIndex,
                                                                                optIndex,
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                        placeholder={`Option ${optIndex + 1}`}
                                                                        className={
                                                                            opt.isCorrect
                                                                                ? "border-green-500 ring-1 ring-green-500"
                                                                                : ""
                                                                        }
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Explanation */}
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-semibold text-muted-foreground">
                                                            Explanation (Optional)
                                                        </label>
                                                        <Textarea
                                                            value={q.explanation}
                                                            onChange={(e) =>
                                                                updateQuestionField(
                                                                    qIndex,
                                                                    "explanation",
                                                                    e.target.value
                                                                )
                                                            }
                                                            placeholder="Explain why the answer is correct..."
                                                            className="min-h-[50px]"
                                                        />
                                                    </div>

                                                    {/* Action buttons */}
                                                    <div className="flex items-center gap-2 pt-2">
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            disabled={!q.dirty || q.saving}
                                                            onClick={() => saveQuestion(qIndex)}
                                                        >
                                                            {q.saving ? (
                                                                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                                            ) : (
                                                                <Save className="mr-2 h-3.5 w-3.5" />
                                                            )}
                                                            Save Question
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() => setDeleteQuestionId(q.id)}
                                                        >
                                                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Question Confirmation */}
            <AlertDialog
                open={!!deleteQuestionId}
                onOpenChange={() => setDeleteQuestionId(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Question</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this question and all its options?
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteQuestion}
                            className="bg-destructive text-destructive-foreground"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

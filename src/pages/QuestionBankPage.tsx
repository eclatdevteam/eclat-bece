import { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Search,
    Loader2,
    Trash2,
    Edit,
    Filter
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import { AddQuestionDialog } from "@/components/admin/AddQuestionDialog";
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
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

interface Question {
    id: string;
    subject: string;
    topic: string;
    question_text: string;
    difficulty: string;
    created_at: string;
}

const ITEMS_PER_PAGE = 50;

export default function QuestionBankPage() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [classYear, setClassYear] = useState<"year_6" | "year_9">("year_6");
    const [subjectFilter, setSubjectFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setCurrentPage(1); // Reset to first page on search
            fetchQuestions();
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        fetchQuestions();
    }, [classYear, subjectFilter, currentPage]);

    const fetchQuestions = async () => {
        setLoading(true);
        try {
            const tableName = classYear === 'year_6' ? 'quiz_questions_year6' : 'quiz_questions_year9';
            const from = (currentPage - 1) * ITEMS_PER_PAGE;
            const to = from + ITEMS_PER_PAGE - 1;

            let query = supabase
                .from(tableName as any)
                .select("id, subject, topic, question_text, difficulty, created_at", { count: 'exact' })
                .order("created_at", { ascending: false })
                .range(from, to);

            if (subjectFilter !== "all") {
                query = query.eq("subject", subjectFilter);
            }

            if (searchQuery) {
                // Search in question_text or topic
                query = query.or(`question_text.ilike.%${searchQuery}%,topic.ilike.%${searchQuery}%`);
            }

            const { data, error, count } = await query;

            if (error) throw error;

            setQuestions(data || []);
            if (count !== null) {
                setTotalItems(count);
                setTotalPages(Math.ceil(count / ITEMS_PER_PAGE));
            }
        } catch (error) {
            console.error("Error fetching questions:", error);
            toast.error("Failed to load questions");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;

        try {
            const tableName = classYear === 'year_6' ? 'quiz_questions_year6' : 'quiz_questions_year9';

            const { error } = await supabase
                .from(tableName as any)
                .delete()
                .eq("id", deleteId);

            if (error) throw error;

            toast.success("Question deleted successfully");
            // Refresh current page
            fetchQuestions();
        } catch (error) {
            console.error("Error deleting question:", error);
            toast.error("Failed to delete question");
        } finally {
            setDeleteId(null);
        }
    };

    const handlePageChange = (page: number) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Question Bank</h1>
                    <p className="text-muted-foreground">
                        Manage quiz questions for Year 6 and Year 9 students.
                    </p>
                </div>
                <AddQuestionDialog onSuccess={fetchQuestions} />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full sm:w-auto">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search questions..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <Select value={classYear} onValueChange={(v: any) => {
                    setClassYear(v);
                    setCurrentPage(1);
                }}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Class Year" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="year_6">Year 6 (Common Entrance)</SelectItem>
                        <SelectItem value="year_9">Year 9 (BECE)</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={subjectFilter} onValueChange={(v) => {
                    setSubjectFilter(v);
                    setCurrentPage(1);
                }}>
                    <SelectTrigger className="w-[180px]">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            <SelectValue placeholder="Subject" />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Subjects</SelectItem>
                        <SelectItem value="Mathematics">Mathematics</SelectItem>
                        <SelectItem value="English Language">English Language</SelectItem>
                        <SelectItem value="General Paper">General Paper</SelectItem>
                        <SelectItem value="Basic Science">Basic Science</SelectItem>
                        <SelectItem value="Social Studies">Social Studies</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[400px]">Question</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Topic</TableHead>
                            <TableHead>Difficulty</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <div className="flex justify-center items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Loading questions...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : questions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    No questions found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            questions.map((question) => (
                                <TableRow key={question.id}>
                                    <TableCell>
                                        <div className="line-clamp-2" title={question.question_text}>
                                            {question.question_text}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-primary/5">
                                            {question.subject}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {question.topic || "-"}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className={
                                                question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                                                    question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                            }
                                        >
                                            {question.difficulty}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {format(new Date(question.created_at), "MMM d, yyyy")}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                onClick={() => setDeleteId(question.id)}
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of {totalItems} questions
                    </div>
                    <Pagination className="justify-end w-auto mx-0">
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                />
                            </PaginationItem>

                            {/* Simple pagination logic: show current page and neighbors */}
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(page =>
                                    page === 1 ||
                                    page === totalPages ||
                                    (page >= currentPage - 1 && page <= currentPage + 1)
                                )
                                .map((page, index, array) => (
                                    <div key={page} className="flex items-center">
                                        {index > 0 && array[index - 1] !== page - 1 && (
                                            <PaginationItem>
                                                <span className="px-2 text-muted-foreground">...</span>
                                            </PaginationItem>
                                        )}
                                        <PaginationItem>
                                            <PaginationLink
                                                isActive={currentPage === page}
                                                onClick={() => handlePageChange(page)}
                                                className="cursor-pointer"
                                            >
                                                {page}
                                            </PaginationLink>
                                        </PaginationItem>
                                    </div>
                                ))
                            }

                            <PaginationItem>
                                <PaginationNext
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the question and its options.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

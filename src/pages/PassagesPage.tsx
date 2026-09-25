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
    FileText,
    Upload
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { AddPassageDialog } from "@/components/admin/AddPassageDialog";
import { EditPassageDialog } from "@/components/admin/EditPassageDialog";
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

interface Passage {
    id: string;
    title: string | null;
    passage_text: string;
    topic: string | null;
    created_at: string;
    question_count?: number;
}

const ITEMS_PER_PAGE = 20;

export default function PassagesPage() {
    const { user } = useAuth();
    const [passages, setPassages] = useState<Passage[]>([]);
    const [loading, setLoading] = useState(true);
    const [classYear, setClassYear] = useState<"year_6" | "year_9">("year_6");
    const [searchQuery, setSearchQuery] = useState("");
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [editId, setEditId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => {
            setCurrentPage(1);
            fetchPassages();
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        fetchPassages();
    }, [classYear, currentPage]);

    const fetchPassages = async () => {
        setLoading(true);
        try {
            const tableName = classYear === 'year_6'
                ? 'comprehension_passages_year6'
                : 'comprehension_passages_year9';
            const questionsTableName = classYear === 'year_6'
                ? 'quiz_questions_year6'
                : 'quiz_questions_year9';

            const from = (currentPage - 1) * ITEMS_PER_PAGE;
            const to = from + ITEMS_PER_PAGE - 1;

            let query = supabase
                .from(tableName)
                .select("*", { count: 'exact' })
                .order("created_at", { ascending: false })
                .range(from, to);

            if (searchQuery.trim()) {
                query = query.or(`title.ilike.%${searchQuery}%,passage_text.ilike.%${searchQuery}%`);
            }

            const { data, error, count } = await query;

            if (error) throw error;

            // Fetch question counts in a single batch query (eliminating N+1)
            const passageIds = (data || []).map(p => p.id);
            let countMap: Record<string, number> = {};

            if (passageIds.length > 0) {
                const { data: questionsData } = await supabase
                    .from(questionsTableName)
                    .select('passage_id')
                    .in('passage_id', passageIds);

                if (questionsData) {
                    countMap = questionsData.reduce((acc, curr) => {
                        if (curr.passage_id) {
                            acc[curr.passage_id] = (acc[curr.passage_id] || 0) + 1;
                        }
                        return acc;
                    }, {} as Record<string, number>);
                }
            }

            const passagesWithCounts = (data || []).map(passage => ({
                ...passage,
                question_count: countMap[passage.id] || 0
            }));

            setPassages(passagesWithCounts);
            setTotalItems(count || 0);
            setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
        } catch (error: any) {
            console.error("Error fetching passages:", error);
            toast.error(`Failed to load passages: ${error.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId || !user) return;

        try {
            const tableName = classYear === 'year_6'
                ? 'comprehension_passages_year6'
                : 'comprehension_passages_year9';

            // Get passage details before deletion for logging
            const { data: passageData } = await supabase
                .from(tableName)
                .select('title, passage_text')
                .eq('id', deleteId)
                .single();

            const { error } = await supabase
                .from(tableName)
                .delete()
                .eq("id", deleteId);

            if (error) throw error;

            // Log the deletion
            try {
                await supabase.rpc('log_admin_action', {
                    _admin_id: (await supabase.rpc('get_admin_id', { _user_id: user.id })).data,
                    _action: 'delete_passage',
                    _resource_type: 'passage',
                    _resource_id: deleteId,
                    _details: {
                        title: passageData?.title,
                        class_year: classYear,
                        passage_preview: passageData?.passage_text?.substring(0, 100)
                    }
                });
            } catch (logError) {
                console.error('Error logging passage deletion:', logError);
            }

            toast.success("Passage deleted successfully");
            setDeleteId(null);
            fetchPassages();
        } catch (error: any) {
            console.error("Error deleting passage:", error);
            toast.error(error.message || "Failed to delete passage");
        }
    };

    const truncateText = (text: string, maxLength: number = 100) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + "...";
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Comprehension Passages</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage reading passages for comprehension questions
                    </p>
                </div>
                <AddPassageDialog onSuccess={fetchPassages} />
            </div>

            <div className="flex items-center gap-4">
                <Select value={classYear} onValueChange={(v: "year_6" | "year_9") => {
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

                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                        placeholder="Search passages by title or content..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div>
                    Showing {passages.length} of {totalItems} passage(s)
                </div>
                {totalPages > 1 && (
                    <div>
                        Page {currentPage} of {totalPages}
                    </div>
                )}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : passages.length === 0 ? (
                <div className="text-center py-12 border rounded-lg">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No passages found</h3>
                    <p className="text-muted-foreground mb-4">
                        {searchQuery ? "Try adjusting your search" : "Get started by adding your first passage"}
                    </p>
                    {!searchQuery && <AddPassageDialog onSuccess={fetchPassages} />}
                </div>
            ) : (
                <>
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Passage Preview</TableHead>
                                    <TableHead>Questions</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {passages.map((passage) => (
                                    <TableRow key={passage.id}>
                                        <TableCell className="font-medium">
                                            {passage.title || <span className="text-muted-foreground italic">Untitled</span>}
                                        </TableCell>
                                        <TableCell className="max-w-md">
                                            <p className="text-sm text-muted-foreground">
                                                {truncateText(passage.passage_text)}
                                            </p>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">
                                                {passage.question_count || 0} question(s)
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {format(new Date(passage.created_at), "MMM d, yyyy")}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setEditId(passage.id)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setDeleteId(passage.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {totalPages > 1 && (
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                    />
                                </PaginationItem>
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }
                                    return (
                                        <PaginationItem key={pageNum}>
                                            <PaginationLink
                                                onClick={() => setCurrentPage(pageNum)}
                                                isActive={currentPage === pageNum}
                                                className="cursor-pointer"
                                            >
                                                {pageNum}
                                            </PaginationLink>
                                        </PaginationItem>
                                    );
                                })}
                                <PaginationItem>
                                    <PaginationNext
                                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    )}
                </>
            )}

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Passage</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this passage? This will unlink it from any associated questions.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {editId && (
                <EditPassageDialog
                    open={!!editId}
                    onOpenChange={(open) => { if (!open) setEditId(null); }}
                    passageId={editId}
                    classYear={classYear}
                    onSuccess={fetchPassages}
                />
            )}
        </div>
    );
}

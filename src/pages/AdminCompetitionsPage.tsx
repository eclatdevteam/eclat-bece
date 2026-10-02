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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    MoreHorizontal,
    Search,
    Trophy,
    Calendar,
    Loader2,
    Trash2,
    Edit
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { AddCompetitionDialog } from "@/components/admin/AddCompetitionDialog";
import { toast } from "sonner";
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

interface Competition {
    id: string;
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    status: "draft" | "active" | "completed" | "cancelled";
    class_year: string;
    created_at: string;
}

export default function AdminCompetitionsPage() {
    const [competitions, setCompetitions] = useState<Competition[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [deleteId, setDeleteId] = useState<string | null>(null);

    useEffect(() => {
        fetchCompetitions();
    }, []);

    const fetchCompetitions = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("competitions")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setCompetitions(
              (data || []).map((c) => ({
                ...c,
                status: c.status as Competition["status"],
              }))
            );
        } catch (error) {
            console.error("Error fetching competitions:", error);
            toast.error("Failed to load competitions");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;

        try {
            const { error } = await supabase
                .from("competitions")
                .delete()
                .eq("id", deleteId);

            if (error) throw error;

            toast.success("Competition deleted successfully");
            setCompetitions(competitions.filter(c => c.id !== deleteId));
        } catch (error) {
            console.error("Error deleting competition:", error);
            toast.error("Failed to delete competition");
        } finally {
            setDeleteId(null);
        }
    };

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from("competitions")
                .update({ status: newStatus })
                .eq("id", id);

            if (error) throw error;

            toast.success(`Competition marked as ${newStatus}`);
            fetchCompetitions();
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Failed to update status");
        }
    };

    const filteredCompetitions = competitions.filter(c =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active": return "bg-green-100 text-green-800 hover:bg-green-100";
            case "completed": return "bg-blue-100 text-blue-800 hover:bg-blue-100";
            case "cancelled": return "bg-red-100 text-red-800 hover:bg-red-100";
            default: return "bg-gray-100 text-gray-800 hover:bg-gray-100";
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Competitions</h1>
                    <p className="text-muted-foreground">
                        Manage national competitions and challenges.
                    </p>
                </div>
                <AddCompetitionDialog onSuccess={fetchCompetitions} />
            </div>

            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search competitions..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Competition</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Audience</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <div className="flex justify-center items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Loading competitions...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredCompetitions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    No competitions found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredCompetitions.map((comp) => (
                                <TableRow key={comp.id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium flex items-center gap-2">
                                                <Trophy className="h-4 w-4 text-yellow-500" />
                                                {comp.title}
                                            </span>
                                            <span className="text-xs text-muted-foreground line-clamp-1">
                                                {comp.description || "No description"}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className={getStatusColor(comp.status)}>
                                            {comp.status.charAt(0).toUpperCase() + comp.status.slice(1)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {comp.class_year === 'all' ? 'All Students' :
                                                comp.class_year === 'year_6' ? 'Year 6' : 'Year 9'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {format(new Date(comp.start_date), "MMM d")} - {format(new Date(comp.end_date), "MMM d, yyyy")}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => updateStatus(comp.id, 'active')}>
                                                    Mark as Active
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => updateStatus(comp.id, 'completed')}>
                                                    Mark as Completed
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => updateStatus(comp.id, 'cancelled')}>
                                                    Mark as Cancelled
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => setDeleteId(comp.id)}
                                                    className="text-destructive"
                                                >
                                                    Delete Competition
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the competition.
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

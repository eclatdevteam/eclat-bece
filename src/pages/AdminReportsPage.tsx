import { useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2, Users, BookOpen, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

export default function AdminReportsPage() {
    const [loading, setLoading] = useState<string | null>(null);

    const downloadCSV = (data: any[], filename: string) => {
        if (!data || data.length === 0) {
            toast.error("No data available to export");
            return;
        }

        // Get headers from first object
        const headers = Object.keys(data[0]);

        // Convert to CSV string
        const csvContent = [
            headers.join(","), // Header row
            ...data.map(row =>
                headers.map(header => {
                    const value = row[header];
                    // Handle strings with commas, nulls, etc.
                    if (value === null || value === undefined) return "";
                    if (typeof value === "string" && value.includes(",")) return `"${value}"`;
                    return value;
                }).join(",")
            )
        ].join("\n");

        // Create download link
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${filename}_${format(new Date(), "yyyy-MM-dd")}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportStudents = async () => {
        setLoading("students");
        try {
            const { data, error } = await supabase
                .from("students")
                .select(`
          id,
          class_year,
          onboarding_completed,
          created_at,
          profiles:user_id (email, full_name)
        `);

            if (error) throw error;

            // Flatten data
            const flattenedData = data.map((s: any) => ({
                student_id: s.id,
                full_name: s.profiles?.full_name || "Unknown",
                email: s.profiles?.email || "Unknown",
                class_year: s.class_year,
                onboarding_completed: s.onboarding_completed,
                joined_date: format(new Date(s.created_at), "yyyy-MM-dd"),
            }));

            downloadCSV(flattenedData, "students_report");
            toast.success("Students report exported successfully");
        } catch (error) {
            console.error("Error exporting students:", error);
            toast.error("Failed to export students report");
        } finally {
            setLoading(null);
        }
    };

    const exportQuizResults = async () => {
        setLoading("quizzes");
        try {
            const { data, error } = await supabase
                .from("quiz_results")
                .select(`
          id,
          subject,
          score,
          total_questions,
          correct_answers,
          completed_at,
          students (
            class_year,
            profiles:user_id (full_name)
          )
        `)
                .order("completed_at", { ascending: false })
                .limit(1000); // Limit to last 1000 for performance

            if (error) throw error;

            const flattenedData = data.map((r: any) => ({
                quiz_id: r.id,
                student_name: r.students?.profiles?.full_name || "Unknown",
                class_year: r.students?.class_year || "Unknown",
                subject: r.subject,
                score: r.score,
                total_questions: r.total_questions,
                correct_answers: r.correct_answers,
                completed_at: format(new Date(r.completed_at), "yyyy-MM-dd HH:mm"),
            }));

            downloadCSV(flattenedData, "quiz_results_report");
            toast.success("Quiz results exported successfully");
        } catch (error) {
            console.error("Error exporting quiz results:", error);
            toast.error("Failed to export quiz results");
        } finally {
            setLoading(null);
        }
    };

    const exportCompetitions = async () => {
        setLoading("competitions");
        try {
            const { data, error } = await supabase
                .from("competitions" as any)
                .select("*");

            if (error) throw error;

            const flattenedData = data.map((c: any) => ({
                title: c.title,
                status: c.status,
                class_year: c.class_year,
                start_date: format(new Date(c.start_date), "yyyy-MM-dd"),
                end_date: format(new Date(c.end_date), "yyyy-MM-dd"),
                created_at: format(new Date(c.created_at), "yyyy-MM-dd"),
            }));

            downloadCSV(flattenedData, "competitions_report");
            toast.success("Competitions report exported successfully");
        } catch (error) {
            console.error("Error exporting competitions:", error);
            toast.error("Failed to export competitions report");
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Reports & Exports</h1>
                <p className="text-muted-foreground">
                    Download platform data and performance reports.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Student Report Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            Student Data
                        </CardTitle>
                        <CardDescription>
                            Export list of all registered students with their class year and onboarding status.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            className="w-full"
                            onClick={exportStudents}
                            disabled={!!loading}
                        >
                            {loading === "students" ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <FileDown className="mr-2 h-4 w-4" />
                                    Export CSV
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Quiz Results Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-green-600" />
                            Quiz Performance
                        </CardTitle>
                        <CardDescription>
                            Export recent quiz results including scores, subjects, and student details.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            className="w-full"
                            variant="outline"
                            onClick={exportQuizResults}
                            disabled={!!loading}
                        >
                            {loading === "quizzes" ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <FileDown className="mr-2 h-4 w-4" />
                                    Export CSV
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Competitions Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-yellow-500" />
                            Competitions
                        </CardTitle>
                        <CardDescription>
                            Export list of all competitions and their current status.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            className="w-full"
                            variant="outline"
                            onClick={exportCompetitions}
                            disabled={!!loading}
                        >
                            {loading === "competitions" ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <FileDown className="mr-2 h-4 w-4" />
                                    Export CSV
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

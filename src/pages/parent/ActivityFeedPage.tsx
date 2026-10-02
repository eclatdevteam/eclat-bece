import { useState, useEffect } from "react";
import { ArrowLeft, Brain, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useParentAccount } from "@/hooks/useParentAccount";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Award, BookOpen } from "lucide-react";

interface Activity {
  id: string;
  student_id: string;
  subject: string;
  score: number;
  correct_answers: number;
  total_questions: number;
  completed_at: string;
  student_name?: string;
}

export default function ActivityFeedPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { parentId, loading: parentLoading } = useParentAccount();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchFullActivities = async () => {
      if (!parentId) {
        if (!parentLoading) setLoading(false);
        return;
      }
      try {
        setLoading(true);

        // 1. Get children
        const { data: childrenData } = await supabase
          .from("students")
          .select("id, profile:profiles(full_name)")
          .eq("parent_id", parentId);

        if (!childrenData || childrenData.length === 0) {
          setActivities([]);
          setTotalCount(0);
          setLoading(false);
          return;
        }

        const childIds = childrenData.map((c) => c.id);
        const nameMap = new Map<string, string>(
          childrenData.map((c) => [c.id, c.profile?.full_name || "Unknown"])
        );

        // 3. Count total activities
        const { count, error: countError } = await supabase
          .from("quiz_results")
          .select("*", { count: "exact", head: true })
          .in("student_id", childIds);

        if (countError) throw countError;
        setTotalCount(count || 0);

        // 4. Fetch paginated activities
        const from = (currentPage - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;

        const { data: results, error: resultsError } = await supabase
          .from("quiz_results")
          .select("*")
          .in("student_id", childIds)
          .order("completed_at", { ascending: false })
          .range(from, to);

        if (resultsError) throw resultsError;

        if (results) {
          const mapped = results.map((r) => ({
            ...r,
            student_name: nameMap.get(r.student_id),
          })) as Activity[];
          setActivities(mapped);
        }
      } catch (error) {
        console.error("Error loading activity feed:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFullActivities();
  }, [parentId, parentLoading, currentPage]);

  const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;

  return (
    <div className="w-full px-4 py-8 animate-fade-in pb-16 text-foreground">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/dashboard/parent")}
          className="rounded-full border border-border bg-card text-foreground hover:bg-accent shadow-sm"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border border-primary/20 bg-primary/10 text-primary mb-2">
            <Award className="h-3.5 w-3.5" />
            <span>Activity Logs</span>
          </div>
          <h2 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-2">
            Activity Feed History
            <span className="w-2 h-2 rounded-full bg-primary" />
          </h2>
          <p className="text-muted-foreground font-medium text-sm mt-1">
            Complete historical timeline of quiz activities across all linked children.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium animate-pulse">Loading activities...</p>
        </div>
      ) : activities.length === 0 ? (
        <Card className="border-2 border-dashed border-border bg-card text-card-foreground rounded-2xl shadow-sm">
          <CardContent className="py-16 text-center flex flex-col items-center justify-center">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4 text-primary">
              <Brain className="h-8 w-8" />
            </div>
            <p className="font-bold text-lg text-foreground">No activities found</p>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-1">
              Once your children complete their practice quizzes, their milestones will be logged here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-4 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary/40 before:via-border before:to-transparent">
            {activities.map((activity) => (
              <div key={activity.id} className="relative flex items-start gap-4 group">
                <div className="flex items-center justify-center w-8 h-8 rounded-full border border-border bg-card text-primary shadow-sm shrink-0 z-10 transition-transform duration-300 group-hover:scale-110 mt-1">
                  {activity.score >= 80 ? <Award className="h-4 w-4 text-emerald-500" /> : <BookOpen className="h-4 w-4 text-primary" />}
                </div>

                <div className="flex-1 p-5 rounded-2xl border border-border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all duration-300 min-w-0 hover:border-primary/40">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-bold text-foreground text-base truncate">
                        {activity.student_name}
                      </span>
                      <Badge className={`shrink-0 font-bold text-xs border ${activity.score >= 80 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : 'bg-primary/10 text-primary border-primary/20'}`}>
                        {Math.round(activity.score)}%
                      </Badge>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(activity.completed_at), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground leading-relaxed">
                    Completed a <strong className="text-foreground font-bold">{activity.subject}</strong> quiz
                    {" "}(<span className="font-mono text-primary font-bold">{activity.correct_answers}/{activity.total_questions}</span> correct)
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="rounded-xl font-bold gap-1 border border-border bg-card text-foreground hover:bg-accent"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm font-semibold text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="rounded-xl font-bold gap-1 border border-border bg-card text-foreground hover:bg-accent"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

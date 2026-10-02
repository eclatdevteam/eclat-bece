import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen, Target, Calendar, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

export interface Assignment {
  id: string;
  subject: string;
  topics: string[];
  num_questions: number;
  duration: number;
  status: 'pending' | 'completed';
  score?: number;
  created_at: string;
}

interface PracticeAssignmentProps {
  assignments: Assignment[];
  isLoading?: boolean;
}

export const PracticeAssignment = ({ 
  assignments,
  isLoading = false
}: PracticeAssignmentProps) => {
  const navigate = useNavigate();

  const handleStart = (assignment: Assignment) => {
    if (assignment.status === 'completed') {
      // Review mode or just dashboard? For now review same quiz
      navigate(`/quiz?assignmentId=${assignment.id}&review=true`);
    } else {
      navigate(`/quiz?assignmentId=${assignment.id}`);
    }
  };
  
  if (isLoading) {
    return (
      <Card className="border-2 animate-pulse">
        <CardHeader className="h-20 bg-muted/20" />
        <CardContent className="p-8 space-y-4">
          <div className="h-24 bg-muted/20 rounded-lg" />
          <div className="h-24 bg-muted/20 rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-border bg-card text-card-foreground shadow-sm px-5 py-4 rounded-xl">
      <CardHeader className="border-b border-border bg-transparent px-0 pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <Target className="text-primary" size={20} />
              Assigned practice
            </CardTitle>
            <CardDescription className="text-muted-foreground">Curated practice sets from your parents</CardDescription>
          </div>
          <Badge variant="outline" className="border-border bg-muted/50 text-foreground font-semibold">{assignments.length} Tasks</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-0 py-6">
        {assignments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
            <div className="w-16 h-16 bg-card rounded-full flex items-center justify-center mx-auto mb-4 border border-border shadow-xs">
              <BookOpen className="h-8 w-8 text-muted-foreground/60" />
            </div>
            <p className="mb-1 text-sm font-semibold text-foreground">No assignments yet</p>
            <p className="mx-auto max-w-[240px] text-xs leading-relaxed text-muted-foreground">
              No pending tasks right now. Great job keeping your plate clean!
            </p>
          </div>
        ) : (
          assignments.map((assignment) => (
            <div
              key={assignment.id}
              className={`group relative rounded-xl border p-5 transition-all duration-300 ${
                assignment.status === 'completed' 
                  ? "border-border bg-muted/30 opacity-80"
                  : "border-border bg-card hover:border-primary/50 hover:shadow-sm"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge className="bg-primary/10 text-primary border-primary/20 font-black text-[10px] uppercase py-0.5 rounded-lg">
                      {assignment.subject}
                    </Badge>
                    {assignment.status === 'completed' ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-black text-[10px] uppercase py-0.5 rounded-lg flex items-center gap-1">
                        <CheckCircle2 size={10} /> Completed
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="font-black text-[10px] uppercase py-0.5 rounded-lg">
                        Pending
                      </Badge>
                    )}
                  </div>
                  
                  <h4 className="mb-1 text-lg font-semibold leading-tight text-foreground transition-colors group-hover:text-primary">
                    {assignment.topics.length > 1 ? `${assignment.topics[0]} & More` : assignment.topics[0]}
                  </h4>
                  
                  <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-primary/70" />
                      <span>{assignment.duration}m</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Target size={14} className="text-primary/70" />
                      <span>{assignment.num_questions} Questions</span>
                    </div>
                    <div className="hidden sm:flex items-center gap-1.5">
                      <Calendar size={14} className="text-primary/70" />
                      <span>{formatDistanceToNow(new Date(assignment.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:flex-col sm:items-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-border/40">
                  {assignment.status === 'completed' && assignment.score !== undefined && (
                    <div className="text-right">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Score</p>
                      <p className="text-2xl font-black text-primary leading-none tabular-nums">{Math.round(assignment.score)}%</p>
                    </div>
                  )}
                  <Button
                    variant={assignment.status === 'completed' ? "outline" : "default"}
                    size="sm"
                    className="h-9 rounded-lg px-5 font-semibold shadow-sm"
                    onClick={() => handleStart(assignment)}
                  >
                    {assignment.status === 'completed' ? "Retry" : "Start Task"}
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen, Target, Calendar } from "lucide-react";
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
        <CardContent className="p-6 space-y-4">
          <div className="h-24 bg-muted/20 rounded-lg" />
          <div className="h-24 bg-muted/20 rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 overflow-hidden bg-background/50 backdrop-blur-sm shadow-soft">
      <CardHeader className="border-b bg-muted/5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-xl font-black text-foreground uppercase tracking-tight">
              <Target className="text-primary" size={24} />
              Homework tasks
            </CardTitle>
            <CardDescription className="font-medium">Curated practice sets from your parents</CardDescription>
          </div>
          <Badge variant="outline" className="font-black px-3 py-1 bg-background border-2">{assignments.length} Tasks</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-4">
        {assignments.length === 0 ? (
          <div className="text-center py-12 px-6 bg-muted/10 rounded-[2rem] border-2 border-dashed border-border/60">
            <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-primary/20">
              <BookOpen className="h-8 w-8 text-primary/40" />
            </div>
            <p className="font-black text-sm uppercase tracking-widest text-foreground/60 mb-1">Clear Horizon</p>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px] mx-auto">
              No pending tasks right now. Great job keeping your plate clean!
            </p>
          </div>
        ) : (
          assignments.map((assignment) => (
            <div
              key={assignment.id}
              className={`group relative p-5 border-2 rounded-[1.5rem] transition-all duration-300 ${
                assignment.status === 'completed' 
                  ? "bg-muted/30 border-border/50 opacity-80" 
                  : "bg-background border-border hover:border-primary hover:shadow-xl hover:-translate-y-0.5"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge className="bg-primary/10 text-primary border-primary/20 font-black text-[10px] uppercase py-0.5 rounded-lg">
                      {assignment.subject}
                    </Badge>
                    {assignment.status === 'completed' ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-black text-[10px] uppercase py-0.5 rounded-lg flex items-center gap-1">
                        <CheckCircle2 size={10} /> Completed
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="font-black text-[10px] uppercase py-0.5 rounded-lg">
                        Pending
                      </Badge>
                    )}
                  </div>
                  
                  <h4 className="font-black text-lg sm:text-xl text-foreground mb-1 leading-tight group-hover:text-primary transition-colors">
                    {assignment.topics.length > 1 ? `${assignment.topics[0]} & More` : assignment.topics[0]}
                  </h4>
                  
                  <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-primary/60" />
                      <span>{assignment.duration}m</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Target size={14} className="text-primary/60" />
                      <span>{assignment.num_questions} Questions</span>
                    </div>
                    <div className="hidden sm:flex items-center gap-1.5">
                      <Calendar size={14} className="text-primary/60" />
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
                    variant={assignment.status === 'completed' ? "outline" : "hero"}
                    size="sm"
                    className={`font-black rounded-xl px-6 h-11 ${assignment.status === 'completed' ? 'border-2' : 'shadow-lg shadow-primary/20'}`}
                    onClick={() => handleStart(assignment)}
                  >
                    {assignment.status === 'completed' ? "Review" : "Start Task"}
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

// Help helper for icons
import { CheckCircle2 as CheckCircle2Icon } from "lucide-react";
function CheckCircle2(props: any) {
    return <CheckCircle2Icon {...props} />
}

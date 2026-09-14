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
    <Card className="overflow-hidden border-[#2b3a54] bg-transparent shadow-none px-5 py-4">
      <CardHeader className="border-b border-[#26344d] bg-transparent ">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-100">
              <Target className="text-[#71c9ed]" size={20} />
              Assigned practice
            </CardTitle>
            <CardDescription className="text-slate-400">Curated practice sets from your parents</CardDescription>
          </div>
          <Badge variant="outline" className="border-[#2b3a54] bg-[#111d32] text-slate-300">{assignments.length} Tasks</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-0 py-6">
        {assignments.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#2b3a54] bg-[#0e192b] px-6 py-12 text-center">
            <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-primary/20">
              <BookOpen className="h-8 w-8 text-primary/40" />
            </div>
              <p className="mb-1 text-sm font-semibold text-slate-300">No assignments yet</p>
              <p className="mx-auto max-w-[240px] text-xs leading-relaxed text-slate-500">
              No pending tasks right now. Great job keeping your plate clean!
            </p>
          </div>
        ) : (
          assignments.map((assignment) => (
            <div
              key={assignment.id}
                className={`group relative rounded-lg border p-5 transition-all duration-300 ${
                assignment.status === 'completed' 
                  ? "border-[#26344d] bg-[#0b1628] opacity-70"
                  : "border-[#2b3a54] bg-[#111d32] hover:border-[#159dca]"
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
                  
                    <h4 className="mb-1 text-lg font-semibold leading-tight text-slate-100 transition-colors group-hover:text-[#71c9ed]">
                    {assignment.topics.length > 1 ? `${assignment.topics[0]} & More` : assignment.topics[0]}
                  </h4>
                  
                  <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
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
                    className={`h-10 rounded-md px-5 font-semibold ${assignment.status === 'completed' ? 'border border-slate-600 bg-transparent' : 'bg-[#31405a] text-[#71c9ed] hover:bg-[#3b4c69]'}`}
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


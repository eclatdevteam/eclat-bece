import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, Award, BookOpen, AlertCircle } from "lucide-react";
import { useTheme } from "next-themes";
import logoDark from "@/assets/logo-dark.png";
import logoLight from "@/assets/logo-light.png";

export interface AnalyticsStudent {
  id: string;
  name: string;
  avatar?: string;
}

export interface AnalyticsQuizResult {
  id: string;
  student_id: string;
  score: number;
  subject: string;
  total_questions: number;
  correct_answers: number;
  completed_at: string;
}

interface ClassAnalyticsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
  students?: AnalyticsStudent[];
  quizResults?: AnalyticsQuizResult[];
}

export function ClassAnalyticsDialog({
  open,
  onOpenChange,
  className = "Class",
  students = [],
  quizResults = [],
}: ClassAnalyticsDialogProps) {
  const { theme } = useTheme();
  const logo = theme === "dark" ? logoLight : logoDark;

  // Filter quiz results for students in this class
  const studentIdSet = new Set(students.map((s) => s.id));
  const classQuizResults = quizResults.filter((q) => studentIdSet.has(q.student_id));

  // Compute student-level aggregations
  const studentScoresMap: Record<
    string,
    {
      totalScore: number;
      count: number;
      subjectScores: Record<string, { total: number; count: number }>;
    }
  > = {};

  classQuizResults.forEach((q) => {
    if (!studentScoresMap[q.student_id]) {
      studentScoresMap[q.student_id] = { totalScore: 0, count: 0, subjectScores: {} };
    }
    studentScoresMap[q.student_id].totalScore += q.score;
    studentScoresMap[q.student_id].count += 1;

    const sub = q.subject.charAt(0).toUpperCase() + q.subject.slice(1);
    if (!studentScoresMap[q.student_id].subjectScores[sub]) {
      studentScoresMap[q.student_id].subjectScores[sub] = { total: 0, count: 0 };
    }
    studentScoresMap[q.student_id].subjectScores[sub].total += q.score;
    studentScoresMap[q.student_id].subjectScores[sub].count += 1;
  });

  const totalStudents = students.length;
  const activeStudentsCount = Object.keys(studentScoresMap).length;
  const completionRate = totalStudents > 0 ? Math.round((activeStudentsCount / totalStudents) * 100) : 0;

  const totalClassScore = classQuizResults.reduce((acc, q) => acc + q.score, 0);
  const averageScore = classQuizResults.length > 0 ? Math.round(totalClassScore / classQuizResults.length) : 0;

  // Compute top performers & at-risk
  const studentAverages = students.map((s) => {
    const data = studentScoresMap[s.id];
    const avg = data && data.count > 0 ? Math.round(data.totalScore / data.count) : 0;
    const weakSubjects: string[] = [];
    if (data) {
      Object.entries(data.subjectScores).forEach(([sub, subData]) => {
        if (subData.total / subData.count < 65) {
          weakSubjects.push(sub);
        }
      });
    }
    return {
      id: s.id,
      name: s.name,
      avatar: s.avatar || "👤",
      average: avg,
      quizCount: data?.count || 0,
      weakSubjects,
    };
  });

  // Sort students by average score
  const activeStudentAverages = studentAverages.filter((s) => s.quizCount > 0);
  const sortedStudents = [...activeStudentAverages].sort((a, b) => b.average - a.average);

  const topPerformer = sortedStudents[0] || { name: "No quiz data yet", average: 0 };
  const top5Performers = sortedStudents.slice(0, 5);

  const needsAttention = activeStudentAverages.filter((s) => s.average < 65);

  // Subject Performance Overview
  const subjectMap: Record<string, { totalScore: number; count: number; studentScores: Record<string, number[]> }> = {};

  classQuizResults.forEach((q) => {
    const sub = q.subject.charAt(0).toUpperCase() + q.subject.slice(1);
    if (!subjectMap[sub]) {
      subjectMap[sub] = { totalScore: 0, count: 0, studentScores: {} };
    }
    subjectMap[sub].totalScore += q.score;
    subjectMap[sub].count += 1;
    if (!subjectMap[sub].studentScores[q.student_id]) {
      subjectMap[sub].studentScores[q.student_id] = [];
    }
    subjectMap[sub].studentScores[q.student_id].push(q.score);
  });

  const subjectPerformance = Object.entries(subjectMap).map(([subject, data]) => {
    const avgScore = Math.round(data.totalScore / data.count);
    let studentsAbove70 = 0;
    Object.values(data.studentScores).forEach((scores) => {
      const studentSubAvg = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (studentSubAvg >= 70) studentsAbove70 += 1;
    });
    return {
      subject,
      avgScore,
      studentsAbove70,
      totalParticipants: Object.keys(data.studentScores).length,
    };
  }).sort((a, b) => b.avgScore - a.avgScore);

  // Dynamic recommendations
  const recommendations: string[] = [];
  if (classQuizResults.length === 0) {
    recommendations.push("Assign initial diagnostic practice quizzes to assess cohort baseline knowledge.");
    recommendations.push("Ensure all students have connected using your School Code.");
  } else {
    if (averageScore >= 75) {
      recommendations.push(`✓ Excellent overall class performance with a strong ${averageScore}% average.`);
    } else {
      recommendations.push(`✓ Overall cohort average is currently at ${averageScore}%. Targeted practice can boost performance.`);
    }

    if (subjectPerformance.length > 0) {
      const best = subjectPerformance[0];
      const lowest = subjectPerformance[subjectPerformance.length - 1];
      recommendations.push(`✓ Highest proficiency in ${best.subject} (${best.avgScore}% avg).`);
      if (lowest.avgScore < 70 && best.subject !== lowest.subject) {
        recommendations.push(`✓ Priority focus recommended for ${lowest.subject} (${lowest.avgScore}% avg).`);
      }
    }

    if (needsAttention.length > 0) {
      recommendations.push(`✓ Schedule extra revision or peer tutoring for ${needsAttention.length} student(s) currently scoring below 65%.`);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <img src={logo} alt="Éclat Logo" className="h-10 w-auto" />
            <div>
              <DialogTitle className="text-2xl">{className} - Class Analytics</DialogTitle>
              <p className="text-muted-foreground text-sm">Comprehensive performance and diagnostic overview</p>
            </div>
          </div>
        </DialogHeader>

        {/* Overall Class Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary">{totalStudents}</div>
              <div className="text-xs text-muted-foreground">Enrolled Students</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-accent">{averageScore}%</div>
              <div className="text-xs text-muted-foreground">Class Average</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary">{completionRate}%</div>
              <div className="text-xs text-muted-foreground">Active Quiz Participation</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Award className="text-accent h-5 w-5 flex-shrink-0" />
                <div className="truncate">
                  <div className="font-bold text-sm truncate">{topPerformer.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Top Performer ({topPerformer.average}%)
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subject Performance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="text-primary h-5 w-5" />
              Subject Performance Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {subjectPerformance.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No subject quiz results recorded yet for this cohort.
              </p>
            ) : (
              subjectPerformance.map((subject, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{subject.subject}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {subject.studentsAbove70} of {subject.totalParticipants} students $\ge$ 70%
                      </span>
                      <Badge variant="outline" className="font-bold">
                        {subject.avgScore}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={subject.avgScore} className="h-2" />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Top Performers */}
          <Card className="border-primary">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-primary">
                <Award className="h-5 w-5" />
                Top Performers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {top5Performers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No student quiz results yet.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {top5Performers.map((student, idx) => (
                    <div key={student.id} className="flex items-center justify-between p-2.5 bg-primary/10 rounded-lg">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold flex-shrink-0">
                          {idx + 1}
                        </div>
                        <span className="font-medium text-sm truncate">{student.name}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="secondary" className="text-xs gap-1">
                          <TrendingUp size={11} className="text-green-600" />
                          {student.quizCount} quizzes
                        </Badge>
                        <span className="font-black text-sm text-primary">{student.average}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Needs Attention */}
          <Card className="border-accent">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-accent">
                <AlertCircle className="h-5 w-5" />
                Students Needing Support (&lt; 65%)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {needsAttention.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm font-semibold text-green-600">✓ All active students scoring $\ge$ 65%</p>
                  <p className="text-xs text-muted-foreground mt-1">Great job maintaining high performance!</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {needsAttention.map((student) => (
                    <div key={student.id} className="p-3 bg-accent/10 rounded-lg border border-accent/30">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-sm">{student.name}</span>
                        <Badge variant="destructive" className="text-xs font-bold">{student.average}%</Badge>
                      </div>
                      {student.weakSubjects.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {student.weakSubjects.map((sub, sIdx) => (
                            <Badge key={sIdx} variant="outline" className="text-[10px] bg-background">
                              {sub}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">General revision required</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Dynamic Recommendations */}
        <Card className="border-2 border-primary bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-primary">Cohort Action Plan & Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {recommendations.map((rec, idx) => (
              <p key={idx} className="text-foreground leading-relaxed">{rec}</p>
            ))}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

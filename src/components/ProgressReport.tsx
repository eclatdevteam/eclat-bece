import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Download, Calendar } from "lucide-react";

interface SubjectProgress {
  subject: string;
  currentScore: number;
  improvement: number;
  questionsCompleted: number;
  accuracy: number;
}

interface ProgressReportProps {
  subjectProgress?: SubjectProgress[];
  totalQuestionsCompleted?: number;
  overallAccuracy?: number;
}

export const ProgressReport = ({
  subjectProgress = [
    { subject: "Math", currentScore: 580, improvement: 45, questionsCompleted: 142, accuracy: 78 },
    { subject: "Reading", currentScore: 620, improvement: 38, questionsCompleted: 98, accuracy: 82 },
    { subject: "Writing", currentScore: 610, improvement: 52, questionsCompleted: 87, accuracy: 85 },
  ],
  totalQuestionsCompleted = 327,
  overallAccuracy = 82,
}: ProgressReportProps) => {
  
  const totalScore = subjectProgress.reduce((sum, item) => sum + item.currentScore, 0);
  
  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="text-accent" size={24} />
              Progress Report
            </CardTitle>
            <CardDescription>Your SAT prep journey at a glance</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Download size={16} />
            Export PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Overall Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-6 p-4 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Current SAT Score</p>
            <p className="text-3xl font-bold text-primary">{totalScore}</p>
            <p className="text-xs text-muted-foreground">out of 1600</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Questions Completed</p>
            <p className="text-3xl font-bold text-accent">{totalQuestionsCompleted}</p>
            <p className="text-xs text-accent">+{Math.round(totalQuestionsCompleted * 0.15)} this week</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Overall Accuracy</p>
            <p className="text-3xl font-bold text-primary">{overallAccuracy}%</p>
            <p className="text-xs text-accent">↑ 5% from last month</p>
          </div>
        </div>

        {/* Subject Breakdown */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
            <Calendar size={16} />
            Subject Breakdown
          </h4>
          {subjectProgress.map((subject, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-2">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h5 className="font-semibold">{subject.subject}</h5>
                  <p className="text-sm text-muted-foreground">
                    {subject.questionsCompleted} questions completed
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{subject.currentScore}</p>
                  <p className="text-xs text-accent">+{subject.improvement} points</p>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Accuracy</span>
                  <span className="font-semibold">{subject.accuracy}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-hero transition-all"
                    style={{ width: `${subject.accuracy}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-primary-light/30 rounded-lg border border-primary/20">
          <p className="text-sm">
            <span className="font-semibold">Pro Tip:</span> Focus on Math section to reach 1300+ score. 
            Your reading and writing scores are strong!
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

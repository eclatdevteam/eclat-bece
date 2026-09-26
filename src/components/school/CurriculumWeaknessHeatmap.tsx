import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle2, TrendingUp, AlertTriangle, Plus, Filter, Sparkles, BookOpen } from "lucide-react";

export interface SchoolTopicMasteryRecord {
  student_id: string;
  subject: string;
  topic: string;
  rolling_accuracy: number;
  status: string; // 'weak' | 'developing' | 'mastered'
  total_attempted: number;
}

export interface StudentCohortInfo {
  id: string;
  name: string;
  class_year: "year_6" | "year_9" | null;
}

interface CurriculumWeaknessHeatmapProps {
  topicMastery: SchoolTopicMasteryRecord[];
  students: StudentCohortInfo[];
  onAssignFocusPractice?: (subject: string, topic: string, cohort: "year_6" | "year_9") => void;
}

interface AggregatedTopicData {
  subject: string;
  topic: string;
  assessedStudentCount: number;
  avgAccuracy: number;
  weakCount: number;
  developingCount: number;
  masteredCount: number;
  strugglingRate: number; // percentage of students who are weak (<60%)
  statusCategory: "critical" | "developing" | "mastered";
}

export function CurriculumWeaknessHeatmap({
  topicMastery,
  students,
  onAssignFocusPractice,
}: CurriculumWeaknessHeatmapProps) {
  const [selectedCohort, setSelectedCohort] = useState<"all" | "year_6" | "year_9">("all");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedSeverity, setSelectedSeverity] = useState<"all" | "critical" | "developing" | "mastered">("all");

  // Map student ID to cohort
  const studentCohortMap = useMemo(() => {
    const map = new Map<string, "year_6" | "year_9">();
    students.forEach((s) => {
      map.set(s.id, s.class_year === "year_6" ? "year_6" : "year_9");
    });
    return map;
  }, [students]);

  // Filter mastery data by cohort
  const filteredMastery = useMemo(() => {
    if (selectedCohort === "all") return topicMastery;
    return topicMastery.filter((tm) => studentCohortMap.get(tm.student_id) === selectedCohort);
  }, [topicMastery, selectedCohort, studentCohortMap]);

  // Aggregate by Subject + Topic
  const aggregatedTopics = useMemo<AggregatedTopicData[]>(() => {
    const map = new Map<string, {
      subject: string;
      topic: string;
      accuracies: number[];
      weakCount: number;
      developingCount: number;
      masteredCount: number;
    }>();

    filteredMastery.forEach((item) => {
      const key = `${item.subject}:::${item.topic}`;
      if (!map.has(key)) {
        map.set(key, {
          subject: item.subject,
          topic: item.topic,
          accuracies: [],
          weakCount: 0,
          developingCount: 0,
          masteredCount: 0,
        });
      }
      const entry = map.get(key)!;
      const acc = Number(item.rolling_accuracy) || 0;
      entry.accuracies.push(acc);
      if (item.status === "weak" || acc < 60) entry.weakCount++;
      else if (item.status === "mastered" || acc >= 85) entry.masteredCount++;
      else entry.developingCount++;
    });

    const result: AggregatedTopicData[] = [];
    map.forEach((value) => {
      const total = value.accuracies.length;
      if (total === 0) return;
      const avgAccuracy = Math.round(value.accuracies.reduce((a, b) => a + b, 0) / total);
      const strugglingRate = Math.round((value.weakCount / total) * 100);

      let statusCategory: "critical" | "developing" | "mastered" = "developing";
      if (avgAccuracy < 60 || strugglingRate >= 50) {
        statusCategory = "critical";
      } else if (avgAccuracy >= 80 && strugglingRate <= 15) {
        statusCategory = "mastered";
      }

      result.push({
        subject: value.subject,
        topic: value.topic,
        assessedStudentCount: total,
        avgAccuracy,
        weakCount: value.weakCount,
        developingCount: value.developingCount,
        masteredCount: value.masteredCount,
        strugglingRate,
        statusCategory,
      });
    });

    // Sort by priority: critical first (highest struggling rate), then developing, then mastered
    return result.sort((a, b) => {
      if (a.statusCategory === "critical" && b.statusCategory !== "critical") return -1;
      if (b.statusCategory === "critical" && a.statusCategory !== "critical") return 1;
      return a.avgAccuracy - b.avgAccuracy;
    });
  }, [filteredMastery]);

  // Available subjects for filtering
  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    topicMastery.forEach((tm) => set.add(tm.subject));
    return Array.from(set).sort();
  }, [topicMastery]);

  // Display filtered list
  const displayTopics = useMemo(() => {
    return aggregatedTopics.filter((t) => {
      if (selectedSubject !== "all" && t.subject !== selectedSubject) return false;
      if (selectedSeverity !== "all" && t.statusCategory !== selectedSeverity) return false;
      return true;
    });
  }, [aggregatedTopics, selectedSubject, selectedSeverity]);

  // Priority intervention topics (Top 3 critical)
  const priorityInterventions = useMemo(() => {
    return aggregatedTopics.filter((t) => t.statusCategory === "critical").slice(0, 3);
  }, [aggregatedTopics]);

  const handleAssign = (subject: string, topic: string) => {
    const cohort = selectedCohort === "year_6" ? "year_6" : "year_9";
    onAssignFocusPractice?.(subject, topic, cohort);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Priority Classroom Intervention Alert */}
      {priorityInterventions.length > 0 && (
        <Card className="border-2 border-destructive/40 bg-destructive/5 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <CardTitle className="text-base font-black">
                Urgent Cohort Interventions Detected
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-foreground/80">
              The following curriculum topics have high failure or struggle rates across your students. Immediate targeted practice is recommended before upcoming examinations.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid sm:grid-cols-3 gap-3">
              {priorityInterventions.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-background border border-destructive/30 flex flex-col justify-between shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <Badge variant="outline" className="text-[10px] font-bold border-destructive/40 text-destructive">
                        {item.subject}
                      </Badge>
                      <span className="text-[11px] font-black text-destructive">
                        {item.strugglingRate}% struggling
                      </span>
                    </div>
                    <p className="font-bold text-sm text-foreground line-clamp-1">{item.topic}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Avg Accuracy: <span className="font-bold text-destructive">{item.avgAccuracy}%</span> ({item.assessedStudentCount} students)
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="w-full mt-3 h-8 text-xs font-bold gap-1.5"
                    onClick={() => handleAssign(item.subject, item.topic)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Assign Focus Practice
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-card border-2 border-border/60">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Filters:</span>
          </div>

          {/* Cohort Selector */}
          <Select
            value={selectedCohort}
            onValueChange={(val) => setSelectedCohort(val as "all" | "year_6" | "year_9")}
          >
            <SelectTrigger className="w-[170px] h-8 text-xs font-bold">
              <SelectValue placeholder="Cohort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cohorts</SelectItem>
              <SelectItem value="year_6">Year 6 (Common Entrance)</SelectItem>
              <SelectItem value="year_9">Year 9 (BECE)</SelectItem>
            </SelectContent>
          </Select>

          {/* Subject Selector */}
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-[160px] h-8 text-xs font-bold">
              <SelectValue placeholder="Subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {availableSubjects.map((sub) => (
                <SelectItem key={sub} value={sub}>{sub}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Severity Selector */}
          <Select
            value={selectedSeverity}
            onValueChange={(val) => setSelectedSeverity(val as any)}
          >
            <SelectTrigger className="w-[170px] h-8 text-xs font-bold">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Mastery Levels</SelectItem>
              <SelectItem value="critical">🔴 Critical Gap (&lt;60%)</SelectItem>
              <SelectItem value="developing">🟡 Developing (60-79%)</SelectItem>
              <SelectItem value="mastered">🟢 Mastered (80%+)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-xs font-bold text-muted-foreground">
          Showing {displayTopics.length} topic{displayTopics.length === 1 ? "" : "s"}
        </div>
      </div>

      {/* Main Heatmap Grid */}
      {displayTopics.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="font-bold text-foreground">No topic mastery data found for this selection</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-md">
              As your students complete curriculum quizzes and practice tests, their rolling 30-question mastery matrix will automatically aggregate here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayTopics.map((topicData, idx) => {
            const isCritical = topicData.statusCategory === "critical";
            const isMastered = topicData.statusCategory === "mastered";

            return (
              <Card
                key={idx}
                className={`border-2 transition-all hover:shadow-md ${
                  isCritical
                    ? "border-destructive/40 bg-destructive/5 hover:border-destructive"
                    : isMastered
                    ? "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500"
                    : "border-border/70 hover:border-primary"
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="outline" className="text-[10px] font-bold">
                      {topicData.subject}
                    </Badge>
                    {isCritical ? (
                      <Badge variant="destructive" className="text-[10px] font-black uppercase">
                        Critical Gap
                      </Badge>
                    ) : isMastered ? (
                      <Badge className="bg-emerald-600 text-white text-[10px] font-black uppercase">
                        Mastered
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] font-black uppercase">
                        Developing
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-sm font-bold text-foreground mt-1 line-clamp-1">
                    {topicData.topic}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  {/* Accuracy Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-muted-foreground">Classroom Accuracy</span>
                      <span
                        className={`font-black ${
                          isCritical
                            ? "text-destructive"
                            : isMastered
                            ? "text-emerald-600"
                            : "text-foreground"
                        }`}
                      >
                        {topicData.avgAccuracy}%
                      </span>
                    </div>
                    <Progress
                      value={topicData.avgAccuracy}
                      className={`h-2 ${
                        isCritical ? "[&>div]:bg-destructive" : isMastered ? "[&>div]:bg-emerald-500" : ""
                      }`}
                    />
                  </div>

                  {/* Student Cohort Breakdown */}
                  <div className="grid grid-cols-3 gap-1.5 p-2 rounded-lg bg-background/80 border border-border/40 text-center">
                    <div>
                      <p className="text-[9px] font-bold text-destructive uppercase">Weak</p>
                      <p className="text-xs font-black text-destructive">{topicData.weakCount}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-amber-600 uppercase">Dev.</p>
                      <p className="text-xs font-black text-amber-600">{topicData.developingCount}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-emerald-600 uppercase">Mastered</p>
                      <p className="text-xs font-black text-emerald-600">{topicData.masteredCount}</p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button
                    size="sm"
                    variant={isCritical ? "destructive" : "outline"}
                    className="w-full h-8 text-xs font-bold gap-1.5"
                    onClick={() => handleAssign(topicData.subject, topicData.topic)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Assign Targeted Quiz
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

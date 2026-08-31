import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, Clock, Target, ChevronRight, ChevronLeft, Loader2, CheckCircle2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StudentOption {
  id: string;
  name: string;
  class_year: "year_6" | "year_9" | null;
}

interface SchoolAssignPracticeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  defaultCohort?: "year_6" | "year_9";
  students: StudentOption[];
  onSuccess?: () => void;
}

type Step = "target" | "subject" | "topics" | "config" | "summary";

export function SchoolAssignPracticeDialog({
  open,
  onOpenChange,
  schoolId,
  defaultCohort = "year_9",
  students,
  onSuccess,
}: SchoolAssignPracticeDialogProps) {
  const [step, setStep] = useState<Step>("target");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Target State: "all" or specific student id
  const [targetType, setTargetType] = useState<"all" | "individual">("all");
  const [selectedCohort, setSelectedCohort] = useState<"year_6" | "year_9">(defaultCohort);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  // Metadata from backend
  const [subjectsMetadata, setSubjectsMetadata] = useState<Record<string, string[]>>({});
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);

  // Form State
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [numQuestions, setNumQuestions] = useState<number>(15);
  const [duration, setDuration] = useState<number>(30);
  const [maxAvailableQuestions, setMaxAvailableQuestions] = useState<number>(15);

  useEffect(() => {
    if (defaultCohort) {
      setSelectedCohort(defaultCohort);
    }
  }, [defaultCohort]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setStep("target");
      setTargetType("all");
      setSelectedSubject("");
      setSelectedTopics([]);
      setNumQuestions(15);
      setDuration(30);
      setSelectedStudentId("");
    } else {
      fetchMetadata(selectedCohort);
    }
  }, [open, selectedCohort]);

  const fetchMetadata = async (cohort: "year_6" | "year_9") => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("quiz-utilities", {
        body: {
          classYear: cohort,
          action: "get-metadata",
        },
      });

      if (error) throw error;
      const metadata = data?.metadata || {};
      setSubjectsMetadata(metadata);
      setAvailableSubjects(Object.keys(metadata).sort());
    } catch (error: any) {
      console.error("Error fetching subject metadata:", error);
      // Fallback subjects if edge function is unreachable
      const fallback = cohort === "year_6"
        ? {
            Mathematics: ["Fractions", "Algebra", "Decimals", "Word Problems"],
            "English Language": ["Grammar", "Comprehension", "Vocabulary", "Spelling"],
            "Basic Science": ["Living Things", "Energy", "Matter", "Environment"],
            "Social Studies": ["Culture", "Leadership", "Civic Education", "Geography"],
          }
        : {
            Mathematics: ["Algebra", "Geometry", "Statistics", "Trigonometry", "Number Bases"],
            "English Language": ["Grammar", "Comprehension", "Literary Devices", "Vocabulary"],
            "Basic Science": ["Energy", "Living Things", "Matter & Chemicals", "Forces"],
            "Social Studies": ["Governance", "Social Issues", "National Economy", "Culture"],
            "Business Studies": ["Bookkeeping", "Commerce", "Office Practice", "Keyboarding"],
          };
      setSubjectsMetadata(fallback);
      setAvailableSubjects(Object.keys(fallback).sort());
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQuestionCount = async (subject: string, topics: string[]) => {
    try {
      const { data, error } = await supabase.functions.invoke("quiz-utilities", {
        body: {
          classYear: selectedCohort,
          action: "get-question-count",
          subject,
          topics,
        },
      });

      if (error) throw error;
      const count = data?.count || 0;
      setMaxAvailableQuestions(count > 0 ? count : 30);
      if (numQuestions > count && count > 0) {
        setNumQuestions(count);
      }
    } catch (error) {
      console.error("Error fetching question count:", error);
      setMaxAvailableQuestions(30);
    }
  };

  const filteredStudents = students.filter(
    (s) => !s.class_year || s.class_year === selectedCohort
  );

  const getTargetStudents = () => {
    if (targetType === "individual") {
      return filteredStudents.filter((s) => s.id === selectedStudentId);
    }
    return filteredStudents;
  };

  const handleSelectSubject = (subject: string) => {
    setSelectedSubject(subject);
    setSelectedTopics([]);
    setStep("topics");
  };

  const handleToggleTopic = (topic: string) => {
    const nextTopics = selectedTopics.includes(topic)
      ? selectedTopics.filter((t) => t !== topic)
      : [...selectedTopics, topic];

    setSelectedTopics(nextTopics);
    if (nextTopics.length > 0) {
      fetchQuestionCount(selectedSubject, nextTopics);
    }
  };

  const handleSelectAllTopics = () => {
    const allTopics = subjectsMetadata[selectedSubject] || [];
    setSelectedTopics(allTopics);
    fetchQuestionCount(selectedSubject, allTopics);
  };

  const handleSubmit = async () => {
    const targetStudents = getTargetStudents();
    if (targetStudents.length === 0) {
      toast.error("No students found in this cohort to assign quiz to");
      return;
    }

    setIsSubmitting(true);
    try {
      const assignments = targetStudents.map((student) => ({
        student_id: student.id,
        school_id: schoolId,
        subject: selectedSubject,
        topics: selectedTopics,
        num_questions: numQuestions,
        duration: duration,
        status: "pending",
      }));

      const { error } = await supabase
        .from("practice_assignments")
        .insert(assignments);

      if (error) throw error;

      toast.success(
        targetStudents.length === 1
          ? `Assignment assigned to ${targetStudents[0].name}!`
          : `Assignment created for all ${targetStudents.length} students in ${selectedCohort === "year_6" ? "Year 6" : "Year 9"}!`
      );

      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error creating assignments:", error);
      toast.error(error.message || "Failed to create practice assignment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Assign Practice Quiz</DialogTitle>
              <DialogDescription>
                Create and push targeted quiz assignments to your students
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-between py-2 border-y border-border/50 text-xs font-semibold text-muted-foreground">
          <span className={step === "target" ? "text-primary font-bold" : ""}>1. Target</span>
          <span>→</span>
          <span className={step === "subject" ? "text-primary font-bold" : ""}>2. Subject</span>
          <span>→</span>
          <span className={step === "topics" ? "text-primary font-bold" : ""}>3. Topics</span>
          <span>→</span>
          <span className={step === "config" ? "text-primary font-bold" : ""}>4. Config</span>
          <span>→</span>
          <span className={step === "summary" ? "text-primary font-bold" : ""}>5. Confirm</span>
        </div>

        {/* STEP 1: TARGET SELECTION */}
        {step === "target" && (
          <div className="space-y-5 py-3 animate-fade-in">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Select Class Cohort</label>
              <Select
                value={selectedCohort}
                onValueChange={(val: "year_6" | "year_9") => {
                  setSelectedCohort(val);
                  fetchMetadata(val);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select cohort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="year_6">Year 6 / Primary 6 (Common Entrance)</SelectItem>
                  <SelectItem value="year_9">Year 9 / JSS 3 (BECE)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold">Assign To</label>
              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => {
                    setTargetType("all");
                    setSelectedStudentId("");
                  }}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    targetType === "all"
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-5 w-5 text-primary" />
                    <span className="font-bold text-sm">Whole Class</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Assign to all {filteredStudents.length} students in this cohort
                  </p>
                </div>

                <div
                  onClick={() => setTargetType("individual")}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    targetType === "individual"
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="h-5 w-5 text-accent" />
                    <span className="font-bold text-sm">Individual Student</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Select a single student for targeted practice
                  </p>
                </div>
              </div>
            </div>

            {targetType === "individual" && (
              <div className="space-y-2 animate-fade-in">
                <label className="text-sm font-semibold">Select Student</label>
                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredStudents.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <DialogFooter className="pt-4">
              <Button
                variant="hero"
                onClick={() => setStep("subject")}
                disabled={targetType === "individual" && !selectedStudentId}
                className="w-full sm:w-auto gap-2"
              >
                Continue to Subjects <ChevronRight className="h-4 w-4" />
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* STEP 2: SUBJECT SELECTION */}
        {step === "subject" && (
          <div className="space-y-4 py-3 animate-fade-in">
            <h4 className="text-sm font-semibold text-muted-foreground">Select a Subject</h4>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableSubjects.map((subject) => (
                  <Button
                    key={subject}
                    variant={selectedSubject === subject ? "default" : "outline"}
                    className="h-16 justify-start px-4 text-left font-bold text-sm border-2"
                    onClick={() => handleSelectSubject(subject)}
                  >
                    <BookOpen className="mr-3 h-5 w-5 text-primary flex-shrink-0" />
                    <div className="truncate">
                      <div>{subject}</div>
                      <div className="text-[11px] font-normal text-muted-foreground">
                        {subjectsMetadata[subject]?.length || 0} topics available
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}

            <DialogFooter className="pt-4 flex justify-between">
              <Button variant="outline" onClick={() => setStep("target")}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Back
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* STEP 3: TOPICS SELECTION */}
        {step === "topics" && (
          <div className="space-y-4 py-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-foreground">{selectedSubject} Topics</h4>
                <p className="text-xs text-muted-foreground">
                  Select specific topics or assign all topics
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAllTopics}
                className="text-xs"
              >
                Select All
              </Button>
            </div>

            <ScrollArea className="h-60 border rounded-xl p-3">
              <div className="space-y-2">
                {(subjectsMetadata[selectedSubject] || []).map((topic) => {
                  const isChecked = selectedTopics.includes(topic);
                  return (
                    <div
                      key={topic}
                      onClick={() => handleToggleTopic(topic)}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        isChecked ? "bg-primary/5 border-primary" : "border-border/60 hover:bg-muted/40"
                      }`}
                    >
                      <Checkbox checked={isChecked} onCheckedChange={() => handleToggleTopic(topic)} />
                      <span className="text-sm font-medium">{topic}</span>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <DialogFooter className="pt-4 flex justify-between">
              <Button variant="outline" onClick={() => setStep("subject")}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button
                variant="hero"
                disabled={selectedTopics.length === 0}
                onClick={() => setStep("config")}
                className="gap-2"
              >
                Next: Quiz Settings <ChevronRight className="h-4 w-4" />
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* STEP 4: CONFIGURATION */}
        {step === "config" && (
          <div className="space-y-6 py-3 animate-fade-in">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" /> Number of Questions
                </label>
                <span className="text-base font-bold text-primary">{numQuestions} Questions</span>
              </div>
              <Slider
                value={[numQuestions]}
                min={5}
                max={Math.min(maxAvailableQuestions, 50)}
                step={5}
                onValueChange={(val) => setNumQuestions(val[0])}
              />
              <p className="text-xs text-muted-foreground">
                Max available for chosen topics: {maxAvailableQuestions}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-accent" /> Time Limit (Minutes)
                </label>
                <span className="text-base font-bold text-accent">{duration} Mins</span>
              </div>
              <Slider
                value={[duration]}
                min={5}
                max={90}
                step={5}
                onValueChange={(val) => setDuration(val[0])}
              />
              <p className="text-xs text-muted-foreground">
                Average of ~{(duration / numQuestions * 60).toFixed(0)} seconds per question
              </p>
            </div>

            <DialogFooter className="pt-4 flex justify-between">
              <Button variant="outline" onClick={() => setStep("topics")}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button variant="hero" onClick={() => setStep("summary")} className="gap-2">
                Review & Confirm <ChevronRight className="h-4 w-4" />
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* STEP 5: SUMMARY & SUBMIT */}
        {step === "summary" && (
          <div className="space-y-4 py-3 animate-fade-in">
            <div className="p-4 bg-muted/50 rounded-xl border border-border/60 space-y-3 text-sm">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Cohort:</span>
                <span className="font-bold">
                  {selectedCohort === "year_6" ? "Year 6 / Primary 6" : "Year 9 / JSS 3"}
                </span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Assigned To:</span>
                <span className="font-bold text-primary">
                  {targetType === "all"
                    ? `Whole Class (${getTargetStudents().length} Students)`
                    : getTargetStudents()[0]?.name || "1 Student"}
                </span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Subject:</span>
                <span className="font-bold">{selectedSubject}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Topics:</span>
                <span className="font-bold">{selectedTopics.length} selected</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Format:</span>
                <span className="font-bold">{numQuestions} Questions • {duration} Minutes</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {selectedTopics.map((t) => (
                <Badge key={t} variant="secondary" className="text-xs">
                  {t}
                </Badge>
              ))}
            </div>

            <DialogFooter className="pt-4 flex justify-between">
              <Button variant="outline" onClick={() => setStep("config")} disabled={isSubmitting}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button
                variant="hero"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Assigning...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Send Assignment
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

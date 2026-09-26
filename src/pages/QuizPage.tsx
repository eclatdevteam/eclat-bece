import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  Trophy,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Flag,
  RotateCcw,
  Sparkles,
  Eye,
  Clock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QuestionSnapshotDialog } from "@/components/quiz/QuestionSnapshotDialog";

interface QuizOption {
  text: string;
  image_url?: string | null;
}

interface Question {
  id: string;
  question: string;
  options: QuizOption[];
  correctAnswer: number;
  explanation: string;
  subject: string;
  image_url?: string | null;
  passage?: {
    title: string | null;
    passage_text: string;
  } | null;
}

export default function QuizPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const subject = searchParams.get("subject");
  const topic = searchParams.get("topic");
  const assignmentId = searchParams.get("assignmentId");
  const isReviewMode = searchParams.get("review") === "true";

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [userResponses, setUserResponses] = useState<(number | null)[]>([]);
  const [quizSubject, setQuizSubject] = useState(subject || "Mixed Topics");
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Assignment Time Limit State
  const [assignmentDuration, setAssignmentDuration] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Question Snapshot Review Dialog States
  const [snapshotDialogOpen, setSnapshotDialogOpen] = useState(false);
  const [snapshotInitialIndex, setSnapshotInitialIndex] = useState(0);

  // Question Flagging States
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  const [questionToFlag, setQuestionToFlag] = useState<Question | null>(null);
  const [flagReason, setFlagReason] = useState("");
  const [flagDetails, setFlagDetails] = useState("");
  const [flaggedQuestionIds, setFlaggedQuestionIds] = useState<string[]>([]);
  const [submittingFlag, setSubmittingFlag] = useState(false);

  // Keep a ref to latest state for auto-submit on timeout
  const latestQuizState = useRef({
    currentQuestion,
    selectedAnswer,
    score,
    answers,
    userResponses,
    questions,
    assignmentDuration,
  });

  useEffect(() => {
    latestQuizState.current = {
      currentQuestion,
      selectedAnswer,
      score,
      answers,
      userResponses,
      questions,
      assignmentDuration,
    };
  }, [currentQuestion, selectedAnswer, score, answers, userResponses, questions, assignmentDuration]);

  const getSessionCacheKey = useCallback(() => {
    if (!user) return null;
    return `eclat_quiz_cache_${user.id}_${assignmentId || subject || "mixed"}_${topic || "all"}`;
  }, [user, assignmentId, subject, topic]);

  const clearSessionCache = useCallback(() => {
    const key = getSessionCacheKey();
    if (key) {
      try {
        sessionStorage.removeItem(key);
      } catch (e) {
        // ignore
      }
    }
  }, [getSessionCacheKey]);

  const handleOpenFlagDialog = (q?: Question) => {
    const targetQ = q || questions[currentQuestion] || null;
    setQuestionToFlag(targetQ);
    setFlagReason("");
    setFlagDetails("");
    setFlagDialogOpen(true);
  };

  const handleFlagQuestion = async () => {
    const targetQ = questionToFlag || questions[currentQuestion];
    if (!user || !targetQ) return;
    if (!flagReason) {
      toast.error("Please select a reason for flagging.");
      return;
    }

    setSubmittingFlag(true);
    try {
      // 1. Get student ID and class year
      const { data: studentData } = await supabase
        .from("students")
        .select("id, class_year")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!studentData?.id) {
        toast.error("Student profile not found.");
        return;
      }

      // 2. Insert flag report
      const { error } = await supabase
        .from("flagged_questions")
        .insert({
          student_id: studentData.id,
          class_year: studentData.class_year,
          question_id: targetQ.id,
          subject: targetQ.subject,
          topic: topic || "Mixed Topics",
          question_text: targetQ.question,
          reason: flagReason,
          details: flagDetails.trim() || null,
        });

      if (error) throw error;

      toast.success("Thank you! Question has been flagged for admin review. 🎉");
      setFlaggedQuestionIds((prev) => [...prev, targetQ.id]);
      setFlagDialogOpen(false);
      setFlagReason("");
      setFlagDetails("");
      setQuestionToFlag(null);
    } catch (err: any) {
      console.error("Error flagging question:", err);
      toast.error(err.message || "Failed to submit flag report.");
    } finally {
      setSubmittingFlag(false);
    }
  };

  const fetchQuestions = useCallback(
    async (forceFresh = false) => {
      if (!user) return;
      setLoading(true);

      try {
        let fetchSubject = subject;
        let fetchTopics: string[] = topic ? [topic] : [];
        let fetchLimit = 10;
        let classYear = "";

        // If assignmentId is present, fetch assignment details including duration and past snapshot
        if (assignmentId) {
          const { data: assignment, error: assignError } = await supabase
            .from("practice_assignments")
            .select("subject, topics, num_questions, duration, questions_snapshot, status, student:students(class_year)")
            .eq("id", assignmentId)
            .single();

          if (assignError || !assignment) {
            toast.error("Failed to load assignment details");
            navigate("/dashboard/student");
            return;
          }

          if (assignment.duration) {
            setAssignmentDuration(assignment.duration);
            if (!isReviewMode) {
              setTimeLeft(assignment.duration * 60);
            }
          }

          // If in review mode and snapshot exists, open directly in review mode
          if (isReviewMode && assignment.questions_snapshot) {
            const snap = assignment.questions_snapshot as any;
            if (snap.questions && snap.questions.length > 0) {
              const sortedQuestions = [...snap.questions].sort((a: any, b: any) => {
                const orderA = a.question_number ?? a.original_order ?? 0;
                const orderB = b.question_number ?? b.original_order ?? 0;
                return orderA - orderB;
              });

              const sortedAnswers = sortedQuestions.map((q: any, i: number) =>
                q.isCorrect !== undefined ? q.isCorrect : (snap.answers?.[i] ?? false)
              );
              const sortedResponses = sortedQuestions.map((q: any, i: number) =>
                q.userResponse !== undefined ? q.userResponse : (snap.userResponses?.[i] ?? null)
              );

              setQuestions(sortedQuestions);
              setUserResponses(sortedResponses);
              setAnswers(sortedAnswers);
              setScore(sortedAnswers.filter(Boolean).length);
              setQuizSubject(assignment.subject || "Practice Assignment");
              setQuizComplete(true);
              setLoading(false);
              return;
            }
          }

          fetchSubject = assignment.subject;
          fetchTopics = assignment.topics;
          fetchLimit = assignment.num_questions;
          classYear = (assignment.student as any)?.class_year;
        }

        const cacheKey = getSessionCacheKey();

        // Check session storage cache unless forced fresh
        if (!forceFresh && cacheKey) {
          try {
            const cached = sessionStorage.getItem(cacheKey);
            if (cached) {
              const parsed = JSON.parse(cached);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setQuestions(parsed);
                setQuizSubject(parsed[0]?.subject || subject || "Mixed Topics");
                setLoading(false);
                return;
              }
            }
          } catch (cacheErr) {
            console.warn("Could not read quiz cache from sessionStorage:", cacheErr);
          }
        }

        // If not assignment, get student's class year
        if (!classYear) {
          const { data: studentData } = await supabase
            .from("students")
            .select("class_year")
            .eq("user_id", user.id)
            .maybeSingle();

          if (!studentData?.class_year) {
            toast.error("Unable to determine your class year");
            navigate("/dashboard/student");
            return;
          }
          classYear = studentData.class_year;
        }

        // Determine which table to query
        const tableName =
          classYear === "year_6"
            ? "quiz_questions_year6"
            : "quiz_questions_year9";

        const optionsTableName =
          classYear === "year_6"
            ? "quiz_options_year6"
            : "quiz_options_year9";

        const passageTableName =
          classYear === "year_6"
            ? "comprehension_passages_year6"
            : "comprehension_passages_year9";

        let query = supabase.from(tableName).select(`
            *,
            passage:${passageTableName}(title, passage_text)
          `);

        if (fetchSubject) {
          query = query.eq("subject", fetchSubject);
        }

        if (fetchTopics && fetchTopics.length > 0) {
          query = query.in("topic", fetchTopics);
        }

        setQuizSubject(fetchSubject || "Mixed Topics");

        const { data: allQuestions, error: questionsError } = await query;

        if (questionsError) {
          console.error("Error fetching questions:", questionsError);
          toast.error("Failed to load questions");
          navigate("/dashboard/student");
          return;
        }

        if (!allQuestions || allQuestions.length === 0) {
          toast.error("No questions available for this selection");
          navigate("/dashboard/student");
          return;
        }

        // Randomly shuffle and select questions based on limit
        const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
        const questionsData = shuffled.slice(
          0,
          Math.min(fetchLimit, shuffled.length)
        );
        const questionIds = questionsData.map((q: any) => q.id);

        // Fetch all options for selected questions in a single batched query
        const { data: allOptionsData, error: optionsError } = await supabase
          .from(optionsTableName as any)
          .select("*")
          .in("question_id", questionIds)
          .order("display_order");

        if (optionsError) {
          console.error("Error fetching options:", optionsError);
        }

        const optionsByQuestion = (allOptionsData || []).reduce(
          (acc: Record<string, any[]>, opt: any) => {
            if (!acc[opt.question_id]) {
              acc[opt.question_id] = [];
            }
            acc[opt.question_id].push(opt);
            return acc;
          },
          {}
        );

        const questionsWithOptions: Question[] = questionsData.map((q: any) => {
          const optionsData = optionsByQuestion[q.id] || [];
          const correctOptionIndex = optionsData.findIndex(
            (opt: any) => opt.is_correct
          );

          return {
            id: q.id,
            question: q.question_text,
            options: optionsData.map((opt: any) => ({
              text: opt.option_text,
              image_url: opt.image_url || null,
            })),
            correctAnswer: correctOptionIndex >= 0 ? correctOptionIndex : 0,
            explanation: q.explanation || "No explanation available.",
            subject: q.subject,
            passage: q.passage || null,
            image_url: q.image_url || null,
          };
        });

        setQuestions(questionsWithOptions);

        // Cache questions in sessionStorage so retakes / page reloads preserve test
        if (cacheKey) {
          try {
            sessionStorage.setItem(cacheKey, JSON.stringify(questionsWithOptions));
          } catch (cacheErr) {
            console.warn("Could not cache questions:", cacheErr);
          }
        }
      } catch (error) {
        console.error("Error:", error);
        toast.error("An error occurred while loading questions");
        navigate("/dashboard/student");
      } finally {
        setLoading(false);
      }
    },
    [user, subject, topic, assignmentId, navigate, isReviewMode, getSessionCacheKey]
  );

  useEffect(() => {
    fetchQuestions(false);
  }, [fetchQuestions]);

  // Countdown timer effect
  useEffect(() => {
    if (timeLeft === null || quizComplete || loading) return;

    if (timeLeft <= 0) {
      toast.warning("Time has expired! Submitting your answers now...", {
        duration: 4000,
      });
      handleTimeExpired();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, quizComplete, loading]);

  const handleTimeExpired = async () => {
    const state = latestQuizState.current;
    let finalAnswers = [...state.answers];
    let finalResponses = [...state.userResponses];
    let finalScore = state.score;

    // If student selected an answer on the current question but hasn't submitted yet
    if (state.selectedAnswer !== null && state.questions[state.currentQuestion]) {
      const q = state.questions[state.currentQuestion];
      const isCorrect = state.selectedAnswer === q.correctAnswer;
      if (isCorrect) finalScore += 1;
      finalAnswers.push(isCorrect);
      finalResponses.push(state.selectedAnswer);
    }

    // Pad remaining unanswered questions with null / false
    while (finalAnswers.length < state.questions.length) {
      finalAnswers.push(false);
      finalResponses.push(null);
    }

    setAnswers(finalAnswers);
    setUserResponses(finalResponses);
    setScore(finalScore);
    setQuizComplete(true);

    await saveQuizResults(finalScore, finalAnswers, finalResponses);
  };

  const question = questions[currentQuestion];
  const progress =
    questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0;

  const handleAnswerSelect = (index: number) => {
    if (!showFeedback) {
      setSelectedAnswer(index);
    }
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;

    const isCorrect = selectedAnswer === question.correctAnswer;
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }
    setAnswers((prev) => [...prev, isCorrect]);
    setUserResponses((prev) => [...prev, selectedAnswer]);
    setShowFeedback(true);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      saveQuizResults();
      setQuizComplete(true);
    }
  };

  const saveQuizResults = async (
    overrideScore?: number,
    overrideAnswers?: boolean[],
    overrideResponses?: (number | null)[]
  ) => {
    if (!user) return;

    const finalScore = overrideScore !== undefined ? overrideScore : score;
    const finalAnswers = overrideAnswers || answers;
    const finalResponses = overrideResponses || userResponses;

    try {
      // Get student ID
      const { data: studentData } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!studentData?.id) {
        console.error("Student ID not found");
        return;
      }

      const percentage = Math.round((finalScore / questions.length) * 100);

      // Insert quiz result
      const { error } = await supabase.from("quiz_results").insert({
        student_id: studentData.id,
        subject: quizSubject || subject || "Mixed Topics",
        score: percentage,
        total_questions: questions.length,
        correct_answers: finalScore,
      });

      if (error) {
        console.error("Error saving quiz result:", error);
        toast.error("Failed to save quiz results");
      } else {
        // If it was an assignment, update assignment status and store questions_snapshot
        if (assignmentId) {
          const questionsSnapshot = {
            questions: questions.map((q, idx) => ({
              id: q.id,
              question_number: idx + 1,
              original_order: idx + 1,
              question: q.question,
              options: q.options,
              correctAnswer: q.correctAnswer,
              userResponse: finalResponses[idx] !== undefined ? finalResponses[idx] : null,
              isCorrect: finalAnswers[idx] !== undefined ? finalAnswers[idx] : false,
              explanation: q.explanation,
              subject: q.subject,
              image_url: q.image_url || null,
              passage: q.passage || null,
            })),
            userResponses: finalResponses,
            answers: finalAnswers,
            score: percentage,
            totalQuestions: questions.length,
            durationMinutes: assignmentDuration,
            completedAt: new Date().toISOString(),
          };

          await supabase
            .from("practice_assignments")
            .update({
              status: "completed",
              score: percentage,
              completed_at: new Date().toISOString(),
              questions_snapshot: questionsSnapshot,
            })
            .eq("id", assignmentId);

          try {
            const { data: assignmentData } = await supabase
              .from("practice_assignments")
              .select("parent_id, subject")
              .eq("id", assignmentId)
              .single();

            if (assignmentData) {
              const { data: parentData } = await supabase
                .from("parents")
                .select("user_id")
                .eq("id", assignmentData.parent_id)
                .single();

              const { data: profileData } = await supabase
                .from("profiles")
                .select("full_name")
                .eq("id", user.id)
                .single();

              const studentName = profileData?.full_name || "Your child";

              if (parentData?.user_id) {
                await supabase.from("notifications").insert({
                  user_id: parentData.user_id,
                  title: "Assignment Completed",
                  message: `${studentName} completed the assigned ${assignmentData.subject} practice task with a score of ${percentage}%.`,
                  type: "assignment_completed",
                  read: false,
                  metadata: {
                    assignment_id: assignmentId,
                    student_id: studentData.id,
                    score: percentage,
                  },
                });
              }
            }
          } catch (notifErr) {
            console.error("Error creating assignment completion notification:", notifErr);
          }
        }
        toast.success("Quiz results saved! 🎉");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleRetrySameQuestions = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setScore(0);
    setQuizComplete(false);
    setAnswers([]);
    setUserResponses([]);
    if (assignmentDuration) {
      setTimeLeft(assignmentDuration * 60);
    }
  };

  const handlePracticeNewQuestions = () => {
    clearSessionCache();
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setScore(0);
    setQuizComplete(false);
    setAnswers([]);
    setUserResponses([]);
    fetchQuestions(true);
  };

  const handleBackToDashboard = () => {
    clearSessionCache();
    navigate("/dashboard/student");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading questions...</p>
        </div>
      </div>
    );
  }

  // Quiz Complete View
  if (quizComplete) {
    const percentage = Math.round((score / questions.length) * 100);
    const isPassed = percentage >= 50;

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl p-6 sm:p-8 text-center animate-scale-in shadow-xl border-border/80">
          <div className="mb-6">
            <Trophy
              className={`w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 ${
                isPassed ? "text-primary" : "text-muted-foreground"
              }`}
            />
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1">
              Quiz Complete! 🎉
            </h1>
            <p className="text-sm text-muted-foreground">
              Here is how you performed on this practice set
            </p>
          </div>

          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 rounded-2xl p-6 mb-6 border border-primary/20 shadow-inner">
            <div className="text-5xl sm:text-6xl font-black text-primary mb-1">
              {score}/{questions.length}
            </div>
            <div className="text-xl sm:text-2xl font-bold mb-3">
              {percentage}% Correct
            </div>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <Badge
                variant={isPassed ? "default" : "secondary"}
                className="text-sm sm:text-base font-semibold px-4 py-1 rounded-full shadow-sm"
              >
                {isPassed ? "Passed! ✨" : "Keep Practicing"}
              </Badge>
              {assignmentDuration && (
                <Badge
                  variant="outline"
                  className="text-xs sm:text-sm font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 border-primary/30 bg-background/50"
                >
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span>{assignmentDuration} Min Limit</span>
                </Badge>
              )}
            </div>
          </div>

          {/* Interactive Question Grid with prompt */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2.5 px-1">
              <span className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-primary" />
                Snapshot Review
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" /> Click any box to inspect question
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2 sm:gap-2.5">
              {answers.map((correct, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    setSnapshotInitialIndex(index);
                    setSnapshotDialogOpen(true);
                  }}
                  className={`group relative aspect-square rounded-xl flex flex-col items-center justify-center gap-1 border-2 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    correct
                      ? "bg-emerald-50 hover:bg-emerald-100/90 border-emerald-300 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/60 dark:border-emerald-800"
                      : "bg-rose-50 hover:bg-rose-100/90 border-rose-300 dark:bg-rose-950/30 dark:hover:bg-rose-950/60 dark:border-rose-800"
                  }`}
                  aria-label={`View Question ${index + 1} snapshot (${correct ? "Correct" : "Incorrect"})`}
                  title={`Click to review Question ${index + 1}`}
                >
                  <span
                    className={`text-[11px] sm:text-xs font-black ${
                      correct
                        ? "text-emerald-700 dark:text-emerald-300"
                        : "text-rose-700 dark:text-rose-300"
                    }`}
                  >
                    Q{index + 1}
                  </span>
                  {correct ? (
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                  ) : (
                    <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform" />
                  )}
                  <span className="text-[10px] text-muted-foreground/80 font-medium group-hover:text-foreground">
                    Review
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleRetrySameQuestions}
              variant="default"
              className="w-full gap-2 font-bold text-base h-12 shadow-md"
              size="lg"
            >
              <RotateCcw className="w-5 h-5" />
              Try Again (Same Questions)
            </Button>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                onClick={handlePracticeNewQuestions}
                variant="outline"
                className="w-full gap-2 font-semibold h-11"
                size="lg"
              >
                <Sparkles className="w-4 h-4 text-primary" />
                Practice New Questions
              </Button>
              <Button
                onClick={handleBackToDashboard}
                variant="ghost"
                className="w-full font-semibold h-11"
                size="lg"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </div>
        </Card>

        {/* Snapshot Modal mounted on results screen */}
        <QuestionSnapshotDialog
          open={snapshotDialogOpen}
          onOpenChange={setSnapshotDialogOpen}
          questions={questions}
          userResponses={userResponses}
          answers={answers}
          initialIndex={snapshotInitialIndex}
          onFlagQuestion={(q) => handleOpenFlagDialog(q)}
          flaggedQuestionIds={flaggedQuestionIds}
          subjectName={quizSubject}
        />

        {/* Flag Question Dialog */}
        <Dialog open={flagDialogOpen} onOpenChange={setFlagDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Flag className="h-5 w-5 text-destructive" />
                Flag this Question
              </DialogTitle>
              <DialogDescription>
                Let us know what is wrong with this question. Our administrators will review it.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="flag-reason">Reason</Label>
                <Select value={flagReason} onValueChange={setFlagReason}>
                  <SelectTrigger id="flag-reason">
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="incorrect_answer">Incorrect Correct Option</SelectItem>
                    <SelectItem value="typo">Spelling or Formatting Issue</SelectItem>
                    <SelectItem value="missing_image">Image Failed to Load / Wrong Image</SelectItem>
                    <SelectItem value="incomplete">Question or Options Truncated</SelectItem>
                    <SelectItem value="other">Other Issue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="flag-details">Additional Details (Optional)</Label>
                <Textarea
                  id="flag-details"
                  placeholder="Explain the issue in detail..."
                  value={flagDetails}
                  onChange={(e) => setFlagDetails(e.target.value)}
                  maxLength={500}
                  className="min-h-[100px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setFlagDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleFlagQuestion}
                disabled={submittingFlag || !flagReason}
              >
                {submittingFlag && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Report
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Active Quiz View
  return (
    <div className="min-h-screen bg-background p-4 pt-20">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBackToDashboard}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>

          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{quizSubject || subject || "Mixed Topics"}</Badge>
              {questions.length > 0 && question && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenFlagDialog(question)}
                  disabled={flaggedQuestionIds.includes(question.id)}
                  className={`h-7 px-2.5 text-xs flex items-center gap-1.5 font-semibold transition-all border rounded-full ${
                    flaggedQuestionIds.includes(question.id)
                      ? "text-green-600 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/30"
                      : "text-red-600 bg-red-50 hover:bg-red-100 border-red-200 dark:text-red-400 dark:bg-red-950/20 dark:hover:bg-red-950/40 dark:border-red-900/30"
                  }`}
                >
                  <Flag
                    className={`h-3 w-3 ${
                      flaggedQuestionIds.includes(question.id) ? "" : "fill-current"
                    }`}
                  />
                  {flaggedQuestionIds.includes(question.id) ? "Flagged" : "Flag"}
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Active Assignment Countdown Timer */}
              {assignmentDuration && timeLeft !== null && (
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border transition-all ${
                    timeLeft < 120
                      ? "bg-rose-50 text-rose-600 border-rose-300 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800 animate-pulse"
                      : timeLeft < 300
                      ? "bg-amber-50 text-amber-600 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800"
                      : "bg-primary/10 text-primary border-primary/20"
                  }`}
                  title={`Parent assigned time limit: ${assignmentDuration} minutes`}
                >
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
                  </span>
                  <span className="text-[10px] opacity-70 font-semibold hidden sm:inline">remaining</span>
                </div>
              )}

              <span className="text-sm text-muted-foreground font-medium">
                Question {currentQuestion + 1} of {questions.length}
              </span>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="p-8 animate-fade-in">
          {/* Passage Display (if present) */}
          {question?.passage && (
            <div className="mb-6 p-4 bg-muted rounded-lg border">
              <h3 className="font-semibold mb-2 text-sm text-primary">Read the passage below:</h3>
              {question.passage.title && (
                <h4 className="font-medium mb-2">{question.passage.title}</h4>
              )}
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {question.passage.passage_text}
              </p>
            </div>
          )}

          <h2 className="text-2xl font-bold mb-6">{question?.question}</h2>

          {/* Question Image (Optional) */}
          {question?.image_url && (
            <div
              className="mb-6 max-w-lg mx-auto rounded-2xl border bg-muted/10 overflow-hidden shadow-sm cursor-zoom-in hover:shadow-md transition-shadow"
              onClick={() => setLightboxImage(question.image_url || null)}
            >
              <img
                src={question.image_url}
                alt="Question diagram"
                className="w-full max-h-[300px] object-contain mx-auto"
                loading="lazy"
              />
            </div>
          )}

          <div className="space-y-3 mb-6">
            {question?.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = index === question.correctAnswer;
              const showCorrect = showFeedback && isCorrect;
              const showIncorrect = showFeedback && isSelected && !isCorrect;

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={showFeedback}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                    showCorrect
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                      : showIncorrect
                      ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                      : isSelected
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  } ${showFeedback ? "cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <div className="flex flex-col gap-3">
                    {option.image_url && (
                      <div className="max-h-24 sm:max-h-32 w-auto overflow-hidden rounded-md border bg-muted/10 self-start">
                        <img
                          src={option.image_url}
                          alt={`Option ${index + 1}`}
                          className="max-h-24 sm:max-h-32 object-contain"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium">{option.text}</span>
                      {showCorrect && (
                        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                      )}
                      {showIncorrect && (
                        <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {showFeedback && question && (
            <div
              className={`p-4 rounded-lg mb-6 animate-fade-in ${
                selectedAnswer === question.correctAnswer
                  ? "bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800"
              }`}
            >
              <div className="flex items-start gap-3">
                {selectedAnswer === question.correctAnswer ? (
                  <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <p className="font-semibold mb-1">
                    {selectedAnswer === question.correctAnswer
                      ? "Correct! 🎉"
                      : "Incorrect"}
                  </p>
                  <p className="text-sm text-foreground/80">{question.explanation}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            {!showFeedback ? (
              <Button
                onClick={handleSubmitAnswer}
                disabled={selectedAnswer === null}
                className="w-full"
                size="lg"
              >
                Submit Answer
              </Button>
            ) : (
              <Button onClick={handleNext} className="w-full" size="lg">
                {currentQuestion < questions.length - 1 ? (
                  <>
                    Next Question <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  "View Results"
                )}
              </Button>
            )}
          </div>

          <div className="mt-6 pt-6 border-t flex justify-between text-sm text-muted-foreground">
            <span>
              Current Score: {score}/{currentQuestion + (showFeedback ? 1 : 0)}
            </span>
            <span>
              {Math.round(
                (score / Math.max(currentQuestion + (showFeedback ? 1 : 0), 1)) * 100
              )}
              % Accuracy
            </span>
          </div>
        </Card>
      </div>

      {/* Flag Question Dialog */}
      <Dialog open={flagDialogOpen} onOpenChange={setFlagDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-destructive" />
              Flag this Question
            </DialogTitle>
            <DialogDescription>
              Let us know what is wrong with this question. Our administrators will review it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="flag-reason">Reason</Label>
              <Select value={flagReason} onValueChange={setFlagReason}>
                <SelectTrigger id="flag-reason">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="incorrect_answer">Incorrect Correct Option</SelectItem>
                  <SelectItem value="typo">Spelling or Formatting Issue</SelectItem>
                  <SelectItem value="missing_image">Image Failed to Load / Wrong Image</SelectItem>
                  <SelectItem value="incomplete">Question or Options Truncated</SelectItem>
                  <SelectItem value="other">Other Issue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="flag-details">Additional Details (Optional)</Label>
              <Textarea
                id="flag-details"
                placeholder="Explain the issue in detail..."
                value={flagDetails}
                onChange={(e) => setFlagDetails(e.target.value)}
                maxLength={500}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFlagDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleFlagQuestion}
              disabled={submittingFlag || !flagReason}
            >
              {submittingFlag && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lightbox Overlay */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setLightboxImage(null)}
        >
          <img
            src={lightboxImage}
            alt="Enlarged diagram"
            className="max-w-full max-h-[90vh] rounded-xl object-contain shadow-2xl border"
          />
        </div>
      )}
    </div>
  );
}

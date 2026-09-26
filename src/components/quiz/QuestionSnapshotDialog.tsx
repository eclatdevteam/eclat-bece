import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle2,
  XCircle,
  Flag,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Check,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export interface QuizOption {
  text: string;
  image_url?: string | null;
}

export interface Question {
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

interface QuestionSnapshotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questions: Question[];
  userResponses: (number | null)[];
  answers: boolean[];
  initialIndex?: number;
  onFlagQuestion?: (question: Question) => void;
  flaggedQuestionIds?: string[];
  subjectName?: string;
}

export function QuestionSnapshotDialog({
  open,
  onOpenChange,
  questions,
  userResponses,
  answers,
  initialIndex = 0,
  onFlagQuestion,
  flaggedQuestionIds = [],
  subjectName,
}: QuestionSnapshotDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [passageExpanded, setPassageExpanded] = useState(true);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
      setPassageExpanded(true);
    }
  }, [open, initialIndex]);

  if (!questions || questions.length === 0) return null;

  const currentQ = questions[currentIndex] || questions[0];
  const userChoice = userResponses[currentIndex] ?? null;
  const isCorrect = answers[currentIndex] ?? false;
  const isFlagged = flaggedQuestionIds.includes(currentQ.id);

  const optionLetters = ["A", "B", "C", "D", "E", "F"];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-border/80 shadow-2xl rounded-2xl">
          {/* Header */}
          <DialogHeader className="p-5 pb-3 border-b border-border/60 bg-muted/20">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-black text-xs px-2.5 py-0.5 uppercase tracking-wider">
                  {subjectName || currentQ.subject || "Practice"}
                </Badge>
                <DialogTitle className="text-lg font-black tracking-tight">
                  Question {currentIndex + 1} of {questions.length}
                </DialogTitle>
              </div>

              <div className="flex items-center gap-2">
                {isCorrect ? (
                  <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold px-2.5 py-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                  </Badge>
                ) : (
                  <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 font-bold px-2.5 py-1 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> Incorrect
                  </Badge>
                )}

                {onFlagQuestion && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onFlagQuestion(currentQ)}
                    disabled={isFlagged}
                    className={`h-7 px-2 text-xs flex items-center gap-1 font-semibold rounded-lg border transition-all ${
                      isFlagged
                        ? "text-green-600 bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-800"
                        : "text-rose-600 hover:bg-rose-50 border-rose-200 dark:text-rose-400 dark:border-rose-900/40"
                    }`}
                  >
                    <Flag className={`h-3 w-3 ${isFlagged ? "" : "fill-current"}`} />
                    <span>{isFlagged ? "Flagged" : "Flag"}</span>
                  </Button>
                )}
              </div>
            </div>

            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Snapshot review of question prompt, your selection, the correct answer, and full solution.
            </DialogDescription>

            {/* Quick Question Jump Pill Row */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-3 pb-1 no-scrollbar">
              {questions.map((_, idx) => {
                const ans = answers[idx];
                const active = idx === currentIndex;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-8 w-8 rounded-lg text-xs font-black transition-all flex items-center justify-center shrink-0 border cursor-pointer ${
                      active
                        ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110 " +
                          (ans ? "bg-emerald-600 text-white border-emerald-600" : "bg-rose-600 text-white border-rose-600")
                        : ans
                        ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25"
                        : "bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25"
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </DialogHeader>

          {/* Body Content */}
          <ScrollArea className="flex-1 p-5 max-h-[60vh]">
            <div className="space-y-5">
              {/* Comprehension Passage */}
              {currentQ.passage && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm transition-all">
                  <button
                    type="button"
                    onClick={() => setPassageExpanded((prev) => !prev)}
                    className="flex w-full items-center justify-between font-bold text-primary hover:underline cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      <span>Reading Passage{currentQ.passage.title ? `: ${currentQ.passage.title}` : ""}</span>
                    </div>
                    {passageExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>

                  {passageExpanded && (
                    <div className="mt-3 max-h-48 overflow-y-auto whitespace-pre-wrap text-muted-foreground leading-relaxed rounded-lg bg-background/50 p-3 border border-border/40 text-xs sm:text-sm">
                      {currentQ.passage.passage_text}
                    </div>
                  )}
                </div>
              )}

              {/* Question Text */}
              <div className="space-y-3">
                <h3 className="text-base sm:text-lg font-bold text-foreground leading-relaxed whitespace-pre-wrap">
                  {currentQ.question}
                </h3>

                {currentQ.image_url && (
                  <div
                    onClick={() => setLightboxImage(currentQ.image_url || null)}
                    className="group relative inline-block cursor-zoom-in overflow-hidden rounded-xl border border-border/60 bg-muted/20"
                  >
                    <img
                      src={currentQ.image_url}
                      alt="Question diagram"
                      className="max-h-60 w-auto rounded-xl object-contain transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold">
                      Click to enlarge
                    </div>
                  </div>
                )}
              </div>

              {/* Options Breakdown */}
              <div className="space-y-2.5">
                <div className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Answer Options
                </div>

                <div className="grid gap-2">
                  {currentQ.options.map((option, optIdx) => {
                    const isOptionCorrect = optIdx === currentQ.correctAnswer;
                    const isStudentPick = optIdx === userChoice;

                    let cardStyle = "border-border/60 bg-card/60 text-muted-foreground";
                    let badgeNode = null;

                    if (isOptionCorrect && isStudentPick) {
                      cardStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100 font-semibold shadow-sm";
                      badgeNode = (
                        <Badge className="bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5 flex items-center gap-1 shrink-0">
                          <Check className="w-3 h-3" /> Your Choice (Correct!)
                        </Badge>
                      );
                    } else if (isOptionCorrect) {
                      cardStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100 font-semibold shadow-sm";
                      badgeNode = (
                        <Badge className="bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5 flex items-center gap-1 shrink-0">
                          <Check className="w-3 h-3" /> Correct Answer
                        </Badge>
                      );
                    } else if (isStudentPick) {
                      cardStyle = "border-rose-500 bg-rose-500/10 text-rose-950 dark:text-rose-100 font-semibold shadow-sm";
                      badgeNode = (
                        <Badge className="bg-rose-600 text-white font-bold text-[10px] px-2 py-0.5 flex items-center gap-1 shrink-0">
                          <X className="w-3 h-3" /> Your Choice
                        </Badge>
                      );
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-xl border-2 transition-colors ${cardStyle}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black shrink-0 ${
                              isOptionCorrect
                                ? "bg-emerald-600 text-white"
                                : isStudentPick
                                ? "bg-rose-600 text-white"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {optionLetters[optIdx] || optIdx + 1}
                          </span>
                          <span className="text-sm font-medium leading-snug break-words">
                            {option.text}
                          </span>
                        </div>

                        {badgeNode}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Solution / Explanation */}
              <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 space-y-2">
                <div className="flex items-center gap-2 font-bold text-primary text-sm">
                  <Sparkles className="h-4 w-4" />
                  <span>Detailed Explanation & Solution</span>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                  {currentQ.explanation || "No explanation provided for this question."}
                </p>
              </div>
            </div>
          </ScrollArea>

          {/* Footer Controls */}
          <DialogFooter className="p-4 border-t border-border/60 bg-muted/10 sm:justify-between flex-row items-center gap-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="rounded-xl font-bold text-xs"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                disabled={currentIndex === questions.length - 1}
                className="rounded-xl font-bold text-xs"
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            <Button
              variant="default"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="rounded-xl font-bold text-xs ml-auto"
            >
              Close Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lightbox for Diagram Zoom */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-background/85 backdrop-blur-md z-[60] flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setLightboxImage(null)}
        >
          <img
            src={lightboxImage}
            alt="Enlarged diagram"
            className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl border"
          />
        </div>
      )}
    </>
  );
}

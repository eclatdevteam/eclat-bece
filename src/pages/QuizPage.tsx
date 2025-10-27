import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Trophy, ArrowLeft, ArrowRight } from "lucide-react";

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  subject: string;
}

const sampleQuestions: Question[] = [
  {
    id: 1,
    question: "If 3x - 7 = 14, what is the value of x?",
    options: ["5", "6", "7", "8"],
    correctAnswer: 2,
    explanation: "Add 7 to both sides: 3x = 21. Then divide both sides by 3: x = 7.",
    subject: "Mathematics",
  },
  {
    id: 2,
    question: "Choose the correct form: 'The students _____ their homework every day.'",
    options: ["do", "does", "did", "doing"],
    correctAnswer: 0,
    explanation: "'Do' is the correct present tense verb for plural subject 'students'.",
    subject: "English Language",
  },
  {
    id: 3,
    question: "What is the main function of the human heart?",
    options: ["To digest food", "To pump blood", "To filter air", "To produce hormones"],
    correctAnswer: 1,
    explanation: "The heart is a muscular organ that pumps blood throughout the body.",
    subject: "Basic Science",
  },
  {
    id: 4,
    question: "Nigeria gained independence from Britain in which year?",
    options: ["1950", "1955", "1960", "1965"],
    correctAnswer: 2,
    explanation: "Nigeria gained independence on October 1, 1960.",
    subject: "Social Studies",
  },
  {
    id: 5,
    question: "What is 25% of 80?",
    options: ["15", "20", "25", "30"],
    correctAnswer: 1,
    explanation: "25% of 80 = 0.25 × 80 = 20.",
    subject: "Mathematics",
  },
];

export default function QuizPage() {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [answers, setAnswers] = useState<boolean[]>([]);

  const question = sampleQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / sampleQuestions.length) * 100;

  const handleAnswerSelect = (index: number) => {
    if (!showFeedback) {
      setSelectedAnswer(index);
    }
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;
    
    const isCorrect = selectedAnswer === question.correctAnswer;
    if (isCorrect) {
      setScore(score + 1);
    }
    setAnswers([...answers, isCorrect]);
    setShowFeedback(true);
  };

  const handleNext = () => {
    if (currentQuestion < sampleQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      setQuizComplete(true);
    }
  };

  const handleRetry = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setScore(0);
    setQuizComplete(false);
    setAnswers([]);
  };

  if (quizComplete) {
    const percentage = Math.round((score / sampleQuestions.length) * 100);
    const isPassed = percentage >= 50;

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl p-8 text-center animate-scale-in">
          <div className="mb-6">
            <Trophy className={`w-20 h-20 mx-auto mb-4 ${isPassed ? 'text-primary' : 'text-muted-foreground'}`} />
            <h1 className="text-3xl font-bold mb-2">Quiz Complete! 🎉</h1>
            <p className="text-muted-foreground">Here's how you performed</p>
          </div>

          <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg p-8 mb-6">
            <div className="text-6xl font-bold text-primary mb-2">
              {score}/{sampleQuestions.length}
            </div>
            <div className="text-2xl font-semibold mb-4">{percentage}% Correct</div>
            <Badge variant={isPassed ? "default" : "secondary"} className="text-lg px-4 py-1">
              {isPassed ? "Passed! ✨" : "Keep Practicing"}
            </Badge>
          </div>

          <div className="grid grid-cols-5 gap-2 mb-6">
            {answers.map((correct, index) => (
              <div
                key={index}
                className={`aspect-square rounded-lg flex items-center justify-center ${
                  correct ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
                }`}
              >
                {correct ? (
                  <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                )}
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <Button onClick={handleRetry} variant="default" className="w-full" size="lg">
              Try Again
            </Button>
            <Button onClick={() => navigate("/dashboard/student")} variant="outline" className="w-full" size="lg">
              Back to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pt-20">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard/student")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
          
          <div className="flex justify-between items-center mb-2">
            <Badge variant="secondary">{question.subject}</Badge>
            <span className="text-sm text-muted-foreground">
              Question {currentQuestion + 1} of {sampleQuestions.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="p-8 animate-fade-in">
          <h2 className="text-2xl font-bold mb-6">{question.question}</h2>

          <div className="space-y-3 mb-6">
            {question.options.map((option, index) => {
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
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : showIncorrect
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  } ${showFeedback ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{option}</span>
                    {showCorrect && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                    {showIncorrect && <XCircle className="w-5 h-5 text-red-600" />}
                  </div>
                </button>
              );
            })}
          </div>

          {showFeedback && (
            <div className={`p-4 rounded-lg mb-6 animate-fade-in ${
              selectedAnswer === question.correctAnswer
                ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-start gap-3">
                {selectedAnswer === question.correctAnswer ? (
                  <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <p className="font-semibold mb-1">
                    {selectedAnswer === question.correctAnswer ? "Correct! 🎉" : "Incorrect"}
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
                {currentQuestion < sampleQuestions.length - 1 ? (
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
            <span>Current Score: {score}/{currentQuestion + (showFeedback ? 1 : 0)}</span>
            <span>{Math.round((score / Math.max(currentQuestion + (showFeedback ? 1 : 0), 1)) * 100)}% Accuracy</span>
          </div>
        </Card>
      </div>
    </div>
  );
}

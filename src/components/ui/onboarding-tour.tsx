import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, ChevronRight, ChevronLeft, Sparkles, Target, Trophy, Users, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  target?: string; // CSS selector for the element to highlight
  action?: React.ReactNode;
}

interface OnboardingTourProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
  currentStep?: number;
  onStepChange?: (step: number) => void;
}

export function OnboardingTour({
  steps,
  isOpen,
  onClose,
  onComplete,
  currentStep: controlledStep,
  onStepChange,
}: OnboardingTourProps) {
  const [internalStep, setInternalStep] = useState(0);
  const currentStep = controlledStep !== undefined ? controlledStep : internalStep;
  const setCurrentStep = onStepChange || setInternalStep;

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  useEffect(() => {
    if (isOpen && currentStepData?.target) {
      const targetElement = document.querySelector(currentStepData.target);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetElement.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
        setTimeout(() => {
          targetElement.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
        }, 2000);
      }
    }
  }, [isOpen, currentStep, currentStepData?.target]);

  const handleNext = () => {
    if (isLastStep) {
      onComplete?.();
      onClose();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4">
      <Card className="w-full max-w-lg animate-scale-in shadow-2xl">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                {currentStepData.icon || <Sparkles className="h-5 w-5 text-primary" />}
              </div>
              <div>
                <h3 className="text-lg font-semibold">{currentStepData.title}</h3>
                <p className="text-sm text-muted-foreground">
                  Step {currentStep + 1} of {steps.length}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSkip}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-muted rounded-full h-2 mb-6">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          {/* Content */}
          <div className="mb-6">
            <p className="text-base leading-relaxed">{currentStepData.description}</p>
            {currentStepData.action && (
              <div className="mt-4">{currentStepData.action}</div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={isFirstStep}
              className="min-h-[44px] min-w-[44px]"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            <div className="flex gap-2">
              {steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={cn(
                    "h-2 w-2 rounded-full transition-all",
                    index === currentStep
                      ? "bg-primary w-8"
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  )}
                  aria-label={`Go to step ${index + 1}`}
                />
              ))}
            </div>

            <Button
              onClick={handleNext}
              className="min-h-[44px] min-w-[44px] font-semibold"
              variant={isLastStep ? "hero" : "default"}
            >
              {isLastStep ? (
                <>
                  Get Started
                  <Sparkles className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Pre-configured tour steps for different user types
export const studentTourSteps: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to Éclat! 🎉",
    description: "Turn exam prep into a game. Practice questions, climb the leaderboard, and earn rewards.",
    icon: <Sparkles className="h-5 w-5 text-primary" />,
  },
  {
    id: "practice",
    title: "Practice Mode",
    description: "Access thousands of practice questions across all subjects. Track your progress and identify areas for improvement.",
    icon: <BookOpen className="h-5 w-5 text-primary" />,
    target: "#practice-section",
  },
  {
    id: "leaderboard",
    title: "Leaderboard",
    description: "Compete with other students and see how you rank. Climb the ranks by earning points through practice and competitions.",
    icon: <Trophy className="h-5 w-5 text-primary" />,
    target: "#leaderboard-section",
  },
  {
    id: "achievements",
    title: "Achievements",
    description: "Earn badges and rewards as you progress. Unlock special achievements by completing challenges and reaching milestones.",
    icon: <Target className="h-5 w-5 text-primary" />,
    target: "#achievements-section",
  },
];

export const parentTourSteps: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome, Parents! 👋",
    description: "Monitor your child's progress, manage their accounts, and support their learning journey.",
    icon: <Users className="h-5 w-5 text-primary" />,
  },
  {
    id: "dashboard",
    title: "Parent Dashboard",
    description: "Get a comprehensive overview of your child's academic performance, including practice history and progress reports.",
    icon: <BookOpen className="h-5 w-5 text-primary" />,
    target: "#dashboard-overview",
  },
  {
    id: "children",
    title: "Manage Children",
    description: "Add and manage multiple student accounts from one parent dashboard. Track each child individually.",
    icon: <Users className="h-5 w-5 text-primary" />,
    target: "#children-section",
  },
  {
    id: "reports",
    title: "Progress Reports",
    description: "Access detailed progress reports and analytics to understand your child's strengths and areas needing improvement.",
    icon: <Target className="h-5 w-5 text-primary" />,
    target: "#reports-section",
  },
];

export const schoolTourSteps: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome, Schools! 🏫",
    description: "Manage your institution, track student performance, and create engaging learning experiences.",
    icon: <Sparkles className="h-5 w-5 text-primary" />,
  },
  {
    id: "dashboard",
    title: "School Dashboard",
    description: "Get an overview of your school's performance, student engagement, and overall statistics.",
    icon: <BookOpen className="h-5 w-5 text-primary" />,
    target: "#school-dashboard",
  },
  {
    id: "students",
    title: "Student Management",
    description: "Add students to your school, assign practice materials, and monitor their progress in real-time.",
    icon: <Users className="h-5 w-5 text-primary" />,
    target: "#students-section",
  },
  {
    id: "analytics",
    title: "School Analytics",
    description: "Access comprehensive analytics to understand performance trends and make data-driven decisions.",
    icon: <Target className="h-5 w-5 text-primary" />,
    target: "#analytics-section",
  },
];

// Hook to manage tour state
export function useOnboardingTour(tourKey: string) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompletedTour, setHasCompletedTour] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(`${tourKey}_completed`);
    setHasCompletedTour(!!completed);
    
    // Auto-open tour for first-time users
    if (!completed) {
      const timer = setTimeout(() => setIsOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [tourKey]);

  const handleComplete = () => {
    localStorage.setItem(`${tourKey}_completed`, 'true');
    setHasCompletedTour(true);
    setIsOpen(false);
  };

  const restartTour = () => {
    localStorage.removeItem(`${tourKey}_completed`);
    setHasCompletedTour(false);
    setCurrentStep(0);
    setIsOpen(true);
  };

  return {
    isOpen,
    setIsOpen,
    currentStep,
    setCurrentStep,
    hasCompletedTour,
    handleComplete,
    restartTour,
  };
}

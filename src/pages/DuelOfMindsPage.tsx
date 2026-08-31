import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChallengeSettings } from "@/components/ChallengeSettings";
import { SendChallenge } from "@/components/SendChallenge";
import { ChallengeConfirmation } from "@/components/ChallengeConfirmation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Step = 'settings' | 'send' | 'confirmation' | 'sent';

interface ChallengeConfig {
  challengeName: string;
  subject: string;
  numberOfQuestions: number;
  topics: string[];
  maxTime: number;
  maxTimeUnit: 'min' | 'sec';
}

interface Student {
  id: string;
  name: string;
  username: string;
  school: string;
  grade: string;
}

export default function DuelOfMindsPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('settings');
  const [config, setConfig] = useState<ChallengeConfig | null>(null);
  const [opponent, setOpponent] = useState<Student | null>(null);
  const [isSending, setIsSending] = useState(false);

  const handleSettingsNext = (challengeConfig: ChallengeConfig) => {
    setConfig(challengeConfig);
    setStep('send');
  };

  const handleSendNext = (selectedOpponent: Student) => {
    setOpponent(selectedOpponent);
    setStep('confirmation');
  };

  const handleConfirm = async () => {
    if (!config || !opponent) return;

    setIsSending(true);
    try {
      // Simulation of challenge sending until multiplayer backend is ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStep('sent');
      toast.success("Challenge sent successfully!");
    } catch (error) {
      console.error('Error sending challenge:', error);
      toast.error('Failed to send challenge. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleBack = () => {
    if (step === 'send') {
      setStep('settings');
    } else if (step === 'confirmation') {
      setStep('send');
    } else {
      navigate('/dashboard/student');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {step === 'settings' && (
        <ChallengeSettings onNext={handleSettingsNext} />
      )}
      
      {step === 'send' && config && (
        <SendChallenge
          onBack={handleBack}
          onNext={handleSendNext}
          config={config}
        />
      )}
      
      {step === 'confirmation' && config && opponent && (
        <ChallengeConfirmation
          onBack={handleBack}
          onConfirm={handleConfirm}
          opponent={opponent}
          config={config}
        />
      )}
      
      {step === 'sent' && (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold">Challenge Sent!</h2>
            <p className="text-muted-foreground">
              Your challenge has been sent to {opponent?.name}. They will be notified and can accept the challenge to begin the duel.
            </p>
            <div className="space-y-3">
              <Button onClick={() => navigate('/dashboard/student')} className="w-full">
                Return to Dashboard
              </Button>
              <Button variant="outline" onClick={() => navigate('/dashboard/student/leaderboard')} className="w-full">
                View Leaderboard
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

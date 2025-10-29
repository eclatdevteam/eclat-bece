import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getSafeErrorMessage } from "@/lib/errorUtils";

export default function EmailVerificationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const email = searchParams.get("email");
  const role = searchParams.get("role") || "student";
  const userId = searchParams.get("user_id");
  
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!email || !userId) {
      navigate("/auth");
    }
  }, [email, userId, navigate]);

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);

    try {
      if (!userId) {
        toast({
          title: "Error",
          description: "User ID not found. Please sign up again.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      // Verify the code via edge function
      const { error: verifyError } = await supabase.functions.invoke(
        "verify-email-code",
        {
          body: { user_id: userId, code: code.trim() },
        }
      );

      if (verifyError) {
        toast({
          title: "Invalid Code",
          description: "The verification code is incorrect or has expired.",
          variant: "destructive",
        });
        setIsVerifying(false);
        return;
      }

      toast({
        title: "Email Verified!",
        description: "Your email has been successfully verified.",
      });

      // Redirect based on role
      if (role === "student") {
        navigate("/onboarding");
      } else if (role === "parent") {
        navigate("/dashboard/parent");
      } else {
        navigate("/dashboard/school");
      }
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: getSafeErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    try {
      if (!userId || !email) {
        toast({
          title: "Error",
          description: "User ID not found. Please sign up again.",
          variant: "destructive",
        });
        return;
      }

      // Send email via edge function (it will generate and store the code)
      const { error: emailError } = await supabase.functions.invoke(
        "send-verification-email",
        {
          body: { user_id: userId },
        }
      );

      if (emailError) throw emailError;

      toast({
        title: "Code Resent",
        description: "A new verification code has been sent to your email.",
      });
    } catch (error: any) {
      toast({
        title: "Resend Failed",
        description: getSafeErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light/20 via-background to-accent-light/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 mb-2">
            <BookOpen className="text-primary" size={32} />
            <h1 className="text-3xl font-bold text-foreground">Éclat</h1>
          </div>
          <p className="text-muted-foreground">Verify your email to continue</p>
        </div>

        <Card className="border-2 animate-scale-in">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Email Verification</CardTitle>
            <CardDescription className="text-center">
              We've sent a verification code to <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  required
                  className="text-center text-lg tracking-widest"
                />
              </div>
              
              <Button
                type="submit"
                variant="hero"
                className="w-full"
                disabled={isVerifying || code.length !== 6}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Email"
                )}
              </Button>

              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Didn't receive the code?
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleResendCode}
                  disabled={isResending}
                  className="text-sm"
                >
                  {isResending ? "Sending..." : "Resend Code"}
                </Button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <Button
                variant="ghost"
                onClick={() => navigate("/auth")}
                className="text-sm"
              >
                ← Back to Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

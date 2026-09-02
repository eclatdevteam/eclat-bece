import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Eye,
  EyeOff,
  Mail,
  Lock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  UserCheck,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { getSafeErrorMessage } from "@/lib/errorUtils";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { useAuth } from "@/hooks/useAuth";

const resetEmailSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(255),
});

const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function PasswordResetPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { signOut } = useAuth();

  const role = (searchParams.get("role") || "parent") as "parent" | "school" | "student" | "admin" | "general";
  const loginPath = role === "parent"
    ? "/parent-login"
    : role === "school"
    ? "/school-login"
    : role === "student"
    ? "/student-login"
    : role === "admin"
    ? "/admin/login"
    : "/auth/login/role-selection";

  const dashboardPath = role === "parent"
    ? "/dashboard/parent"
    : role === "school"
    ? "/dashboard/school"
    : role === "student"
    ? "/dashboard/student"
    : role === "admin"
    ? "/admin"
    : "/";

  const tokenHash = searchParams.get("token_hash");
  const hasTokenInUrl = Boolean(tokenHash);

  const hasVerifiedRef = useRef(false);
  const [isVerifyingToken, setIsVerifyingToken] = useState(hasTokenInUrl);
  const [tokenInvalid, setTokenInvalid] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [activeUser, setActiveUser] = useState<{ email?: string; role?: string } | null>(null);
  const [showOverrideForm, setShowOverrideForm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Handle direct recovery token verification (token_hash)
  useEffect(() => {
    if (tokenHash) {
      // Guard against React 18 StrictMode double-invoking verifyOtp and burning single-use OTP
      if (hasVerifiedRef.current) return;
      hasVerifiedRef.current = true;

      setIsVerifyingToken(true);
      setTokenInvalid(false);

      // Best Practice: Purge any lingering stale session storage to prevent cross-account contamination
      sessionStorage.clear();
      Object.keys(localStorage).forEach((key) => {
        if (key !== "theme" && (key.startsWith("sb-") || key.includes("supabase") || key === "pendingRole")) {
          localStorage.removeItem(key);
        }
      });

      supabase.auth
        .verifyOtp({
          token_hash: tokenHash,
          type: "recovery",
        })
        .then(({ data, error }) => {
          setIsVerifyingToken(false);
          if (error || !data?.session) {
            console.error("Token verification error:", error);
            setTokenInvalid(true);
            setIsUpdateMode(false);
            toast({
              title: "Link Expired or Invalid",
              description: "This password recovery link is invalid or has expired. Please request a new one.",
              variant: "destructive",
            });
          } else {
            setTokenInvalid(false);
            setIsUpdateMode(true);
            toast({
              title: "Token Verified",
              description: "Please configure your new password below.",
            });
          }
        })
        .catch((err) => {
          setIsVerifyingToken(false);
          setTokenInvalid(true);
          setIsUpdateMode(false);
        });
    } else {
      // Check if user is already signed in (direct visit, not recovery)
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          // Show the "already signed in" prompt.
          // If this is actually a recovery flow, the PASSWORD_RECOVERY event
          // in the next useEffect will override this and switch to update mode.
          setActiveUser({
            email: session.user.email,
          });
        }
      });
    }
  }, [tokenHash, toast]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY" && session) {
          setIsUpdateMode(true);
          setTokenInvalid(false);
          setActiveUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const email = formData.get("email") as string;

      const validated = resetEmailSchema.parse({ email });

      // Dispatch via Origin-Aware send-password-reset Edge Function with Resend
      const { data, error } = await supabase.functions.invoke("send-password-reset", {
        body: {
          email: validated.email,
          siteUrl: window.location.origin,
          role: role,
        },
      });

      if (error) {
        throw new Error(error.message || "Failed to send reset email");
      }

      const result = data as any;
      if (result && result.success === false) {
        throw new Error(result.error || "Failed to send reset email");
      }

      setEmailSent(true);
      toast({
        title: "Email Sent!",
        description: "Check your email for password reset instructions.",
      });
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: getSafeErrorMessage(error),
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const password = formData.get("password") as string;
      const confirmPassword = formData.get("confirmPassword") as string;

      const validated = resetPasswordSchema.parse({ password, confirmPassword });

      const { error } = await supabase.auth.updateUser({
        password: validated.password,
      });

      if (error) {
        toast({
          title: "Error",
          description: getSafeErrorMessage(error),
          variant: "destructive",
        });
        return;
      }

      // OWASP ASVS 2.8: Sign out of recovery session so the user must authenticate cleanly
      await supabase.auth.signOut();

      toast({
        title: "Password Updated!",
        description: "Your password has been successfully reset. Please sign in.",
      });

      navigate(loginPath);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetForm = () => {
    setTokenInvalid(false);
    setIsUpdateMode(false);
    setEmailSent(false);
    setActiveUser(null);
    setShowOverrideForm(true);
    hasVerifiedRef.current = false;
    navigate(role === "general" ? "/password-reset" : `/password-reset?role=${role}`, { replace: true });
  };

  const handleSignOutToRecover = async () => {
    await signOut(role === "general" ? "/password-reset" : `/password-reset?role=${role}`);
    setActiveUser(null);
    setShowOverrideForm(true);
  };

  return (
    <AuthLayout
      role={role}
      badgeText="Account Recovery"
      title={
        tokenInvalid
          ? "Link Expired or Invalid"
          : isUpdateMode
          ? "Create New Password"
          : activeUser && !showOverrideForm
          ? "Already Signed In"
          : "Reset Password"
      }
      subtitle={
        tokenInvalid
          ? "This recovery link is no longer valid. Please request a fresh reset link."
          : isUpdateMode
          ? "Enter and confirm your new secure password"
          : activeUser && !showOverrideForm
          ? `You are currently logged in as ${activeUser.email}.`
          : emailSent
          ? "Check your inbox for recovery instructions"
          : "Enter your registered email to receive a password reset link"
      }
      footerLink={{
        text: "Remembered your credentials?",
        actionText: "Back to Login",
        to: loginPath,
      }}
    >
      {isVerifyingToken ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-3 text-center animate-fade-in">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-semibold text-foreground">
            Verifying recovery link...
          </p>
          <p className="text-xs text-muted-foreground">
            Please wait while we validate your credentials.
          </p>
        </div>
      ) : tokenInvalid ? (
        <div className="text-center space-y-4 py-3 animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center mx-auto">
            <XCircle size={32} />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-foreground">
              Recovery Link Expired or Invalid
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed px-2">
              For your security, password reset links can only be used once and expire after 1 hour. Please request a fresh recovery link below.
            </p>
          </div>
          <div className="pt-3 space-y-2">
            <Button
              variant="hero"
              onClick={handleResetForm}
              className="w-full h-11 text-xs font-bold rounded-xl gap-1.5 shadow-md"
            >
              <RotateCcw size={14} /> Request New Reset Link
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(loginPath)}
              className="w-full h-10 text-xs font-bold rounded-xl border-2"
            >
              Return to Login
            </Button>
          </div>
        </div>
      ) : isUpdateMode ? (
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-bold text-foreground">
              New Password
            </Label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                <Lock size={19} />
              </div>
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                required
                minLength={6}
                maxLength={100}
                className="pl-11 pr-11 h-12 bg-background border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/15 rounded-xl text-base font-medium text-foreground placeholder:text-muted-foreground/60 shadow-xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-bold text-foreground">
              Confirm New Password
            </Label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                <Lock size={19} />
              </div>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                required
                minLength={6}
                maxLength={100}
                className="pl-11 pr-11 h-12 bg-background border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/15 rounded-xl text-base font-medium text-foreground placeholder:text-muted-foreground/60 shadow-xs"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="hero"
            className="w-full h-12 text-base font-extrabold shadow-md rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-95 text-white transition-all mt-3"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating Password...
              </>
            ) : (
              <>
                Save New Password <ArrowRight className="ml-1.5 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      ) : activeUser && !showOverrideForm ? (
        /* Smart Prompt for Already Signed-In User */
        <div className="text-center space-y-4 py-3 animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto">
            <UserCheck size={32} />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-foreground">
              You are currently logged in
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed px-2">
              You are signed in as <strong>{activeUser.email}</strong>. To manage your account or password, visit your dashboard. If you need to recover a different account, please sign out first.
            </p>
          </div>

          <div className="pt-2 space-y-2">
            <Button
              variant="hero"
              onClick={() => navigate(dashboardPath)}
              className="w-full h-11 text-xs font-bold rounded-xl gap-1.5 shadow-md"
            >
              <LayoutDashboard size={14} /> Go to Dashboard
            </Button>
            <Button
              variant="outline"
              onClick={handleSignOutToRecover}
              className="w-full h-10 text-xs font-bold rounded-xl border-2 gap-1.5 text-muted-foreground hover:text-destructive hover:border-destructive/30"
            >
              <LogOut size={14} /> Sign Out to Recover Another Account
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowOverrideForm(true)}
              className="w-full h-9 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
            >
              Request Reset Link Anyway →
            </Button>
          </div>
        </div>
      ) : emailSent ? (
        <div className="text-center space-y-4 py-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
            <CheckCircle2 size={30} />
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed px-2">
            We have dispatched a secure password reset link to your email address. Please click the link to configure a new password.
          </p>
          <Button
            variant="outline"
            onClick={() => navigate(loginPath)}
            className="w-full h-11 text-sm font-bold rounded-xl border-2"
          >
            Return to Login
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSendResetEmail} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-bold text-foreground">
              Registered Email Address
            </Label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                <Mail size={19} />
              </div>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                maxLength={255}
                className="pl-11 h-12 bg-background border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/15 rounded-xl text-base font-medium text-foreground placeholder:text-muted-foreground/60 shadow-xs"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="hero"
            className="w-full h-12 text-base font-extrabold shadow-md rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-95 text-white transition-all mt-3"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending Link...
              </>
            ) : (
              <>
                Send Reset Link <ArrowRight className="ml-1.5 h-4 w-4" />
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate(loginPath)}
            className="w-full h-10 text-xs font-bold rounded-xl text-muted-foreground hover:text-foreground"
          >
            Cancel & Go Back
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}

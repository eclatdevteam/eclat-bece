import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, User, Mail, Lock, School, ArrowRight, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { getSafeErrorMessage } from "@/lib/errorUtils";
import { Separator } from "@/components/ui/separator";
import { useRedirectIfAuthenticated } from "@/hooks/useRedirectIfAuthenticated";
import { AuthLayout, AuthRole } from "@/components/auth/AuthLayout";

const signupSchema = z.object({
  fullName: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function AuthPage() {
  const navigate = useNavigate();
  useRedirectIfAuthenticated();
  const [searchParams] = useSearchParams();
  const role = (searchParams.get("role") || "student") as AuthRole;
  const [isLoading, setIsLoading] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();

  const getRoleTitle = () => {
    switch (role) {
      case "parent": return "Parent";
      case "school": return "School";
      default: return "Student";
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (role === "student") {
      toast({
        title: "Registration Notice",
        description: "Student accounts are created and managed by parents from their dashboard.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const fullName = formData.get("fullName") as string;
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;
      const confirmPassword = formData.get("confirmPassword") as string;
      const schoolName = role === "school" ? ((formData.get("schoolName") as string) || "").trim() : undefined;

      // Validate input
      const validated = signupSchema.parse({ fullName, email, password, confirmPassword });

      if (role === "school" && (!schoolName || schoolName.length < 2)) {
        toast({
          title: "Validation Error",
          description: "School name must be at least 2 characters",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: validated.email,
        password: validated.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: validated.fullName,
            role: role,
            ...(role === "school" ? { school_name: schoolName } : {}),
          },
        },
      });

      if (error) {
        toast({
          title: "Signup Failed",
          description: getSafeErrorMessage(error),
          variant: "destructive",
        });
        return;
      }

      if (!data.user) {
        toast({
          title: "Signup Failed",
          description: "Unable to create account",
          variant: "destructive",
        });
        return;
      }

      // Send verification email via edge function
      const { error: emailError } = await supabase.functions.invoke(
        "send-verification-email",
        {
          body: { user_id: data.user.id },
        }
      );

      if (emailError) {
        console.error("Error sending verification email:", emailError);
      }

      toast({
        title: "Account Created!",
        description: "Please check your email to verify your account.",
      });

      navigate(`/verify-email?email=${encodeURIComponent(validated.email)}&role=${role}&user_id=${data.user.id}`);
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

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      localStorage.setItem("pendingRole", role);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        toast({
          title: "Google Sign-In Failed",
          description: getSafeErrorMessage(error),
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getSafeErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      role={role}
      badgeText={`${getRoleTitle()} Onboarding`}
      title={`Create ${getRoleTitle()} Account`}
      subtitle={`Join Éclat to empower ${role === "school" ? "your school cohorts" : "your child's academic journey"}`}
      footerLink={{
        text: "Already registered?",
        actionText: "Sign In instead",
        to: role === "parent" ? "/parent-login" : role === "school" ? "/school-login" : "/auth/login/role-selection",
      }}
    >
      {role === "student" ? (
        <div className="py-6 text-center space-y-4">
          <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto border border-primary/20 text-primary">
            <BookOpen size={32} />
          </div>
          <h3 className="text-lg font-bold text-foreground">Student Accounts Managed by Parents</h3>
          <p className="text-sm text-muted-foreground leading-relaxed px-2">
            To ensure child safety and personalized tracking, student accounts are created directly by parents within their Éclat dashboard.
          </p>
          <div className="pt-2 flex flex-col gap-2.5">
            <Button
              variant="hero"
              onClick={() => navigate("/student-login")}
              className="w-full text-sm font-bold h-11 rounded-xl"
            >
              Go to Student Login
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/auth?role=parent")}
              className="w-full text-sm font-bold h-11 rounded-xl border-2"
            >
              Sign Up as a Parent
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSignup} className="space-y-3.5">
          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="signup-name" className="text-sm font-bold text-foreground">
              {role === "school" ? "Administrator Full Name" : "Full Name"}
            </Label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                <User size={19} />
              </div>
              <Input
                id="signup-name"
                name="fullName"
                type="text"
                placeholder="e.g. Dr. Ngozi Eze"
                required
                minLength={2}
                maxLength={100}
                className="pl-11 h-11 bg-background border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/15 rounded-xl text-base font-medium text-foreground placeholder:text-muted-foreground/60 shadow-xs"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="signup-email" className="text-sm font-bold text-foreground">
              Email Address
            </Label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                <Mail size={19} />
              </div>
              <Input
                id="signup-email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                maxLength={255}
                className="pl-11 h-11 bg-background border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/15 rounded-xl text-base font-medium text-foreground placeholder:text-muted-foreground/60 shadow-xs"
              />
            </div>
          </div>

          {/* School Name if School */}
          {role === "school" && (
            <div className="space-y-1.5">
              <Label htmlFor="signup-school-name" className="text-sm font-bold text-foreground">
                School Name
              </Label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                  <School size={19} />
                </div>
                <Input
                  id="signup-school-name"
                  name="schoolName"
                  type="text"
                  placeholder="e.g. Apex Academy Lagos"
                  required
                  maxLength={200}
                  className="pl-11 h-11 bg-background border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/15 rounded-xl text-base font-medium text-foreground placeholder:text-muted-foreground/60 shadow-xs"
                />
              </div>
            </div>
          )}

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="signup-password" className="text-sm font-bold text-foreground">
              Password
            </Label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                <Lock size={19} />
              </div>
              <Input
                id="signup-password"
                name="password"
                type={showSignupPassword ? "text" : "password"}
                placeholder="••••••••"
                required
                minLength={6}
                maxLength={100}
                className="pl-11 pr-11 h-11 bg-background border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/15 rounded-xl text-base font-medium text-foreground placeholder:text-muted-foreground/60 shadow-xs"
              />
              <button
                type="button"
                onClick={() => setShowSignupPassword(!showSignupPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                {showSignupPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <Label htmlFor="signup-confirm-password" className="text-sm font-bold text-foreground">
              Confirm Password
            </Label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                <Lock size={19} />
              </div>
              <Input
                id="signup-confirm-password"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                required
                minLength={6}
                maxLength={100}
                className="pl-11 pr-11 h-11 bg-background border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/15 rounded-xl text-base font-medium text-foreground placeholder:text-muted-foreground/60 shadow-xs"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="hero"
            className="w-full h-12 text-base font-extrabold shadow-md rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-95 text-white transition-all mt-3"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                Create {getRoleTitle()} Account <ArrowRight className="ml-1.5 h-4 w-4" />
              </>
            )}
          </Button>

          {/* Divider */}
          <div className="relative my-2.5">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              OR
            </span>
          </div>

          {/* Google Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 rounded-xl border-2 border-border font-bold text-sm gap-3 hover:bg-muted/70 text-foreground"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          {/* Role selection back */}
          <div className="pt-2 text-center">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate("/auth/signup/role-selection")}
              className="text-xs font-bold text-muted-foreground hover:text-foreground"
            >
              ← Choose a different account type
            </Button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}

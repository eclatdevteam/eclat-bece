import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CardContent  } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, BookOpen, Loader2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { getSafeErrorMessage } from "@/lib/errorUtils";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ThemeToggle";
import eclatlLogo from "@/assets/logo.png";


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
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") || "student";
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
        title: "Registration Disabled",
        description: "Student accounts must be created by a parent.",
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

      // Defer role and record provisioning until AFTER login (via provision-user)
      // This avoids RLS violations during signup when the user has no session yet.

      // Send verification email via edge function (it will generate and store the code)
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

      // Navigate to email verification page with user_id for later onboarding redirect
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

      // Store role in localStorage before OAuth redirect
      localStorage.setItem('pendingRole', role);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
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
    <main className="relative flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8 font-sans text-slate-900 dark:bg-[#081328] dark:text-[#dce7ff]">
      <div className="absolute right-4 top-4"><ThemeToggle /></div>
      <div className="flex w-full max-w-[420px] flex-col items-center">
        <div className="animate-fade-in text-center">
          <img src={eclatlLogo} alt="Eclat Logo" className="mx-auto mb-2 h-16 w-auto" />
          <p className="mt-2 text-[11px] font-bold uppercase tracking-[2px] text-slate-600 dark:text-[#b9c5d9]">{getRoleTitle()} Portal</p>
        </div>

        <section className="mt-8 w-full max-w-[360px] animate-scale-in border border-slate-300 bg-white px-6 pb-6 pt-5 shadow-[0_10px_28px_rgba(15,23,42,0.12)] dark:border-[#2a3a53] dark:bg-[#1b283d] dark:shadow-[0_10px_28px_rgba(0,0,0,0.22)]">
          <div className="mb-5 grid grid-cols-2 text-center text-[12px] font-bold tracking-[1px]">
            <button type="button" onClick={() => navigate(role === "school" ? "/school-login" : role === "parent" ? "/parent-login" : "/student-login")} className="border-b border-slate-300 pb-3 text-slate-500 transition-colors hover:text-slate-900 dark:border-[#3a485c] dark:text-[#b6c0d1] dark:hover:text-white">Login</button>
            <button type="button" className="border-b-2 border-sky-600 pb-3 text-sky-600 dark:border-[#72c8f6] dark:text-[#72c8f6]">Sign Up</button>
          </div>

          <CardContent className="p-0">
            {/* Signup Form */}
            {role === "student" ? (
                  <div className="py-8 text-center space-y-4">
                    <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="text-primary" size={32} />
                    </div>
                    <h3 className="text-xl font-semibold">Registration Required</h3>
                    <p className="text-muted-foreground px-4">
                      Student accounts are created by parents. Please ask your parent to create an account for you from their dashboard.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/auth?role=student`)}
                      className="mt-4"
                    >
                      Return to Login
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSignup} className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name" className="text-[11px] font-bold tracking-[1px] text-slate-700 dark:text-[#c5cee0]">Full Name</Label>
                      <Input
                        id="signup-name"
                        name="fullName"
                        type="text"
                        placeholder="Ada Okafor"
                        required
                        minLength={2}
                        maxLength={100}
                        className="h-9 border-slate-300 bg-slate-50 text-[12px] text-slate-900 placeholder:text-slate-400 focus-visible:ring-sky-500 dark:border-[#2d3c55] dark:bg-[#111b30] dark:text-[#dce7ff] dark:placeholder:text-[#6f7b91] dark:focus-visible:ring-[#72c8f6]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-[11px] font-bold tracking-[1px] text-slate-700 dark:text-[#c5cee0]">Email</Label>
                      <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        required
                        maxLength={255}
                        className="h-9 border-slate-300 bg-slate-50 text-[12px] text-slate-900 placeholder:text-slate-400 focus-visible:ring-sky-500 dark:border-[#2d3c55] dark:bg-[#111b30] dark:text-[#dce7ff] dark:placeholder:text-[#6f7b91] dark:focus-visible:ring-[#72c8f6]"
                      />
                    </div>
                    {role === "school" && (
                      <div className="space-y-2">
                        <Label htmlFor="signup-school-name" className="text-[11px] font-bold tracking-[1px] text-slate-700 dark:text-[#c5cee0]">School Name</Label>
                        <Input
                          id="signup-school-name"
                          name="schoolName"
                          type="text"
                          placeholder="Lagos International School"
                          required
                          maxLength={200}
                          className="h-9 border-slate-300 bg-slate-50 text-[12px] text-slate-900 placeholder:text-slate-400 focus-visible:ring-sky-500 dark:border-[#2d3c55] dark:bg-[#111b30] dark:text-[#dce7ff] dark:placeholder:text-[#6f7b91] dark:focus-visible:ring-[#72c8f6]"
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-[11px] font-bold tracking-[1px] text-slate-700 dark:text-[#c5cee0]">Password</Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          name="password"
                          type={showSignupPassword ? "text" : "password"}
                          placeholder="••••••••"
                          required
                          minLength={6}
                          maxLength={100}
                          className="h-9 border-slate-300 bg-slate-50 pr-10 text-[12px] text-slate-900 focus-visible:ring-sky-500 dark:border-[#2d3c55] dark:bg-[#111b30] dark:text-[#dce7ff] dark:focus-visible:ring-[#72c8f6]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignupPassword(!showSignupPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-900 dark:text-[#718097] dark:hover:text-[#dce7ff]"
                        >
                          {showSignupPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm-password" className="text-[11px] font-bold tracking-[1px] text-slate-700 dark:text-[#c5cee0]">Confirm Password</Label>
                      <div className="relative">
                        <Input
                          id="signup-confirm-password"
                          name="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          required
                          minLength={6}
                          maxLength={100}
                          className="h-9 border-slate-300 bg-slate-50 pr-10 text-[12px] text-slate-900 focus-visible:ring-sky-500 dark:border-[#2d3c55] dark:bg-[#111b30] dark:text-[#dce7ff] dark:focus-visible:ring-[#72c8f6]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-900 dark:text-[#718097] dark:hover:text-[#dce7ff]"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      variant="hero"
                      className="flex h-9 w-full items-center justify-center gap-2 bg-sky-500 text-[12px] font-bold tracking-[1px] text-white transition-colors hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#72c8f6] dark:text-[#0a1a31] dark:hover:bg-[#8bd4fb]"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        <><span>Create Account</span><ArrowRight size={16} /></>
                      )}
                    </Button>

                    <div className="relative my-4">
                      <Separator />
                      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                        OR
                      </span>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="flex h-9 w-full items-center justify-center gap-2 border border-slate-300 bg-slate-50 text-[12px] font-bold tracking-[1px] text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#2a3a53] dark:bg-[#111b30] dark:text-[#dce7ff] dark:hover:bg-[#1a2a42]"
                      onClick={handleGoogleLogin}
                      disabled={isLoading}
                    >
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Continue with Google
                    </Button>
                  </form>
                )}

            <div className="mt-6 text-center">
              <Button variant="ghost" onClick={() => navigate("/signup/role-selection")} className="mt-7 flex items-center gap-2 text-[11px] font-medium text-slate-600 transition-colors hover:bg-transparent hover:text-slate-900 dark:text-[#c1cada] dark:hover:bg-transparent dark:hover:text-white">
                <ArrowLeft size={14} /> Back to Role Selection
              </Button>
            </div>
          </CardContent>
        </section>
      </div>
    </main>
  );
}

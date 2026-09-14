import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Loader2, Eye, EyeOff, ArrowLeft, ArrowRight, LockKeyhole, UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { getSafeErrorMessage } from "@/lib/errorUtils";
import { ThemeToggle } from "@/components/ThemeToggle";
import eclatlLogo from "@/assets/logo.png";

const loginSchema = z.object({
  username: z.string().trim().min(2, "Username must be at least 2 characters").max(100),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function StudentLogInPage() {
  const navigate = useNavigate();
  useRedirectIfAuthenticated();
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showForgotDialog, setShowForgotDialog] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const username = formData.get("username") as string;
      const password = formData.get("password") as string;

      if (!username || !password) {
        toast({ title: "Input Required", description: "Please enter both username and password", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      const validated = loginSchema.parse({ username, password });
      const loginEmail = `${validated.username.trim().toLowerCase()}@student.eclat.com`;
      const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });

      if (error) {
        toast({ title: "Login Failed", description: getSafeErrorMessage(error, true), variant: "destructive" });
        setIsLoading(false);
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .maybeSingle();
      const userRole = roleData?.role as string | undefined;

      if (!userRole) {
        toast({ title: "Role Not Found", description: "Please complete your account setup.", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      if (userRole !== "student") {
        toast({
          title: "Account Incompatible",
          description: "This account is registered under a different account type and cannot be used for Student access. Please sign in through your designated portal.",
          variant: "destructive",
        });
        await supabase.auth.signOut();
        setIsLoading(false);
        return;
      }

      navigate("/dashboard/student");
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        toast({ title: "Validation Error", description: error.errors[0].message, variant: "destructive" });
      } else {
        toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8 font-sans text-slate-900 dark:bg-[#081328] dark:text-[#dce7ff]">
      <div className="absolute right-4 top-4"><ThemeToggle /></div>
      <div className="flex w-full max-w-[420px] flex-col items-center">
        <div className="animate-fade-in text-center">
          <img src={eclatlLogo} alt="Eclat Logo" className="h-16 w-auto mx-auto mb-2" />
          <p className="mt-2 text-[11px] font-bold uppercase tracking-[2px] text-slate-600 dark:text-[#b9c5d9]">Student Portal</p>
        </div>

        <section className="mt-8 w-full max-w-[330px] animate-scale-in border border-slate-300 bg-white px-6 pb-6 pt-5 shadow-[0_10px_28px_rgba(15,23,42,0.12)] dark:border-[#2a3a53] dark:bg-[#1b283d] dark:shadow-[0_10px_28px_rgba(0,0,0,0.22)]">
          <div className="mb-5 grid grid-cols-2 text-center text-[12px] font-bold tracking-[1px]">
            <button type="button" className="border-b-2 border-sky-600 pb-3 text-sky-600 dark:border-[#72c8f6] dark:text-[#72c8f6]">Login</button>
            <button type="button" onClick={() => navigate("/student-signup")} className="border-b border-slate-300 pb-3 text-slate-500 transition-colors hover:text-slate-900 dark:border-[#3a485c] dark:text-[#b6c0d1] dark:hover:text-white">Sign Up</button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="login-username" className="text-[11px] font-bold tracking-[1px] text-slate-700 dark:text-[#c5cee0]">Username</label>
              <div className="relative">
                <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#8d9bb1]" size={15} />
                <Input id="login-username" name="username" type="text" placeholder="e.g. ada.okafor" required minLength={2} maxLength={100} className="h-9 border-slate-300 bg-slate-50 pl-9 text-[12px] text-slate-900 placeholder:text-slate-400 focus-visible:ring-sky-500 dark:border-[#2d3c55] dark:bg-[#111b30] dark:text-[#dce7ff] dark:placeholder:text-[#6f7b91] dark:focus-visible:ring-[#72c8f6]" />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="login-password" className="text-[11px] font-bold tracking-[1px] text-slate-700 dark:text-[#c5cee0]">Password</label>
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#8d9bb1]" size={15} />
                <Input id="login-password" name="password" type={showLoginPassword ? "text" : "password"} placeholder="••••••••" required minLength={6} maxLength={100} className="h-9 border-slate-300 bg-slate-50 pl-9 pr-10 text-[12px] text-slate-900 placeholder:text-slate-400 focus-visible:ring-sky-500 dark:border-[#2d3c55] dark:bg-[#111b30] dark:text-[#dce7ff] dark:placeholder:text-[#6f7b91] dark:focus-visible:ring-[#72c8f6]" />
                <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} aria-label={showLoginPassword ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-900 dark:text-[#718097] dark:hover:text-[#dce7ff]">
                  {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="flex justify-end">
                <button type="button" onClick={() => navigate("/password-reset")} className="text-[10px] font-semibold text-sky-600 hover:underline dark:text-[#72c8f6]">Forgot password?</button>
              </div>
            </div>

            <button type="submit" className="flex h-9 w-full items-center justify-center gap-2 bg-sky-500 text-[12px] font-bold tracking-[1px] text-white transition-colors hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#72c8f6] dark:text-[#0a1a31] dark:hover:bg-[#8bd4fb]" disabled={isLoading}>
              {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Signing in...</> : <>Sign In <ArrowRight size={16} /></>}
            </button>
          </form>
        </section>

        <button type="button" onClick={() => navigate("/auth/login/role-selection")} className="mt-7 flex items-center gap-2 text-[11px] font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-[#c1cada] dark:hover:text-white"><ArrowLeft size={14} /> Back to Role Selection</button>
        <p className="mt-4 text-[9px] tracking-[1px] text-slate-400 dark:text-[#718098]">© 2024 Eclat Platform. All rights reserved.</p>
      </div>
    </main>
  );
}

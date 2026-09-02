import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Eye, EyeOff, KeyRound, User, Lock, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { getSafeErrorMessage } from "@/lib/errorUtils";
import { useRedirectIfAuthenticated } from "@/hooks/useRedirectIfAuthenticated";
import { AuthLayout } from "@/components/auth/AuthLayout";

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
        toast({
          title: "Input Required",
          description: "Please enter both username and password",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Validate input
      const validated = loginSchema.parse({ username, password });

      // Map username to email format
      const loginEmail = `${validated.username.trim().toLowerCase()}@student.eclat.com`;

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: password,
      });

      if (error) {
        toast({
          title: "Login Failed",
          description: getSafeErrorMessage(error, true),
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Get user's role from database
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .maybeSingle();

      const userRole = roleData?.role as string | undefined;

      if (!userRole) {
        toast({
          title: "Role Not Found",
          description: "Please complete your account setup.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Validate that user is a student
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

  return (
    <AuthLayout
      role="student"
      badgeText="Student Portal"
      title="Student Sign In"
      subtitle="Enter your unique username and password to start practicing"
    >
      <form onSubmit={handleLogin} className="space-y-4">
        {/* Username Field */}
        <div className="space-y-2">
          <Label htmlFor="login-username" className="text-sm font-bold text-foreground">
            Student Username
          </Label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              <User size={19} />
            </div>
            <Input
              id="login-username"
              name="username"
              type="text"
              placeholder="e.g. ada.okafor"
              required
              minLength={2}
              maxLength={100}
              className="pl-11 h-12 bg-background border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/15 rounded-xl text-base font-medium text-foreground placeholder:text-muted-foreground/60 shadow-xs"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password" className="text-sm font-bold text-foreground">
              Password
            </Label>
            <button
              type="button"
              onClick={() => setShowForgotDialog(true)}
              className="text-xs text-primary hover:underline font-bold"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              <Lock size={19} />
            </div>
            <Input
              id="login-password"
              name="password"
              type={showLoginPassword ? "text" : "password"}
              placeholder="••••••••"
              required
              minLength={6}
              maxLength={100}
              className="pl-11 pr-11 h-12 bg-background border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/15 rounded-xl text-base font-medium text-foreground placeholder:text-muted-foreground/60 shadow-xs"
            />
            <button
              type="button"
              onClick={() => setShowLoginPassword(!showLoginPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              {showLoginPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Action Button */}
        <Button
          type="submit"
          variant="hero"
          className="w-full h-12 text-base font-extrabold shadow-md rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-95 text-white transition-all mt-3"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign In to Practice <ArrowRight className="ml-1.5 h-4 w-4" />
            </>
          )}
        </Button>

        {/* Portal Switcher & Back Links */}
        <div className="space-y-3 pt-4 border-t border-border/60 text-center">
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 text-xs font-bold rounded-xl border-2 border-border hover:bg-muted/70 text-foreground"
            onClick={() => navigate("/auth/login/role-selection")}
            disabled={isLoading}
          >
            Switch to Another Role
          </Button>

          <div className="flex items-center justify-center gap-3 text-xs font-medium text-muted-foreground pt-1">
            <span>Are you a parent?</span>
            <Link to="/parent-login" className="font-bold text-primary hover:underline">
              Parent Login
            </Link>
            <span>•</span>
            <Link to="/school-login" className="font-bold text-primary hover:underline">
              School Login
            </Link>
          </div>
        </div>
      </form>

      {/* Student Password Help Dialog */}
      <Dialog open={showForgotDialog} onOpenChange={setShowForgotDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl border-2">
          <DialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-2 text-primary border border-primary/20">
              <KeyRound className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center text-xl font-bold">Student Password Reset</DialogTitle>
            <DialogDescription className="text-center text-xs pt-1 text-muted-foreground">
              Student accounts are managed by parents. To reset your password, please follow these steps:
            </DialogDescription>
          </DialogHeader>

          <div className="bg-muted/50 rounded-2xl p-4 text-xs space-y-3 border border-border/50 text-foreground">
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-[11px] flex-shrink-0">
                1
              </span>
              <span>Ask your parent to log into their <strong>Parent Account</strong>.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-[11px] flex-shrink-0">
                2
              </span>
              <span>Go to the <strong>My Children</strong> section in their dashboard.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-[11px] flex-shrink-0">
                3
              </span>
              <span>Click the settings menu next to your name and choose <strong>Change Password</strong>.</span>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowForgotDialog(false);
                navigate("/parent-login");
              }}
              className="w-full sm:w-auto text-xs font-bold rounded-xl"
            >
              Go to Parent Login
            </Button>
            <Button
              type="button"
              variant="hero"
              onClick={() => setShowForgotDialog(false)}
              className="w-full sm:w-auto text-xs font-bold rounded-xl"
            >
              Understood
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthLayout>
  );
}

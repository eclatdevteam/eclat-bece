import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookOpen, Loader2, Eye, EyeOff, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { getSafeErrorMessage } from "@/lib/errorUtils";

const loginSchema = z.object({
  username: z.string().trim().min(2, "Username must be at least 2 characters").max(100),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function StudentLogInPage() {
  const navigate = useNavigate();
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
          title: "Wrong Login Portal",
          description: `This account is registered as a ${userRole}. Please use the ${userRole} login.`,
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
    <div className="min-h-screen bg-gradient-to-br from-primary-light/20 via-background to-accent-light/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 mb-2">
            <BookOpen className="text-primary" size={32} />
            <h1 className="text-3xl font-bold text-foreground">Éclat</h1>
          </div>
          <p className="text-muted-foreground">Empowering learning, one quiz at a time</p>
        </div>

        <Card className="border-2 animate-scale-in">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Student Sign In</CardTitle>
            <CardDescription className="text-center">
              Sign in to your student account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-username">Username</Label>
                <Input
                  id="login-username"
                  name="username"
                  type="text"
                  placeholder="e.g. ada.okafor"
                  required
                  minLength={2}
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    name="password"
                    type={showLoginPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    maxLength={100}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showLoginPassword ? (
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
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => navigate("/auth/login/role-selection")}
                disabled={isLoading}
              >
                Back to Login Selection Page
              </Button>

              <p className="text-sm text-center text-muted-foreground">
                Forgot your password?{" "}
                <button
                  type="button"
                  onClick={() => setShowForgotDialog(true)}
                  className="text-primary hover:underline font-semibold"
                >
                  Get help
                </button>
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Student Password Help Dialog */}
        <Dialog open={showForgotDialog} onOpenChange={setShowForgotDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2 text-primary">
                <KeyRound className="h-6 w-6" />
              </div>
              <DialogTitle className="text-center text-xl">Student Password Reset</DialogTitle>
              <DialogDescription className="text-center text-sm pt-2 text-muted-foreground">
                Student accounts are created and managed by parents. To change or reset your password, please ask your parent to:
              </DialogDescription>
            </DialogHeader>

            <div className="bg-muted/50 rounded-xl p-4 text-sm space-y-2 border border-border/50 text-foreground">
              <div className="flex items-start gap-2">
                <span className="font-bold text-primary">1.</span>
                <span>Log into their Éclat <strong>Parent Account</strong>.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-primary">2.</span>
                <span>Go to <strong>My Children</strong> in their dashboard.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-primary">3.</span>
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
                className="w-full sm:w-auto"
              >
                Go to Parent Login
              </Button>
              <Button
                type="button"
                variant="hero"
                onClick={() => setShowForgotDialog(false)}
                className="w-full sm:w-auto"
              >
                Got It
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

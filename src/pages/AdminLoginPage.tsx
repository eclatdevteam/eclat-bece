import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, AlertCircle, Loader2, Eye, EyeOff, Mail, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useRedirectIfAuthenticated } from "@/hooks/useRedirectIfAuthenticated";
import { AuthLayout } from "@/components/auth/AuthLayout";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  useRedirectIfAuthenticated();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Attempt login
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setError("Login failed. Please try again.");
        setLoading(false);
        return;
      }

      // Check if user has admin role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authData.user.id)
        .eq("role", "admin" as any)
        .maybeSingle();

      if (!roleData) {
        await supabase.auth.signOut();
        setError("Access denied. This login is for administrators only.");
        setLoading(false);
        return;
      }

      // Check if admin account is active
      const { data: adminData } = await supabase
        .from("admins" as any)
        .select("is_active, full_name")
        .eq("user_id", authData.user.id)
        .maybeSingle() as any;

      if (!adminData || !adminData.is_active) {
        await supabase.auth.signOut();
        setError("Your admin account has been deactivated. Please contact a super administrator.");
        setLoading(false);
        return;
      }

      toast.success(`Welcome back, ${adminData.full_name}!`);
      navigate("/admin");
    } catch (error) {
      console.error("Login error:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      role="admin"
      badgeText="Platform Staff"
      title="Admin Access"
      subtitle="Sign in to the Éclat platform administration console"
      footerLink={{
        text: "Not an administrator?",
        actionText: "Go to Main Login",
        to: "/auth/login/role-selection",
      }}
    >
      <form onSubmit={handleLogin} className="space-y-4">
        {/* Error Alert */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-destructive">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p className="font-semibold leading-relaxed">{error}</p>
          </div>
        )}

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-bold text-foreground">
            Staff Email Address
          </Label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              <Mail size={19} />
            </div>
            <Input
              id="email"
              type="email"
              placeholder="admin@eclat.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="pl-11 h-12 bg-background border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/15 rounded-xl text-base font-medium text-foreground placeholder:text-muted-foreground/60 shadow-xs"
              autoComplete="username"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-bold text-foreground">
              Master Password
            </Label>
            <Link
              to="/password-reset"
              className="text-xs text-primary hover:underline font-bold"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              <Lock size={19} />
            </div>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="pl-11 pr-11 h-12 bg-background border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/15 rounded-xl text-base font-medium text-foreground placeholder:text-muted-foreground/60 shadow-xs"
              autoComplete="current-password"
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

        {/* Action Button */}
        <Button
          type="submit"
          variant="hero"
          className="w-full h-12 text-base font-extrabold shadow-md rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-95 text-white transition-all mt-3"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying Authorization...
            </>
          ) : (
            <>
              Sign In as Admin <ArrowRight className="ml-1.5 h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}

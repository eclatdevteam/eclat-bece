import { useState, useEffect } from "react";
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
  Shield,
  KeyRound,
  AlertCircle,
  RotateCcw,
  UserCheck,
  LogOut,
  Sliders,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { useAuth } from "@/hooks/useAuth";

const emailSchema = z.object({
  email: z.string().trim().email("Invalid administrator email address"),
});

export default function AdminPasswordResetPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signOut } = useAuth();

  const tokenHash = searchParams.get("token_hash");
  const hasTokenInUrl = Boolean(tokenHash);

  // State
  const [isVerifyingToken, setIsVerifyingToken] = useState(hasTokenInUrl);
  const [tokenInvalid, setTokenInvalid] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [activeUser, setActiveUser] = useState<{ email?: string; fullName?: string } | null>(null);
  const [showOverrideForm, setShowOverrideForm] = useState(false);

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // New Password State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Handle direct recovery token verification (token_hash)
  useEffect(() => {
    if (tokenHash) {
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
            setErrorMsg("This password recovery link is invalid or has expired. Please request a new one.");
          } else {
            setTokenInvalid(false);
            setIsUpdateMode(true);
            toast.success("Security token verified. Please configure your new master password.");
          }
        })
        .catch((err) => {
          setIsVerifyingToken(false);
          setTokenInvalid(true);
          setIsUpdateMode(false);
          setErrorMsg("Failed to verify security token. Please request a new recovery link.");
        });
    } else {
      // If no token_hash, check if user is already signed in or has an active session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          // If we arrived with a recovery hash
          const hasRecoveryHash =
            window.location.hash.includes("type=recovery") ||
            window.location.hash.includes("access_token");

          if (hasRecoveryHash) {
            setIsUpdateMode(true);
          } else {
            // Active session direct visit
            setActiveUser({
              email: session.user.email,
              fullName: session.user.user_metadata?.full_name || "Administrator",
            });
          }
        }
      });
    }
  }, [tokenHash]);

  // Listen for Supabase password recovery event
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

  // Password Validation Criteria
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isPasswordValid =
    hasMinLength && hasUppercase && hasLowercase && hasNumber && passwordsMatch;

  // Step 1: Send Reset Link via Edge Function
  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      const validated = emailSchema.parse({ email });
      setIsLoading(true);

      const { data, error } = await supabase.functions.invoke("send-password-reset", {
        body: {
          email: validated.email,
          siteUrl: window.location.origin,
          role: "admin",
        },
      });

      if (error) {
        throw new Error(error.message || "Failed to dispatch password recovery link");
      }

      const result = data as any;
      if (result && result.success === false) {
        throw new Error(result.error || "Failed to dispatch password recovery link");
      }

      setEmailSent(true);
      toast.success("Security reset link dispatched to your email!");
    } catch (err: any) {
      console.error("Admin reset email error:", err);
      if (err instanceof z.ZodError) {
        setErrorMsg(err.errors[0].message);
      } else {
        setErrorMsg(err.message || "Failed to dispatch reset link. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Set New Admin Password (with OWASP ASVS 2.8 Clean Termination)
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!isPasswordValid) {
      setErrorMsg("Please satisfy all password security requirements below.");
      return;
    }

    setIsLoading(true);
    try {
      const { data: updateData, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      // Log audit action
      try {
        if (updateData?.user) {
          const { data: adminId } = await supabase.rpc("get_admin_id", {
            _user_id: updateData.user.id,
          });
          if (adminId) {
            await supabase.rpc("log_admin_action", {
              _admin_id: adminId,
              _action: "reset_password_recovery",
              _resource_type: "admin",
              _resource_id: adminId,
              _details: { status: "success" },
            });
          }
        }
      } catch (logErr) {
        console.warn("Could not log recovery password update:", logErr);
      }

      // OWASP ASVS 2.8: Sign out of recovery session so the user must authenticate cleanly
      await supabase.auth.signOut();

      toast.success("Administrator password updated successfully! Please sign in with your new credentials.");
      navigate("/admin/login", { replace: true });
    } catch (err: any) {
      console.error("Admin password update error:", err);
      setErrorMsg(err.message || "Failed to update password. Recovery link may have expired.");
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
    setErrorMsg("");
    navigate("/admin/reset-password", { replace: true });
  };

  const handleSignOutToRecover = async () => {
    await signOut("/admin/reset-password");
    setActiveUser(null);
    setShowOverrideForm(true);
  };

  return (
    <AuthLayout
      role="admin"
      badgeText="Staff Security"
      title={
        tokenInvalid
          ? "Link Expired or Invalid"
          : isUpdateMode
          ? "Configure New Password"
          : activeUser && !showOverrideForm
          ? "Already Signed In"
          : "Admin Password Reset"
      }
      subtitle={
        tokenInvalid
          ? "This recovery link is no longer valid. Please request a fresh reset link."
          : isUpdateMode
          ? "Set up a new secure password for your administrator account."
          : activeUser && !showOverrideForm
          ? `You are currently signed in as ${activeUser.email}.`
          : emailSent
          ? "Check your email for authorized recovery instructions."
          : "Enter your staff email address to receive an authorized password recovery link."
      }
      footerLink={{
        text: "Remembered your credentials?",
        actionText: "Return to Admin Sign In",
        to: "/admin/login",
      }}
    >
      {/* Error Alert */}
      {errorMsg && !tokenInvalid && (
        <div className="mb-4 bg-destructive/10 border border-destructive/30 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-destructive animate-fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p className="font-semibold leading-relaxed">{errorMsg}</p>
        </div>
      )}

      {/* State 1: Verifying Token */}
      {isVerifyingToken ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-3 text-center animate-fade-in">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-semibold text-foreground">
            Verifying secure password recovery token...
          </p>
          <p className="text-xs text-muted-foreground">
            Please wait while we authorize your administrator session.
          </p>
        </div>
      ) : tokenInvalid ? (
        /* State 2: Invalid / Expired Token Screen */
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
              <RotateCcw size={14} /> Request New Recovery Link
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/admin/login")}
              className="w-full h-10 text-xs font-bold rounded-xl border-2 gap-1.5"
            >
              <Shield size={14} /> Return to Admin Sign In
            </Button>
          </div>
        </div>
      ) : isUpdateMode ? (
        /* State 3: Valid Recovery Token -> Update Password Form */
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="admin-new-password" className="text-sm font-bold text-foreground">
              New Master Password
            </Label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                <Lock size={19} />
              </div>
              <Input
                id="admin-new-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={isLoading}
                className="pl-11 pr-11 h-12 bg-background border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/15 rounded-xl text-base font-medium text-foreground placeholder:text-muted-foreground/60 shadow-xs"
                autoComplete="new-password"
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

          {/* Confirm New Password */}
          <div className="space-y-2">
            <Label htmlFor="admin-confirm-password" className="text-sm font-bold text-foreground">
              Confirm Master Password
            </Label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                <Lock size={19} />
              </div>
              <Input
                id="admin-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                className="pl-11 pr-11 h-12 bg-background border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/15 rounded-xl text-base font-medium text-foreground placeholder:text-muted-foreground/60 shadow-xs"
                autoComplete="new-password"
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

          {/* Live Password Checklist */}
          {newPassword.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-muted/40 border space-y-2 animate-fade-in text-xs">
              <p className="font-bold text-foreground">Security Requirements:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                <div className={`flex items-center gap-1.5 ${hasMinLength ? "text-emerald-500 font-semibold" : "text-muted-foreground"}`}>
                  {hasMinLength ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                  <span>At least 8 characters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasUppercase ? "text-emerald-500 font-semibold" : "text-muted-foreground"}`}>
                  {hasUppercase ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                  <span>Uppercase letter (A-Z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasLowercase ? "text-emerald-500 font-semibold" : "text-muted-foreground"}`}>
                  {hasLowercase ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                  <span>Lowercase letter (a-z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasNumber ? "text-emerald-500 font-semibold" : "text-muted-foreground"}`}>
                  {hasNumber ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                  <span>At least 1 number (0-9)</span>
                </div>
                <div className={`flex items-center gap-1.5 sm:col-span-2 ${passwordsMatch ? "text-emerald-500 font-semibold" : "text-muted-foreground"}`}>
                  {passwordsMatch ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                  <span>Passwords match</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <Button
            type="submit"
            variant="hero"
            className="w-full h-12 text-base font-extrabold shadow-md rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-95 text-white transition-all mt-3"
            disabled={isLoading || !isPasswordValid}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating Administrator Password...
              </>
            ) : (
              <>
                Save Administrator Password <ArrowRight className="ml-1.5 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      ) : activeUser && !showOverrideForm ? (
        /* State 4: Smart Prompt for Already Signed-In User */
        <div className="text-center space-y-4 py-3 animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto">
            <UserCheck size={32} />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-foreground">
              You are currently logged in
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed px-2">
              You are logged in as <strong>{activeUser.email}</strong>. To update your password, you can change it directly in your Admin Settings tab.
            </p>
          </div>

          <div className="pt-2 space-y-2">
            <Button
              variant="hero"
              onClick={() => navigate("/admin/settings")}
              className="w-full h-11 text-xs font-bold rounded-xl gap-1.5 shadow-md"
            >
              <Sliders size={14} /> Go to Admin Settings (Change Password)
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
        /* State 5: Email Sent Screen */
        <div className="text-center space-y-4 py-3 animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
            <CheckCircle2 size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">Recovery Link Dispatched</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed px-2">
              We have sent a secure password recovery email to <strong>{email}</strong>. Click the link in the message to configure your new master password.
            </p>
          </div>
          <div className="pt-2">
            <Button
              variant="outline"
              onClick={() => navigate("/admin/login")}
              className="w-full h-11 text-xs font-bold rounded-xl border-2 gap-1.5"
            >
              <Shield size={14} /> Return to Admin Login
            </Button>
          </div>
        </div>
      ) : (
        /* State 6: Request Reset Link Form */
        <form onSubmit={handleSendResetEmail} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-email" className="text-sm font-bold text-foreground">
              Administrator Email Address
            </Label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                <Mail size={19} />
              </div>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@eclat.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="pl-11 h-12 bg-background border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/15 rounded-xl text-base font-medium text-foreground placeholder:text-muted-foreground/60 shadow-xs"
                autoComplete="email"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="hero"
            className="w-full h-12 text-base font-extrabold shadow-md rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-95 text-white transition-all mt-3"
            disabled={isLoading || !email.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Dispatching Reset Link...
              </>
            ) : (
              <>
                Send Recovery Link <ArrowRight className="ml-1.5 h-4 w-4" />
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate("/admin/login")}
            className="w-full h-10 text-xs font-bold rounded-xl text-muted-foreground hover:text-foreground"
          >
            Cancel & Return to Admin Sign In
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}

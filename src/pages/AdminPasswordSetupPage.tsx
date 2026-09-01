import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle2, XCircle, Loader2, Eye, EyeOff, Lock, User, Mail, ArrowRight, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuthLayout } from "@/components/auth/AuthLayout";

const formSchema = z.object({
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

interface InvitationDetails {
  id: string;
  email: string;
  full_name: string;
  is_super_admin: boolean;
  permissions?: Record<string, boolean>;
}

export default function AdminPasswordSetupPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  const passwordValue = form.watch("password") || "";

  // Live password requirements check
  const hasMinLength = passwordValue.length >= 8;
  const hasUppercase = /[A-Z]/.test(passwordValue);
  const hasLowercase = /[a-z]/.test(passwordValue);
  const hasNumber = /[0-9]/.test(passwordValue);

  useEffect(() => {
    loadInvitation();
  }, [token]);

  const loadInvitation = async () => {
    try {
      if (!token) {
        setError("Missing invitation token.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .rpc("get_invitation_details", { _token: token });

      if (error) throw error;

      const result = data as any;
      if (!result.success || !result.invitation) {
        setError(result.error || "Invalid or expired invitation link.");
        setLoading(false);
        return;
      }

      const invData = result.invitation;

      setInvitation({
        id: invData.id,
        email: invData.target_email,
        full_name: invData.full_name,
        is_super_admin: invData.is_super_admin,
        permissions: invData.permissions,
      });

      setLoading(false);
    } catch (err: any) {
      console.error("Error loading invitation:", err);
      setError(err.message || "Failed to load invitation details.");
      setLoading(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!token) return;
    setCreating(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-admin-user", {
        body: {
          token: token,
          password: values.password,
        },
      });

      if (error) {
        throw new Error(`Account setup error: ${error.message}`);
      }

      const result = data as any;
      if (!result.success) {
        throw new Error(result.error || "Failed to create administrator account");
      }

      toast.success("Administrator account activated successfully!");
      toast.info("Redirecting to admin login...");

      setTimeout(() => {
        navigate("/admin/login");
      }, 1800);
    } catch (err: any) {
      console.error("Error creating admin account:", err);
      toast.error(err.message || "Failed to activate administrator account");
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm font-bold text-muted-foreground">Validating invitation credentials...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <AuthLayout
        role="admin"
        badgeText="Invitation Status"
        title="Invalid Invitation"
        subtitle="This administrator invitation link cannot be used"
        footerLink={{
          text: "Need to sign in?",
          actionText: "Go to Admin Login",
          to: "/admin/login",
        }}
      >
        <div className="py-4 text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-center justify-center text-destructive">
            <XCircle size={32} />
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed px-2">
            {error}
          </p>
          <Button
            variant="outline"
            onClick={() => navigate("/admin/login")}
            className="w-full h-11 rounded-xl text-xs font-bold border-2"
          >
            Return to Admin Login
          </Button>
        </div>
      </AuthLayout>
    );
  }

  if (!invitation) return null;

  return (
    <AuthLayout
      role="admin"
      badgeText="Administrator Onboarding"
      title="Complete Admin Setup"
      subtitle="Create your secure password to activate your staff account"
      footerLink={{
        text: "Already activated?",
        actionText: "Sign In",
        to: "/admin/login",
      }}
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Account Details Box */}
        <div className="p-3.5 rounded-2xl bg-muted/60 border border-border space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-semibold">Staff Member:</span>
            <span className="font-bold text-foreground">{invitation.full_name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-semibold">Admin Email:</span>
            <span className="font-bold text-foreground">{invitation.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-semibold">Access Level:</span>
            <Badge
              variant={invitation.is_super_admin ? "default" : "secondary"}
              className="text-[10px] font-extrabold"
            >
              {invitation.is_super_admin ? "Super Administrator" : "Staff Administrator"}
            </Badge>
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm font-bold text-foreground">
            Create Password
          </Label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              <Lock size={19} />
            </div>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              disabled={creating}
              className="pl-11 pr-11 h-12 bg-background border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/15 rounded-xl text-base font-medium text-foreground placeholder:text-muted-foreground/60 shadow-xs"
              {...form.register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {form.formState.errors.password && (
            <p className="text-xs text-destructive font-medium mt-1">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-sm font-bold text-foreground">
            Confirm Password
          </Label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              <Lock size={19} />
            </div>
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              disabled={creating}
              className="pl-11 pr-11 h-12 bg-background border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/15 rounded-xl text-base font-medium text-foreground placeholder:text-muted-foreground/60 shadow-xs"
              {...form.register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {form.formState.errors.confirmPassword && (
            <p className="text-xs text-destructive font-medium mt-1">
              {form.formState.errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Password Strength Criteria Checklist */}
        <div className="p-3 rounded-2xl bg-muted/40 border text-xs space-y-1.5">
          <p className="font-bold text-foreground text-[11px] uppercase tracking-wider mb-1">
            Password Requirements:
          </p>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <div className={`flex items-center gap-1.5 ${hasMinLength ? "text-emerald-600 font-bold" : "text-muted-foreground"}`}>
              {hasMinLength ? <Check size={12} className="text-emerald-600" /> : <span className="w-3 text-center">•</span>}
              <span>8+ Characters</span>
            </div>
            <div className={`flex items-center gap-1.5 ${hasUppercase ? "text-emerald-600 font-bold" : "text-muted-foreground"}`}>
              {hasUppercase ? <Check size={12} className="text-emerald-600" /> : <span className="w-3 text-center">•</span>}
              <span>1 Uppercase Letter</span>
            </div>
            <div className={`flex items-center gap-1.5 ${hasLowercase ? "text-emerald-600 font-bold" : "text-muted-foreground"}`}>
              {hasLowercase ? <Check size={12} className="text-emerald-600" /> : <span className="w-3 text-center">•</span>}
              <span>1 Lowercase Letter</span>
            </div>
            <div className={`flex items-center gap-1.5 ${hasNumber ? "text-emerald-600 font-bold" : "text-muted-foreground"}`}>
              {hasNumber ? <Check size={12} className="text-emerald-600" /> : <span className="w-3 text-center">•</span>}
              <span>1 Number (0-9)</span>
            </div>
          </div>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          variant="hero"
          disabled={creating}
          className="w-full h-12 text-base font-extrabold shadow-md rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-95 text-white transition-all mt-2"
        >
          {creating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Activating Account...
            </>
          ) : (
            <>
              Activate Admin Account <ArrowRight className="ml-1.5 h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}

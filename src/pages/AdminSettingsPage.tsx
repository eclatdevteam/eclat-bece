import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Save,
  User,
  Sliders,
  Shield,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Mail,
  Lock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useAdminPermissions } from "@/hooks/useAdminPermissions";

interface SystemSetting {
  key: string;
  value: any;
  description: string;
}

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const { admin, isSuperAdmin, refetch: refetchAdmin } = useAdminPermissions();

  // Profile Form State
  const [fullName, setFullName] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Password Form State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // System Settings State
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  // Load initial profile data
  useEffect(() => {
    if (admin) {
      setFullName(admin.full_name || "");
    }
  }, [admin]);

  // Load system settings
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoadingSettings(true);
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .order("key");

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load global settings");
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleSettingChange = (key: string, newValue: any) => {
    setSettings((prev) =>
      prev.map((s) => (s.key === key ? { ...s, value: newValue } : s))
    );
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !fullName.trim()) {
      toast.error("Please enter a valid full name.");
      return;
    }

    setUpdatingProfile(true);
    try {
      // 1. Update profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // 2. Update admins table
      const { error: adminError } = await supabase
        .from("admins" as any)
        .update({
          full_name: fullName.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (adminError) throw adminError;

      // 3. Update auth user metadata
      await supabase.auth.updateUser({
        data: { full_name: fullName.trim() },
      });

      // 4. Log audit action
      try {
        const { data: adminId } = await supabase.rpc("get_admin_id", {
          _user_id: user.id,
        });
        await supabase.rpc("log_admin_action", {
          _admin_id: adminId,
          _action: "update_profile",
          _resource_type: "admin",
          _resource_id: admin?.id || null,
          _details: { updated_name: fullName.trim() },
        });
      } catch (logErr) {
        console.warn("Could not log profile update audit:", logErr);
      }

      toast.success("Profile information updated successfully!");
      refetchAdmin();
    } catch (err: any) {
      console.error("Error updating profile:", err);
      toast.error(err.message || "Failed to update profile");
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Password Validation Criteria
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && passwordsMatch;

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      toast.error("Please meet all password security requirements.");
      return;
    }

    setUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      // Log audit action
      try {
        if (user) {
          const { data: adminId } = await supabase.rpc("get_admin_id", {
            _user_id: user.id,
          });
          await supabase.rpc("log_admin_action", {
            _admin_id: adminId,
            _action: "change_password",
            _resource_type: "admin",
            _resource_id: admin?.id || null,
            _details: { status: "success" },
          });
        }
      } catch (logErr) {
        console.warn("Could not log password change audit:", logErr);
      }

      toast.success("Password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error("Error updating password:", err);
      toast.error(err.message || "Failed to update password");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleSaveGeneralSettings = async () => {
    if (!user) return;
    setSavingSettings(true);
    try {
      const adminIdRes = await supabase.rpc("get_admin_id", { _user_id: user.id });
      const adminId = adminIdRes.data;

      const updates = settings.map((setting) =>
        supabase
          .from("system_settings")
          .update({
            value: setting.value,
            updated_by: adminId,
            updated_at: new Date().toISOString(),
          })
          .eq("key", setting.key)
      );

      await Promise.all(updates);

      // Log audit
      try {
        await supabase.rpc("log_admin_action", {
          _admin_id: adminId,
          _action: "update_system_settings",
          _resource_type: "system_settings",
          _resource_id: null,
          _details: { settings_updated: settings.map((s) => s.key) },
        });
      } catch (logErr) {
        console.warn("Could not log settings update audit:", logErr);
      }

      toast.success("System configurations saved successfully!");
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast.error(error.message || "Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight text-foreground">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your personal account credentials and global platform configurations.
        </p>
      </div>

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="bg-muted/60 border p-1 rounded-2xl grid grid-cols-2 max-w-md">
          <TabsTrigger
            value="personal"
            className="rounded-xl font-bold text-xs gap-2 py-2 data-[state=active]:bg-card data-[state=active]:shadow-sm"
          >
            <User className="h-4 w-4" /> Personal Profile
          </TabsTrigger>
          <TabsTrigger
            value="general"
            className="rounded-xl font-bold text-xs gap-2 py-2 data-[state=active]:bg-card data-[state=active]:shadow-sm"
          >
            <Sliders className="h-4 w-4" /> General Configuration
          </TabsTrigger>
        </TabsList>

        {/* ========================================================= */}
        {/* TAB 1: PERSONAL TAB (PROFILE & CREDENTIALS)               */}
        {/* ========================================================= */}
        <TabsContent value="personal" className="space-y-6 mt-0">
          {/* Profile Overview & Name Edit */}
          <Card className="rounded-3xl border-2 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Personal Information
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-0.5">
                    Update your display name and review your administrative permissions.
                  </CardDescription>
                </div>
                <Badge
                  variant={isSuperAdmin ? "default" : "secondary"}
                  className="font-bold text-xs px-3 py-1"
                >
                  {isSuperAdmin ? "🔐 Super Administrator" : "👤 Staff Administrator"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="admin-fullname" className="text-xs font-bold">
                      Full Name
                    </Label>
                    <Input
                      id="admin-fullname"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Dr. Ngozi Eze"
                      className="h-10 text-sm bg-background border-2 rounded-xl"
                    />
                  </div>

                  {/* Email (Read-Only) */}
                  <div className="space-y-2">
                    <Label htmlFor="admin-email" className="text-xs font-bold flex items-center justify-between">
                      <span>Email Address</span>
                      <span className="text-[10px] text-muted-foreground font-normal">Primary Login</span>
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="admin-email"
                        value={user?.email || ""}
                        disabled
                        className="h-10 pl-9 text-sm bg-muted/60 border-2 rounded-xl text-muted-foreground cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* Role Permissions Summary Box */}
                <div className="p-4 rounded-2xl bg-muted/40 border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">Assigned Console Access:</span>
                    <span className="text-[11px] text-muted-foreground">
                      {isSuperAdmin ? "Full Administrative Control" : "Custom Delegated Modules"}
                    </span>
                  </div>
                  {isSuperAdmin ? (
                    <p className="text-xs text-primary font-medium flex items-center gap-1.5">
                      <Shield size={14} /> Unrestricted access to all console settings, user management, and audit logs.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {admin?.permissions?.canManageQuestions && (
                        <Badge variant="outline" className="text-[10px] bg-background">
                          📚 Question Bank & Passages
                        </Badge>
                      )}
                      {admin?.permissions?.canManageFlags && (
                        <Badge variant="outline" className="text-[10px] bg-background">
                          🚩 Flag Reports
                        </Badge>
                      )}
                      {admin?.permissions?.canManageCompetitions && (
                        <Badge variant="outline" className="text-[10px] bg-background">
                          🏆 Competitions
                        </Badge>
                      )}
                      {admin?.permissions?.canViewAnalytics && (
                        <Badge variant="outline" className="text-[10px] bg-background">
                          📊 Analytics & Reports
                        </Badge>
                      )}
                      {admin?.permissions?.canManageUsers && (
                        <Badge variant="outline" className="text-[10px] bg-background">
                          👥 Platform Users
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    variant="hero"
                    disabled={updatingProfile || !fullName.trim()}
                    className="font-bold text-xs rounded-xl h-10 px-5 gap-1.5"
                  >
                    {updatingProfile && <Loader2 className="h-4 w-4 animate-spin" />}
                    <Save size={14} /> Save Profile Information
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Change Password Card */}
          <Card className="rounded-3xl border-2 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4 border-b">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Change Password
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-0.5">
                Ensure your administrator account uses a strong, complex password.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSavePassword} className="space-y-4 max-w-xl">
                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="new-admin-password" className="text-xs font-bold">
                    New Password
                  </Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="new-admin-password"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="h-10 pl-9 pr-10 text-sm bg-background border-2 rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirm-admin-password" className="text-xs font-bold">
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm-admin-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="h-10 pl-9 pr-10 text-sm bg-background border-2 rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Live Password Strength Checklist */}
                {newPassword.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-muted/40 border space-y-2 animate-fade-in text-xs">
                    <p className="font-bold text-foreground">Password Security Requirements:</p>
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

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="hero"
                    disabled={updatingPassword || !isPasswordValid}
                    className="font-bold text-xs rounded-xl h-10 px-5 gap-1.5"
                  >
                    {updatingPassword && <Loader2 className="h-4 w-4 animate-spin" />}
                    <KeyRound size={14} /> Update Password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================= */}
        {/* TAB 2: GENERAL CONFIGURATION                             */}
        {/* ========================================================= */}
        <TabsContent value="general" className="space-y-6 mt-0">
          <Card className="rounded-3xl border-2 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4 border-b">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Sliders className="h-5 w-5 text-primary" />
                General Configuration
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-0.5">
                Control core system behaviors, public announcements, and platform maintenance mode.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {loadingSettings ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : settings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No system settings found.
                </p>
              ) : (
                <div className="space-y-6">
                  {settings.map((setting) => (
                    <div
                      key={setting.key}
                      className="flex flex-col space-y-2 p-4 rounded-2xl bg-card border-2"
                    >
                      <div className="flex items-center justify-between">
                        <Label htmlFor={setting.key} className="text-sm font-bold text-foreground">
                          {setting.key
                            .split("_")
                            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                            .join(" ")}
                        </Label>
                        {typeof setting.value === "boolean" && (
                          <Switch
                            id={setting.key}
                            checked={setting.value}
                            onCheckedChange={(checked) =>
                              handleSettingChange(setting.key, checked)
                            }
                          />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {setting.description}
                      </p>

                      {typeof setting.value !== "boolean" && (
                        <Input
                          id={setting.key}
                          value={setting.value || ""}
                          onChange={(e) =>
                            handleSettingChange(setting.key, e.target.value)
                          }
                          className="h-10 text-sm bg-background border-2 rounded-xl max-w-md mt-1"
                        />
                      )}
                    </div>
                  ))}

                  <div className="pt-2 flex justify-end">
                    <Button
                      onClick={handleSaveGeneralSettings}
                      disabled={savingSettings}
                      variant="hero"
                      className="font-bold text-xs rounded-xl h-10 px-5 gap-1.5"
                    >
                      {savingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Save size={14} /> Save System Settings
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

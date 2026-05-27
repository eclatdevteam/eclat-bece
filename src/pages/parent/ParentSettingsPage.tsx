import { useState, useEffect } from "react";
import { User as UserIcon, Lock, Settings, Copy, Check, Users, Bell, Loader2, Upload, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { useSearchParams } from "react-router-dom";

const profileSchema = z.object({
  displayName: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
});

interface LinkedChild {
  id: string;
  class_year: string;
  is_premium: boolean;
  profile: {
    full_name: string | null;
    unique_id: string;
    username: string | null;
  } | null;
}

export default function ParentSettingsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabQuery = searchParams.get("tab") || "profile";
  const [activeTab, setActiveTab] = useState(tabQuery);

  useEffect(() => {
    const currentTab = searchParams.get("tab");
    if (currentTab && (currentTab === "profile" || currentTab === "security" || currentTab === "preferences")) {
      setActiveTab(currentTab);
    }
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };
  
  // Loading states
  const [profileLoading, setProfileLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Profile fields
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uniqueId, setUniqueId] = useState("");
  const [parentId, setParentId] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ displayName?: string }>({});

  // Password fields
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Preference & Child fields
  const [children, setChildren] = useState<LinkedChild[]>([]);
  const [copied, setCopied] = useState(false);
  const [preferences, setPreferences] = useState({
    emailWeeklyDigest: true,
    activityAlerts: true,
    marketingUpdates: false
  });

  useEffect(() => {
    if (user) {
      loadParentData();
    }
  }, [user]);

  const loadParentData = async () => {
    if (!user) return;
    setProfileLoading(true);
    try {
      // 1. Fetch Profile Data
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("display_name, full_name, email, avatar_url, unique_id")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      setDisplayName(profile.full_name || profile.display_name || "");
      setEmail(profile.email || "");
      setAvatarUrl(profile.avatar_url || "");
      setUniqueId(profile.unique_id || "");

      // 2. Fetch Parent and Children Data
      const { data: parent, error: parentError } = await supabase
        .from("parents")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (parentError) throw parentError;
      setParentId(parent.id);

      // Fetch linked children
      const { data: students, error: studentsError } = await supabase
        .from("students")
        .select(`
          id,
          class_year,
          is_premium,
          profile:profiles(
            full_name,
            unique_id,
            username
          )
        `)
        .eq("parent_id", parent.id);

      if (studentsError) throw studentsError;
      
      // Map to correct types
      if (students) {
        setChildren(students as unknown as LinkedChild[]);
      }

    } catch (error: any) {
      console.error("Error loading parent data:", error);
      toast.error("Failed to load settings data");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !event.target.files || event.target.files.length === 0) return;
    const file = event.target.files[0];

    // File validation
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("File must be an image");
      return;
    }

    setUploadingAvatar(true);
    try {
      // Remove old avatar path if exists
      if (avatarUrl) {
        const oldFileName = avatarUrl.split("/").pop();
        if (oldFileName) {
          await supabase.storage
            .from("avatars")
            .remove([`${user.id}/${oldFileName}`]);
        }
      }

      // Upload new avatar file
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}.${ext}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Update profile avatar url
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast.success("Profile avatar updated successfully!");
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to upload avatar image");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user || !avatarUrl) return;
    setUploadingAvatar(true);
    try {
      const fileName = avatarUrl.split("/").pop();
      if (fileName) {
        await supabase.storage
          .from("avatars")
          .remove([`${user.id}/${fileName}`]);
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setAvatarUrl("");
      toast.success("Avatar image removed");
    } catch (error: any) {
      console.error("Error removing avatar:", error);
      toast.error("Failed to remove avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate inputs using Zod
    const validation = profileSchema.safeParse({ displayName });
    if (!validation.success) {
      const fieldErrors: { displayName?: string } = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0] === "displayName") fieldErrors.displayName = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setSavingProfile(true);

    try {
      // 1. Update Profile Display Name and Full Name in db
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ 
          display_name: displayName,
          full_name: displayName
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      toast.success("Profile updated successfully!");
    } catch (error: any) {
      console.error("Error saving profile details:", error);
      toast.error(error.message || "Failed to update profile details");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      toast.success("Password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast.error(error.message || "Failed to change password");
    } finally {
      setSavingPassword(false);
    }
  };

  const copyConnectionCode = () => {
    navigator.clipboard.writeText(uniqueId);
    setCopied(true);
    toast.success("Connection code copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const classLabel = (cy: string) =>
    cy === "year_6" ? "Year 6" : cy === "year_9" ? "Year 9" : cy;

  if (profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium animate-pulse">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-10 animate-fade-in max-w-4xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col gap-1 pb-2 border-b border-border/40">
        <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider text-xs">
          <Settings className="h-4 w-4" />
          <span>Parent Portal Settings</span>
        </div>
        <h1 className="text-4xl font-black tracking-tight text-foreground">
          My <span className="text-primary italic">Settings</span>.
        </h1>
        <p className="text-muted-foreground font-medium">
          Manage your personal details, secure your account, and configure dashboard preferences.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="bg-muted/20 p-1.5 rounded-[1.25rem] flex flex-row flex-nowrap overflow-x-auto no-scrollbar w-full sm:w-fit gap-1.5 border border-border/30 h-auto shrink-0">
          <TabsTrigger 
            value="profile" 
            className="rounded-xl font-bold py-2.5 px-5 flex-1 sm:flex-initial whitespace-nowrap transition-all duration-200 data-[state=active]:!bg-gradient-to-r data-[state=active]:!from-primary data-[state=active]:!to-primary-glow data-[state=active]:!text-primary-foreground data-[state=active]:!shadow-md data-[state=active]:!shadow-primary/20 text-muted-foreground hover:text-foreground hover:bg-muted/10 flex items-center justify-center shrink-0 focus-visible:!ring-0 focus-visible:!ring-offset-0 focus:!outline-none"
          >
            <UserIcon className="h-4 w-4 mr-2 shrink-0" />
            Profile
          </TabsTrigger>
          <TabsTrigger 
            value="security" 
            className="rounded-xl font-bold py-2.5 px-5 flex-1 sm:flex-initial whitespace-nowrap transition-all duration-200 data-[state=active]:!bg-gradient-to-r data-[state=active]:!from-primary data-[state=active]:!to-primary-glow data-[state=active]:!text-primary-foreground data-[state=active]:!shadow-md data-[state=active]:!shadow-primary/20 text-muted-foreground hover:text-foreground hover:bg-muted/10 flex items-center justify-center shrink-0 focus-visible:!ring-0 focus-visible:!ring-offset-0 focus:!outline-none"
          >
            <Lock className="h-4 w-4 mr-2 shrink-0" />
            Security
          </TabsTrigger>
          <TabsTrigger 
            value="preferences" 
            className="rounded-xl font-bold py-2.5 px-5 flex-1 sm:flex-initial whitespace-nowrap transition-all duration-200 data-[state=active]:!bg-gradient-to-r data-[state=active]:!from-primary data-[state=active]:!to-primary-glow data-[state=active]:!text-primary-foreground data-[state=active]:!shadow-md data-[state=active]:!shadow-primary/20 text-muted-foreground hover:text-foreground hover:bg-muted/10 flex items-center justify-center shrink-0 focus-visible:!ring-0 focus-visible:!ring-offset-0 focus:!outline-none"
          >
            <Users className="h-4 w-4 mr-2 shrink-0" />
            Children & Preferences
          </TabsTrigger>
        </TabsList>

        {/* Profile Details Tab Content */}
        <TabsContent value="profile" className="space-y-6 animate-in fade-in-50 duration-300">
          <Card className="rounded-[2rem] border border-border/40 overflow-hidden shadow-sm bg-background/30 backdrop-blur-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-black text-foreground">Profile Details</CardTitle>
              <CardDescription className="font-medium">
                Update your display name, profile avatar, and email settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Avatar Section */}
              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-3xl bg-muted/20 border border-border/30">
                <Avatar className="h-24 w-24 border-2 border-primary/20 shadow-md">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback className="bg-primary/5 text-primary text-3xl font-black">
                    {displayName ? displayName.substring(0, 2).toUpperCase() : <UserIcon className="h-10 w-10 text-muted-foreground" />}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex flex-col gap-2.5 items-center sm:items-start">
                  <h4 className="font-bold text-sm text-foreground uppercase tracking-wider">Profile Avatar Image</h4>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl font-bold border-2 h-9"
                      onClick={() => document.getElementById("avatar-input")?.click()}
                      disabled={uploadingAvatar}
                    >
                      {uploadingAvatar ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload New File
                        </>
                      )}
                    </Button>
                    <input
                      id="avatar-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />

                    {avatarUrl && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="rounded-xl font-bold h-9"
                        onClick={handleRemoveAvatar}
                        disabled={uploadingAvatar}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">
                    Supports JPG, PNG, GIF. Max file size: 5MB.
                  </p>
                </div>
              </div>

              {/* Personal Details Form */}
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="displayName" className="font-bold text-sm text-foreground">Full Name</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your full name"
                    className="rounded-xl border-2 h-11 font-medium bg-background focus-visible:ring-primary"
                    maxLength={100}
                  />
                  {errors.displayName && (
                    <p className="text-xs font-semibold text-destructive">{errors.displayName}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email" className="font-bold text-sm text-foreground">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="rounded-xl border-2 h-11 font-medium bg-muted focus-visible:ring-0 cursor-not-allowed opacity-80"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={savingProfile}
                  className="rounded-xl font-black h-11 px-6 shadow-md shadow-primary/10 mt-2"
                >
                  {savingProfile ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving Changes...
                    </>
                  ) : (
                    "Save Profile Details"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab Content */}
        <TabsContent value="security" className="space-y-6 animate-in fade-in-50 duration-300">
          <Card className="rounded-[2rem] border border-border/40 overflow-hidden shadow-sm bg-background/30 backdrop-blur-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-black text-foreground">Change Password</CardTitle>
              <CardDescription className="font-medium">
                Ensure your account is protected by setting a strong password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSavePassword} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="new-password" className="font-bold text-sm text-foreground">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="rounded-xl border-2 h-11 font-medium bg-background"
                    required
                    minLength={6}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="confirm-password" className="font-bold text-sm text-foreground">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your new password"
                    className="rounded-xl border-2 h-11 font-medium bg-background"
                    required
                    minLength={6}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={savingPassword}
                  className="rounded-xl font-black h-11 px-6 shadow-md shadow-primary/10 mt-2"
                >
                  {savingPassword ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Children & Preferences Tab Content */}
        <TabsContent value="preferences" className="space-y-6 animate-in fade-in-50 duration-300">
          {/* Connection Code Box */}
          <Card className="rounded-[2rem] border border-primary/20 bg-primary/5 overflow-hidden shadow-sm relative backdrop-blur-md">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-8 translate-x-8" />
            <CardHeader className="pb-3">
              <CardTitle className="text-2xl font-black text-primary">Your Connection Code</CardTitle>
              <CardDescription className="font-medium">
                Your children can use this code during registration or from their profile settings to connect to your parent portal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <div className="flex max-w-sm gap-2">
                <div className="flex-1 flex items-center justify-center h-12 bg-background border-2 border-primary/20 rounded-xl px-4 select-all">
                  <span className="font-mono text-xl font-black tracking-widest text-primary">{uniqueId}</span>
                </div>
                <Button
                  onClick={copyConnectionCode}
                  variant="outline"
                  className="rounded-xl border-2 font-bold h-12 w-12 p-0 flex items-center justify-center shrink-0 hover:bg-muted"
                >
                  {copied ? <Check className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5 text-muted-foreground" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Linked Children */}
          <Card className="rounded-[2rem] border border-border/40 overflow-hidden shadow-sm bg-background/30 backdrop-blur-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-black text-foreground">Linked Children</CardTitle>
              <CardDescription className="font-medium">
                Children currently linked to your parent portal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {children.length === 0 ? (
                <div className="p-8 text-center bg-muted/20 border border-dashed rounded-3xl text-muted-foreground font-medium">
                  No children linked yet. Share your connection code to link their account.
                </div>
              ) : (
                <div className="space-y-3">
                  {children.map((child) => {
                    const initials = child.profile?.full_name?.charAt(0).toUpperCase() || "?";
                    return (
                      <div
                        key={child.id}
                        className="flex items-center gap-4 p-4 rounded-2xl border border-border/40 bg-background/50 hover:bg-muted/10 transition-colors"
                      >
                        <Avatar className={`h-11 w-11 font-black shrink-0 ${child.is_premium ? "bg-gradient-to-br from-amber-400 to-amber-600" : "bg-gradient-to-br from-primary to-primary/80"}`}>
                          <AvatarFallback className="text-white text-base font-black">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-foreground truncate">{child.profile?.full_name || "Unknown Name"}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-black text-primary uppercase">
                              {classLabel(child.class_year)}
                            </span>
                            <span className="text-xs text-muted-foreground">·</span>
                            <span className="text-xs text-muted-foreground font-medium">
                              @{child.profile?.username || "no-username"}
                            </span>
                          </div>
                        </div>
                        {child.is_premium ? (
                          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 uppercase font-black text-[10px]">
                            Premium
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground uppercase font-black text-[10px]">Standard</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card className="rounded-[2rem] border border-border/40 overflow-hidden shadow-sm bg-background/30 backdrop-blur-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-black text-foreground">Notification Preferences</CardTitle>
              <CardDescription className="font-medium">
                Choose how you want to be updated about your child's progress.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/10 border border-border/30">
                <div className="space-y-0.5 pr-4">
                  <p className="font-bold text-sm text-foreground">Weekly Digest Email</p>
                  <p className="text-xs text-muted-foreground font-medium">Receive a weekly summary email detailing your child's score improvements and completed assignments.</p>
                </div>
                <Switch
                  checked={preferences.emailWeeklyDigest}
                  onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, emailWeeklyDigest: checked }))}
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/10 border border-border/30">
                <div className="space-y-0.5 pr-4">
                  <p className="font-bold text-sm text-foreground">Real-time Activity Alerts</p>
                  <p className="text-xs text-muted-foreground font-medium">Get notifications immediately when your child finishes a practice quiz or receives an assignment.</p>
                </div>
                <Switch
                  checked={preferences.activityAlerts}
                  onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, activityAlerts: checked }))}
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/10 border border-border/30">
                <div className="space-y-0.5 pr-4">
                  <p className="font-bold text-sm text-foreground">Educational & Marketing News</p>
                  <p className="text-xs text-muted-foreground font-medium">Receive occasional emails with resources, tips, and new product updates.</p>
                </div>
                <Switch
                  checked={preferences.marketingUpdates}
                  onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, marketingUpdates: checked }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

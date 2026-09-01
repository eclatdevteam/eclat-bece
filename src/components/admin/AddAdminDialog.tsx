import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Loader2, 
  Plus, 
  Mail, 
  UserPlus, 
  Shield, 
  Eye, 
  EyeOff, 
  Sparkles,
  KeyRound,
  CheckCircle2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { InviteSuccessDialog } from "./InviteSuccessDialog";

const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  isSuperAdmin: z.boolean().default(false),
  canManageQuestions: z.boolean().default(true),
  canManageFlags: z.boolean().default(false),
  canManageCompetitions: z.boolean().default(true),
  canManageUsers: z.boolean().default(false),
  canViewAnalytics: z.boolean().default(true),
});

const directSchema = z.object({
  email: z.string().email("Invalid email address"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  isSuperAdmin: z.boolean().default(false),
  canManageQuestions: z.boolean().default(true),
  canManageFlags: z.boolean().default(false),
  canManageCompetitions: z.boolean().default(true),
  canManageUsers: z.boolean().default(false),
  canViewAnalytics: z.boolean().default(true),
});

interface AddAdminDialogProps {
  onSuccess: () => void;
}

export function AddAdminDialog({ onSuccess }: AddAdminDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [inviteSuccessOpen, setInviteSuccessOpen] = useState(false);
  const [createdInvitee, setCreatedInvitee] = useState<{
    email: string;
    fullName: string;
    isSuperAdmin: boolean;
    token: string;
    emailSent: boolean;
  } | null>(null);

  const { user } = useAuth();

  const inviteForm = useForm<z.infer<typeof inviteSchema>>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      fullName: "",
      isSuperAdmin: false,
      canManageQuestions: true,
      canManageFlags: false,
      canManageCompetitions: true,
      canManageUsers: false,
      canViewAnalytics: true,
    },
  });

  const directForm = useForm<z.infer<typeof directSchema>>({
    resolver: zodResolver(directSchema),
    defaultValues: {
      email: "",
      fullName: "",
      password: "",
      isSuperAdmin: false,
      canManageQuestions: true,
      canManageFlags: false,
      canManageCompetitions: true,
      canManageUsers: false,
      canViewAnalytics: true,
    },
  });

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
    let pwd = "";
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    directForm.setValue("password", pwd);
  };

  const handleInviteSubmit = async (values: z.infer<typeof inviteSchema>) => {
    if (!user) return;
    setLoading(true);

    try {
      // 1. Check if email already registered
      const { data: existingProfile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", values.email)
        .maybeSingle();

      if (profileError) throw profileError;

      if (existingProfile) {
        toast.error("This email is already registered in the platform.");
        setLoading(false);
        return;
      }

      // 2. Check for active pending invitation
      const { data: existingInvitation } = await supabase
        .from("admin_invitations" as any)
        .select("id, status, expires_at")
        .eq("target_email", values.email)
        .eq("status", "pending")
        .maybeSingle();

      if (existingInvitation) {
        const expiresAt = new Date(existingInvitation.expires_at);
        if (expiresAt > new Date()) {
          toast.error("An active invitation is already pending for this email.");
          setLoading(false);
          return;
        }
      }

      // 3. Generate invitation token
      const { data: tokenData, error: tokenError } = await supabase
        .rpc("generate_invitation_token" as any);

      if (tokenError) throw tokenError;
      const token = tokenData as string;

      // 4. Create invitation record
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const permissions = values.isSuperAdmin 
        ? { canManageUsers: true, canViewAnalytics: true, canManageQuestions: true, canManageFlags: true, canManageCompetitions: true }
        : { 
            canManageUsers: values.canManageUsers, 
            canViewAnalytics: values.canViewAnalytics, 
            canManageQuestions: values.canManageQuestions, 
            canManageFlags: values.canManageFlags,
            canManageCompetitions: values.canManageCompetitions 
          };

      const { data: adminIdData } = await supabase.rpc("get_admin_id", { _user_id: user.id });

      const { data: insertedInvite, error: invitationError } = await supabase
        .from("admin_invitations" as any)
        .insert({
          target_email: values.email,
          invited_by: adminIdData,
          token: token,
          full_name: values.fullName,
          is_super_admin: values.isSuperAdmin,
          permissions: permissions,
          expires_at: expiresAt.toISOString(),
        })
        .select("id")
        .single();

      if (invitationError) throw invitationError;

      // 5. Send invitation email via Edge Function with dynamic origin
      let emailDispatched = false;
      try {
        if (insertedInvite?.id) {
          const { error: emailError } = await supabase.functions.invoke("send-admin-invitation", {
            body: { 
              invitationId: insertedInvite.id,
              siteUrl: window.location.origin 
            }
          });

          if (!emailError) {
            emailDispatched = true;
          } else {
            console.warn("Email dispatch error:", emailError);
          }
        }
      } catch (err) {
        console.warn("Could not dispatch invitation email:", err);
      }

      // 6. Log audit action
      try {
        await supabase.rpc("log_admin_action", {
          _admin_id: adminIdData,
          _action: "create_admin_invitation",
          _resource_type: "admin_invitation",
          _resource_id: insertedInvite?.id || null,
          _details: {
            target_user_email: values.email,
            target_full_name: values.fullName,
            is_super_admin: values.isSuperAdmin,
            permissions: permissions,
            email_sent: emailDispatched,
          }
        });
      } catch (auditErr) {
        console.warn("Could not log admin invitation audit:", auditErr);
      }

      setCreatedInvitee({
        email: values.email,
        fullName: values.fullName,
        isSuperAdmin: values.isSuperAdmin,
        token: token,
        emailSent: emailDispatched,
      });

      setOpen(false);
      setInviteSuccessOpen(true);
      inviteForm.reset();
      onSuccess();
    } catch (error: any) {
      console.error("Error creating invitation:", error);
      toast.error(error.message || "Failed to create invitation");
    } finally {
      setLoading(false);
    }
  };

  const handleDirectSubmit = async (values: z.infer<typeof directSchema>) => {
    setLoading(true);
    try {
      const permissions = values.isSuperAdmin 
        ? { canManageUsers: true, canViewAnalytics: true, canManageQuestions: true, canManageFlags: true, canManageCompetitions: true }
        : { 
            canManageUsers: values.canManageUsers, 
            canViewAnalytics: values.canViewAnalytics, 
            canManageQuestions: values.canManageQuestions, 
            canManageFlags: values.canManageFlags,
            canManageCompetitions: values.canManageCompetitions 
          };

      const { data, error } = await supabase.functions.invoke("create-admin-user", {
        body: {
          directCreation: true,
          email: values.email,
          fullName: values.fullName,
          password: values.password,
          isSuperAdmin: values.isSuperAdmin,
          permissions: permissions,
        }
      });

      if (error) {
        throw new Error(error.message || "Failed to provision admin account");
      }

      const result = data as any;
      if (!result.success) {
        throw new Error(result.error || "Failed to provision admin account");
      }

      toast.success(`Admin user ${values.fullName} created successfully!`);
      setOpen(false);
      directForm.reset();
      onSuccess();
    } catch (error: any) {
      console.error("Direct admin creation error:", error);
      toast.error(error.message || "Failed to directly create admin");
    } finally {
      setLoading(false);
    }
  };

  const isSuperAdminValue = inviteForm.watch("isSuperAdmin");
  const directIsSuperAdminValue = directForm.watch("isSuperAdmin");

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="hero" className="font-bold text-xs gap-1.5 h-10 rounded-xl shadow-md">
            <Plus className="h-4 w-4" />
            Add Administrator
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[500px] rounded-3xl border-2 p-6 sm:p-7">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-foreground">
              Add Administrator
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
              Provision an in-house administrator or send a 24-hour setup invitation.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="invite" className="w-full mt-2">
            <TabsList className="grid grid-cols-2 w-full mb-4 rounded-xl p-1 bg-muted/60 border">
              <TabsTrigger value="invite" className="rounded-lg text-xs font-bold gap-1.5 py-2">
                <Mail size={14} /> Send Invitation
              </TabsTrigger>
              <TabsTrigger value="direct" className="rounded-lg text-xs font-bold gap-1.5 py-2">
                <UserPlus size={14} /> Direct Setup
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: EMAIL INVITATION */}
            <TabsContent value="invite" className="mt-0 space-y-4">
              <Form {...inviteForm}>
                <form onSubmit={inviteForm.handleSubmit(handleInviteSubmit)} className="space-y-4">
                  <FormField
                    control={inviteForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-bold text-foreground">Full Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g. Dr. Ngozi Eze" 
                            className="h-10 text-sm bg-background border-2 rounded-xl"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={inviteForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-bold text-foreground">Email Address</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="colleague@eclat.com" 
                            className="h-10 text-sm bg-background border-2 rounded-xl"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Super Admin Toggle */}
                  <FormField
                    control={inviteForm.control}
                    name="isSuperAdmin"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-2xl border-2 p-3.5 bg-card">
                        <div className="space-y-0.5 pr-2">
                          <FormLabel className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Shield size={14} className="text-primary" /> Super Administrator
                          </FormLabel>
                          <FormDescription className="text-[11px] text-muted-foreground">
                            Full access to all platform tools and administrator management.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Granular Permissions if not Super Admin */}
                  {!isSuperAdminValue && (
                    <div className="p-3.5 rounded-2xl bg-muted/40 border space-y-2.5">
                      <p className="text-xs font-bold text-foreground">Assigned Permissions</p>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <FormField
                          control={inviteForm.control}
                          name="canManageQuestions"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                              <FormLabel className="text-xs font-medium text-foreground cursor-pointer">
                                Question Bank & Passages
                              </FormLabel>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={inviteForm.control}
                          name="canManageFlags"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                              <FormLabel className="text-xs font-medium text-foreground cursor-pointer">
                                Flag Reports
                              </FormLabel>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={inviteForm.control}
                          name="canManageCompetitions"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                              <FormLabel className="text-xs font-medium text-foreground cursor-pointer">
                                Competitions
                              </FormLabel>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={inviteForm.control}
                          name="canViewAnalytics"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                              <FormLabel className="text-xs font-medium text-foreground cursor-pointer">
                                Analytics & Reports
                              </FormLabel>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={inviteForm.control}
                          name="canManageUsers"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                              <FormLabel className="text-xs font-medium text-foreground cursor-pointer">
                                Platform Users
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}

                  <DialogFooter className="pt-2">
                    <Button 
                      type="submit" 
                      variant="hero" 
                      disabled={loading}
                      className="w-full sm:w-auto text-xs font-bold rounded-xl h-10 px-5"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating Invitation...
                        </>
                      ) : (
                        <>
                          Send Invitation Link
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </TabsContent>

            {/* TAB 2: DIRECT PROVISIONING */}
            <TabsContent value="direct" className="mt-0 space-y-4">
              <Form {...directForm}>
                <form onSubmit={directForm.handleSubmit(handleDirectSubmit)} className="space-y-4">
                  <FormField
                    control={directForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-bold text-foreground">Full Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g. John Administrator" 
                            className="h-10 text-sm bg-background border-2 rounded-xl"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={directForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-bold text-foreground">Admin Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="admin@eclat.com" 
                            className="h-10 text-sm bg-background border-2 rounded-xl"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={directForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-xs font-bold text-foreground">Initial Password</FormLabel>
                          <button
                            type="button"
                            onClick={generateRandomPassword}
                            className="text-xs text-primary font-bold hover:underline inline-flex items-center gap-1"
                          >
                            <KeyRound size={12} /> Auto-Generate
                          </button>
                        </div>
                        <div className="relative">
                          <FormControl>
                            <Input 
                              type={showPassword ? "text" : "password"} 
                              placeholder="••••••••" 
                              className="h-10 text-sm bg-background border-2 rounded-xl pr-10"
                              {...field} 
                            />
                          </FormControl>
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Super Admin Toggle */}
                  <FormField
                    control={directForm.control}
                    name="isSuperAdmin"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-2xl border-2 p-3.5 bg-card">
                        <div className="space-y-0.5 pr-2">
                          <FormLabel className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Shield size={14} className="text-primary" /> Super Administrator
                          </FormLabel>
                          <FormDescription className="text-[11px] text-muted-foreground">
                            Grant uninhibited administrative control.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Granular Permissions for Direct */}
                  {!directIsSuperAdminValue && (
                    <div className="p-3.5 rounded-2xl bg-muted/40 border space-y-2.5">
                      <p className="text-xs font-bold text-foreground">Assigned Permissions</p>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <FormField
                          control={directForm.control}
                          name="canManageQuestions"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                              <FormLabel className="text-xs font-medium text-foreground cursor-pointer">
                                Question Bank & Passages
                              </FormLabel>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={directForm.control}
                          name="canManageFlags"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                              <FormLabel className="text-xs font-medium text-foreground cursor-pointer">
                                Flag Reports
                              </FormLabel>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={directForm.control}
                          name="canManageCompetitions"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                              <FormLabel className="text-xs font-medium text-foreground cursor-pointer">
                                Competitions
                              </FormLabel>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={directForm.control}
                          name="canViewAnalytics"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                              <FormLabel className="text-xs font-medium text-foreground cursor-pointer">
                                Analytics & Reports
                              </FormLabel>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={directForm.control}
                          name="canManageUsers"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                              <FormLabel className="text-xs font-medium text-foreground cursor-pointer">
                                Platform Users
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}

                  <DialogFooter className="pt-2">
                    <Button 
                      type="submit" 
                      variant="hero" 
                      disabled={loading}
                      className="w-full sm:w-auto text-xs font-bold rounded-xl h-10 px-5"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        <>
                          Create Admin Instantly
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Post-Invite Modal */}
      <InviteSuccessDialog
        open={inviteSuccessOpen}
        onOpenChange={setInviteSuccessOpen}
        invitee={createdInvitee}
      />
    </>
  );
}
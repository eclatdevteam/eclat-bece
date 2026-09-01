import { useState, useEffect } from "react";
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
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, UserCog, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const editRoleSchema = z.object({
  isSuperAdmin: z.boolean().default(false),
  canManageQuestions: z.boolean().default(true),
  canManageFlags: z.boolean().default(false),
  canManageCompetitions: z.boolean().default(true),
  canManageUsers: z.boolean().default(false),
  canViewAnalytics: z.boolean().default(true),
});

interface AdminUser {
  id: string;
  user_id: string;
  full_name: string;
  is_super_admin: boolean;
  permissions?: Record<string, boolean>;
  is_active: boolean;
  profiles?: {
    email: string;
  };
}

interface EditAdminRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admin: AdminUser | null;
  onSuccess: () => void;
}

export function EditAdminRoleDialog({
  open,
  onOpenChange,
  admin,
  onSuccess,
}: EditAdminRoleDialogProps) {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const form = useForm<z.infer<typeof editRoleSchema>>({
    resolver: zodResolver(editRoleSchema),
    defaultValues: {
      isSuperAdmin: false,
      canManageQuestions: true,
      canManageFlags: false,
      canManageCompetitions: true,
      canManageUsers: false,
      canViewAnalytics: true,
    },
  });

  useEffect(() => {
    if (admin) {
      const perms = admin.permissions || {};
      form.reset({
        isSuperAdmin: !!admin.is_super_admin,
        canManageQuestions: perms.canManageQuestions !== false,
        canManageFlags: !!perms.canManageFlags,
        canManageCompetitions: perms.canManageCompetitions !== false,
        canManageUsers: !!perms.canManageUsers,
        canViewAnalytics: perms.canViewAnalytics !== false,
      });
    }
  }, [admin, form]);

  const isSuperAdminValue = form.watch("isSuperAdmin");

  const onSubmit = async (values: z.infer<typeof editRoleSchema>) => {
    if (!admin || !user) return;
    setLoading(true);

    try {
      const updatedPermissions = values.isSuperAdmin
        ? {
            canManageUsers: true,
            canViewAnalytics: true,
            canManageQuestions: true,
            canManageFlags: true,
            canManageCompetitions: true,
          }
        : {
            canManageUsers: values.canManageUsers,
            canViewAnalytics: values.canViewAnalytics,
            canManageQuestions: values.canManageQuestions,
            canManageFlags: values.canManageFlags,
            canManageCompetitions: values.canManageCompetitions,
          };

      // 1. Update admins table
      const { error: updateError } = await supabase
        .from("admins" as any)
        .update({
          is_super_admin: values.isSuperAdmin,
          permissions: updatedPermissions,
          updated_at: new Date().toISOString(),
        })
        .eq("id", admin.id);

      if (updateError) throw updateError;

      // 2. Audit log
      try {
        const { data: callerAdminId } = await supabase.rpc("get_admin_id", {
          _user_id: user.id,
        });

        await supabase.rpc("log_admin_action", {
          _admin_id: callerAdminId,
          _action: "update_admin_role_and_permissions",
          _resource_type: "admin",
          _resource_id: admin.id,
          _details: {
            target_admin_name: admin.full_name,
            target_admin_email: admin.profiles?.email,
            is_super_admin: values.isSuperAdmin,
            permissions: updatedPermissions,
          },
        });
      } catch (logErr) {
        console.error("Audit log error:", logErr);
      }

      toast.success(`Role & permissions for ${admin.full_name} updated successfully!`);
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      console.error("Error updating admin role:", err);
      toast.error(err.message || "Failed to update admin role");
    } finally {
      setLoading(false);
    }
  };

  if (!admin) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-3xl border-2 p-6 sm:p-7">
        <DialogHeader className="space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mb-1">
            <UserCog className="h-6 w-6" />
          </div>
          <DialogTitle className="text-2xl font-black text-foreground">
            Manage Admin Role
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
            Configure access privileges and role permissions for this administrator.
          </DialogDescription>
        </DialogHeader>

        {/* Admin Info Header Box */}
        <div className="p-3.5 rounded-2xl bg-muted/60 border border-border space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-semibold">Administrator:</span>
            <span className="font-bold text-foreground">{admin.full_name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-semibold">Email:</span>
            <span className="font-bold text-foreground">{admin.profiles?.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-semibold">Current Status:</span>
            <Badge
              variant={admin.is_active ? "outline" : "secondary"}
              className="text-[10px] font-bold"
            >
              {admin.is_active ? "Active" : "Deactivated"}
            </Badge>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 my-2">
            {/* Super Admin Switch */}
            <FormField
              control={form.control}
              name="isSuperAdmin"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-2xl border-2 p-3.5 bg-card">
                  <div className="space-y-0.5 pr-2">
                    <FormLabel className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Shield size={14} className="text-primary" /> Super Administrator
                    </FormLabel>
                    <FormDescription className="text-[11px] text-muted-foreground">
                      Grants full unrestricted access to all console areas and user management.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Granular Checkboxes when not Super Admin */}
            {!isSuperAdminValue ? (
              <div className="p-3.5 rounded-2xl bg-muted/40 border space-y-3">
                <p className="text-xs font-bold text-foreground">Granular Module Permissions</p>
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <FormField
                    control={form.control}
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
                    control={form.control}
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
                    control={form.control}
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
                    control={form.control}
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
                    control={form.control}
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
            ) : (
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary font-medium flex items-center gap-2">
                <CheckCircle2 size={15} className="flex-shrink-0" />
                <span>Super Administrators have full access across all platform modules.</span>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="text-xs font-bold rounded-xl h-10 px-4"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="hero"
                disabled={loading}
                className="text-xs font-bold rounded-xl h-10 px-5 gap-1.5"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  MoreHorizontal,
  Search,
  Shield,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
  Mail,
  Copy,
  Clock,
  RotateCcw,
  Users,
  Ban,
  Check,
  UserCog
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow } from "date-fns";
import { AddAdminDialog } from "@/components/admin/AddAdminDialog";
import { EditAdminRoleDialog } from "@/components/admin/EditAdminRoleDialog";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AdminUser {
  id: string;
  user_id: string;
  full_name: string;
  is_super_admin: boolean;
  permissions?: Record<string, boolean>;
  is_active: boolean;
  created_at: string;
  profiles?: {
    email: string;
  };
}

interface AdminInvitation {
  id: string;
  token: string;
  target_email: string;
  full_name: string;
  is_super_admin: boolean;
  permissions?: Record<string, boolean>;
  status: string;
  expires_at: string;
  created_at: string;
}

export default function AdminUsersPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [invitations, setInvitations] = useState<AdminInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUserIsSuperAdmin, setCurrentUserIsSuperAdmin] = useState(false);
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [revokeInviteId, setRevokeInviteId] = useState<string | null>(null);
  const [resendingInviteId, setResendingInviteId] = useState<string | null>(null);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    checkSuperAdminStatus();
    fetchAllData();
  }, [user]);

  const checkSuperAdminStatus = async () => {
    if (!user) return;
    const { data } = await supabase.rpc("is_super_admin", { _user_id: user.id });
    setCurrentUserIsSuperAdmin(!!data);

    const { data: adminData } = await supabase
      .from("admins")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (adminData) {
      setCurrentAdminId(adminData.id);
    }
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchAdmins(), fetchInvitations()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      const { data: adminsData, error: adminsError } = await supabase
        .from("admins" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (adminsError) throw adminsError;

      if (!adminsData || adminsData.length === 0) {
        setAdmins([]);
        return;
      }

      const userIds = adminsData.map((admin: any) => admin.user_id);
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", userIds);

      const mergedAdmins = adminsData.map((admin: any) => {
        const profile = profilesData?.find((p) => p.id === admin.user_id);
        return {
          ...admin,
          profiles: profile ? { email: profile.email } : { email: "Unknown" }
        };
      });

      setAdmins(mergedAdmins);
    } catch (error) {
      console.error("Error fetching admins:", error);
      toast.error("Failed to load admin users");
    }
  };

  const fetchInvitations = async () => {
    try {
      const { data: invitesData, error: invitesError } = await supabase
        .from("admin_invitations" as any)
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (invitesError) {
        console.warn("Could not fetch invitations:", invitesError);
        setInvitations([]);
        return;
      }

      setInvitations(invitesData || []);
    } catch (error) {
      console.error("Error fetching invitations:", error);
    }
  };

  const toggleAdminStatus = async (adminId: string, currentStatus: boolean) => {
    if (!user) return;

    try {
      const adminToUpdate = admins.find(a => a.id === adminId);

      const { error } = await supabase
        .from("admins" as any)
        .update({ is_active: !currentStatus })
        .eq("id", adminId);

      if (error) throw error;

      try {
        await supabase.rpc("log_admin_action", {
          _admin_id: currentAdminId,
          _action: currentStatus ? "deactivate_admin" : "reactivate_admin",
          _resource_type: "admin",
          _resource_id: adminId,
          _details: {
            admin_name: adminToUpdate?.full_name,
            admin_email: adminToUpdate?.profiles?.email,
            is_super_admin: adminToUpdate?.is_super_admin,
            new_status: currentStatus ? "inactive" : "active"
          }
        });
      } catch (logError) {
        console.error("Error logging status change:", logError);
      }

      toast.success(`Admin ${currentStatus ? "deactivated" : "activated"} successfully`);
      fetchAdmins();
    } catch (error) {
      console.error("Error updating admin status:", error);
      toast.error("Failed to update admin status");
    }
  };

  const handleDelete = async () => {
    if (!deleteId || !user) return;

    try {
      const adminToDelete = admins.find(a => a.id === deleteId);

      const { error } = await supabase
        .from("admins" as any)
        .delete()
        .eq("id", deleteId);

      if (error) throw error;

      // Remove admin role from user_roles table if user_id exists
      if (adminToDelete?.user_id) {
        await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", adminToDelete.user_id)
          .eq("role", "admin");
      }

      try {
        await supabase.rpc("log_admin_action", {
          _admin_id: currentAdminId,
          _action: "delete_admin",
          _resource_type: "admin",
          _resource_id: deleteId,
          _details: {
            admin_name: adminToDelete?.full_name,
            admin_email: adminToDelete?.profiles?.email,
          }
        });
      } catch (logError) {
        console.error("Error logging admin deletion:", logError);
      }

      toast.success("Admin removed successfully");
      setDeleteId(null);
      fetchAdmins();
    } catch (error) {
      console.error("Error deleting admin:", error);
      toast.error("Failed to delete admin");
    }
  };

  const handleCopyInviteLink = async (token: string) => {
    const link = `${window.location.origin}/admin/setup/${token}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Invitation link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    setResendingInviteId(invitationId);
    try {
      const { error } = await supabase.functions.invoke("send-admin-invitation", {
        body: { 
          invitationId,
          siteUrl: window.location.origin 
        }
      });

      if (error) throw error;
      toast.success("Invitation email resent successfully!");
    } catch (err: any) {
      console.error("Resend error:", err);
      toast.error(err.message || "Failed to resend email. You can copy the direct link instead.");
    } finally {
      setResendingInviteId(null);
    }
  };

  const handleRevokeInvitation = async () => {
    if (!revokeInviteId) return;

    try {
      const { error } = await supabase
        .from("admin_invitations" as any)
        .delete()
        .eq("id", revokeInviteId);

      if (error) throw error;

      toast.success("Invitation revoked successfully");
      setRevokeInviteId(null);
      fetchInvitations();
    } catch (err: any) {
      console.error("Revoke error:", err);
      toast.error(err.message || "Failed to revoke invitation");
    }
  };

  const filteredAdmins = admins.filter(admin =>
    admin.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    admin.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredInvitations = invitations.filter(inv =>
    inv.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.target_email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Admin Users</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage administrators, permissions, and pending invitations.
          </p>
        </div>
        {currentUserIsSuperAdmin && (
          <AddAdminDialog onSuccess={fetchAllData} />
        )}
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            className="pl-9 h-10 bg-background border-2 rounded-xl text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main Tabs Container */}
      <Tabs defaultValue="admins" className="w-full space-y-4">
        <TabsList className="rounded-xl p-1 bg-muted/60 border border-border/80">
          <TabsTrigger value="admins" className="rounded-lg text-xs font-bold gap-2 px-4 py-2">
            <Users size={14} />
            <span>Active Administrators</span>
            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 h-4">
              {admins.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="invitations" className="rounded-lg text-xs font-bold gap-2 px-4 py-2">
            <Mail size={14} />
            <span>Pending Invitations</span>
            {invitations.length > 0 && (
              <Badge variant="default" className="ml-1 text-[10px] px-1.5 py-0 h-4 bg-primary">
                {invitations.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: ACTIVE ADMINISTRATORS */}
        <TabsContent value="admins" className="mt-0">
          <div className="rounded-2xl border-2 border-border/80 bg-card overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="font-bold text-xs">Administrator</TableHead>
                  <TableHead className="font-bold text-xs">Role & Permissions</TableHead>
                  <TableHead className="font-bold text-xs">Status</TableHead>
                  <TableHead className="font-bold text-xs">Date Added</TableHead>
                  <TableHead className="text-right font-bold text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span>Loading administrators...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredAdmins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground text-sm">
                      No administrators found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAdmins.map((admin) => (
                    <TableRow key={admin.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div>
                          <div className="font-bold text-sm text-foreground flex items-center gap-2">
                            {admin.full_name}
                            {admin.user_id === user?.id && (
                              <Badge variant="outline" className="text-[10px] font-bold text-primary border-primary/30">
                                You
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {admin.profiles?.email}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {admin.is_super_admin ? (
                            <Badge className="bg-primary text-primary-foreground text-[10px] font-extrabold gap-1">
                              <Shield size={11} /> Super Admin
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px] font-bold">
                              Staff Admin
                            </Badge>
                          )}
                          
                          {/* Granular permission chips */}
                          {!admin.is_super_admin && admin.permissions && (
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              {admin.permissions.canManageQuestions && <span className="px-1.5 py-0.5 rounded bg-muted">Questions</span>}
                              {admin.permissions.canManageCompetitions && <span className="px-1.5 py-0.5 rounded bg-muted">Competitions</span>}
                              {admin.permissions.canViewAnalytics && <span className="px-1.5 py-0.5 rounded bg-muted">Analytics</span>}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        {admin.is_active ? (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-bold gap-1">
                            <CheckCircle2 size={11} /> Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] font-bold gap-1">
                            <XCircle size={11} /> Deactivated
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(admin.created_at), "MMM d, yyyy")}
                      </TableCell>

                      <TableCell className="text-right">
                        {currentUserIsSuperAdmin && admin.user_id !== user?.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl border-2">
                              <DropdownMenuLabel className="text-xs">Manage Admin</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => setEditingAdmin(admin)}
                                className="text-xs cursor-pointer font-medium"
                              >
                                <UserCog className="mr-2 h-3.5 w-3.5 text-primary" />
                                Edit Role & Permissions
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => toggleAdminStatus(admin.id, admin.is_active)}
                                className="text-xs cursor-pointer font-medium"
                              >
                                {admin.is_active ? (
                                  <>
                                    <Ban className="mr-2 h-3.5 w-3.5 text-amber-500" />
                                    Deactivate Account
                                  </>
                                ) : (
                                  <>
                                    <Check className="mr-2 h-3.5 w-3.5 text-emerald-500" />
                                    Reactivate Account
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeleteId(admin.id)}
                                className="text-xs text-destructive focus:text-destructive cursor-pointer font-medium"
                              >
                                <Trash2 className="mr-2 h-3.5 w-3.5" />
                                Delete Administrator
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* TAB 2: PENDING INVITATIONS */}
        <TabsContent value="invitations" className="mt-0">
          <div className="rounded-2xl border-2 border-border/80 bg-card overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="font-bold text-xs">Invitee</TableHead>
                  <TableHead className="font-bold text-xs">Role Assigned</TableHead>
                  <TableHead className="font-bold text-xs">Sent Date</TableHead>
                  <TableHead className="font-bold text-xs">Expiration Status</TableHead>
                  <TableHead className="text-right font-bold text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span>Loading invitations...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredInvitations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground text-sm">
                      No pending invitations. All invitations have been accepted or expired.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvitations.map((inv) => {
                    const expiresAt = new Date(inv.expires_at);
                    const isExpired = expiresAt < new Date();

                    return (
                      <TableRow key={inv.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <div>
                            <div className="font-bold text-sm text-foreground">
                              {inv.full_name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {inv.target_email}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          {inv.is_super_admin ? (
                            <Badge className="bg-primary text-primary-foreground text-[10px] font-extrabold gap-1">
                              <Shield size={11} /> Super Admin
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px] font-bold">
                              Staff Admin
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(inv.created_at), "MMM d, yyyy • h:mm a")}
                        </TableCell>

                        <TableCell>
                          {isExpired ? (
                            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] font-bold gap-1">
                              <XCircle size={11} /> Expired
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] font-bold gap-1">
                              <Clock size={11} /> Expires in {formatDistanceToNow(expiresAt)}
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopyInviteLink(inv.token)}
                              className="h-8 px-2.5 text-xs font-bold rounded-lg border-2 gap-1"
                              title="Copy Setup Link"
                            >
                              <Copy size={13} />
                              <span className="hidden sm:inline">Copy Link</span>
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              disabled={resendingInviteId === inv.id}
                              onClick={() => handleResendInvitation(inv.id)}
                              className="h-8 px-2.5 text-xs font-bold rounded-lg border-2 gap-1"
                              title="Resend Email"
                            >
                              {resendingInviteId === inv.id ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <RotateCcw size={13} />
                              )}
                              <span className="hidden sm:inline">Resend</span>
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setRevokeInviteId(inv.id)}
                              className="h-8 w-8 p-0 rounded-lg text-destructive hover:bg-destructive/10"
                              title="Revoke Invitation"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Admin Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-3xl border-2 p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Delete Administrator</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Are you sure you want to delete this administrator account? This will permanently revoke their access to the admin console.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl font-bold text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl font-bold text-xs"
            >
              Delete Admin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke Invitation Confirmation Dialog */}
      <AlertDialog open={!!revokeInviteId} onOpenChange={() => setRevokeInviteId(null)}>
        <AlertDialogContent className="rounded-3xl border-2 p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Revoke Invitation</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Are you sure you want to cancel and revoke this invitation link? The recipient will no longer be able to use it to create an account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl font-bold text-xs">Keep Invite</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeInvitation}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl font-bold text-xs"
            >
              Revoke Invitation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Admin Role & Permissions Dialog */}
      <EditAdminRoleDialog
        open={!!editingAdmin}
        onOpenChange={(open) => !open && setEditingAdmin(null)}
        admin={editingAdmin}
        onSuccess={fetchAllData}
      />
    </div>
  );
}

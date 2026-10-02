import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { queryKeys } from "@/lib/queryKeys";

export interface AdminPermissions {
  canManageUsers?: boolean;
  canManageQuestions?: boolean;
  canManageFlags?: boolean;
  canManageCompetitions?: boolean;
  canViewAnalytics?: boolean;
}

export interface AdminProfile {
  id: string;
  user_id: string;
  full_name: string;
  is_super_admin: boolean;
  permissions: AdminPermissions;
  is_active: boolean;
}

function normalizePermissions(raw: unknown): AdminPermissions {
  const perms = (raw as Record<string, unknown> | null) || {};
  return {
    canManageUsers: !!perms.canManageUsers,
    canManageQuestions: !!perms.canManageQuestions,
    canManageFlags: !!perms.canManageFlags,
    canManageCompetitions: !!perms.canManageCompetitions,
    canViewAnalytics: !!perms.canViewAnalytics,
  };
}

export function useAdminPermissions() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: queryKeys.adminPermissions(user?.id),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // permissions change rarely; refetch on demand
    retry: false,
    queryFn: async (): Promise<AdminProfile | null> => {
      const { data, error } = await supabase
        .from("admins")
        .select("id, user_id, full_name, is_super_admin, permissions, is_active")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        user_id: data.user_id,
        full_name: data.full_name,
        is_super_admin: !!data.is_super_admin,
        permissions: normalizePermissions(data.permissions),
        is_active: !!data.is_active,
      };
    },
  });

  const admin = query.data ?? null;
  const isSuperAdmin = admin?.is_super_admin === true;
  const canManageUsers = isSuperAdmin || admin?.permissions?.canManageUsers === true;
  const canManageQuestions = isSuperAdmin || admin?.permissions?.canManageQuestions === true;
  const canManageFlags = isSuperAdmin || admin?.permissions?.canManageFlags === true;
  const canManageCompetitions = isSuperAdmin || admin?.permissions?.canManageCompetitions === true;
  const canViewAnalytics = isSuperAdmin || admin?.permissions?.canViewAnalytics === true;

  const hasPermission = (key: keyof AdminPermissions | "is_super_admin") => {
    if (!admin) return false;
    if (admin.is_super_admin) return true;
    if (key === "is_super_admin") return false;
    return !!admin.permissions?.[key];
  };

  return {
    admin,
    loading: query.isLoading,
    isSuperAdmin,
    canManageUsers,
    canManageQuestions,
    canManageFlags,
    canManageCompetitions,
    canViewAnalytics,
    hasPermission,
    refetch: async () => {
      await query.refetch();
    },
  };
}

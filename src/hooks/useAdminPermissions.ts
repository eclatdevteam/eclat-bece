import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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

export function useAdminPermissions() {
  const { user } = useAuth();
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const adminRef = useRef<AdminProfile | null>(null);
  adminRef.current = admin;

  const fetchPermissions = useCallback(async (isSilent = false) => {
    if (!user) {
      setAdmin(null);
      setLoading(false);
      return;
    }

    try {
      // Only set loading = true if this is an initial load and data isn't cached yet
      if (!isSilent && !adminRef.current) {
        setLoading(true);
      }
      const { data, error } = await supabase
        .from("admins" as any)
        .select("id, user_id, full_name, is_super_admin, permissions, is_active")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const rawPerms = (data.permissions as any) || {};
        setAdmin({
          id: data.id,
          user_id: data.user_id,
          full_name: data.full_name,
          is_super_admin: !!data.is_super_admin,
          permissions: {
            canManageUsers: !!rawPerms.canManageUsers,
            canManageQuestions: !!rawPerms.canManageQuestions,
            canManageFlags: !!rawPerms.canManageFlags,
            canManageCompetitions: !!rawPerms.canManageCompetitions,
            canViewAnalytics: !!rawPerms.canViewAnalytics,
          },
          is_active: !!data.is_active,
        });
      } else {
        setAdmin(null);
      }
    } catch (err) {
      console.error("Error fetching admin permissions:", err);
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    const isAlreadyLoaded = adminRef.current?.user_id === user?.id && adminRef.current !== null;
    fetchPermissions(isAlreadyLoaded);
  }, [user?.id, fetchPermissions]);

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
    loading,
    isSuperAdmin,
    canManageUsers,
    canManageQuestions,
    canManageFlags,
    canManageCompetitions,
    canViewAnalytics,
    hasPermission,
    refetch: fetchPermissions,
  };
}

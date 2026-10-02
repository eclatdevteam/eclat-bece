import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

/**
 * AdminProtectedRoute Component - Admin-Only Route Protection
 * 
 * Ensures only authenticated users with admin role can access admin routes.
 * Checks for:
 * 1. User authentication
 * 2. Email verification
 * 3. Admin role in user_roles table
 * 4. Active admin record in admins table
 * 5. Optional: Super admin status
 * 
 * SECURITY: This is client-side protection. All admin operations must also
 * be validated server-side through RLS policies and the is_admin() / 
 * is_super_admin() functions.
 */

interface AdminProtectedRouteProps {
    children: React.ReactNode;
    requiresSuperAdmin?: boolean;
}

export const AdminProtectedRoute = ({
    children,
    requiresSuperAdmin = false
}: AdminProtectedRouteProps) => {
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const isAuthorizedRef = useRef(false);
    isAuthorizedRef.current = isAuthorized;
    const navigate = useNavigate();

    // useNavigate returns a new function identity on every location change in
    // React Router v6, so this component's auth-check effect must not depend on
    // it — otherwise the effect (and the full-screen "isChecking" gate that
    // replaces the whole layout, sidebar included) re-runs on every sidebar
    // navigation. All routes navigated to here are absolute, and the ref keeps
    // the persistent auth listener current anyway.
    const navigateRef = useRef(navigate);
    navigateRef.current = navigate;

    useEffect(() => {
        checkAdminStatus(false);

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                if (event === 'SIGNED_OUT') {
                    setIsAuthorized(false);
                    setIsChecking(false);
                    navigateRef.current('/admin/login');
                } else if (event === 'SIGNED_IN') {
                    // Perform verification silently if already authorized, avoiding full-screen loader
                    checkAdminStatus(isAuthorizedRef.current);
                }
            }
        );

        return () => subscription?.unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [requiresSuperAdmin]);

    const checkAdminStatus = async (isBackground = false) => {
        try {
            if (!isBackground) {
                setIsChecking(true);
            }
            const { data: { session } } = await supabase.auth.getSession();

            if (!session?.user) {
                setIsAuthorized(false);
                navigateRef.current("/admin/login");
                return;
            }

            // Check if email is verified
            if (!session.user.email_confirmed_at) {
                navigateRef.current("/verify-email");
                return;
            }

            // Check if user has admin role
            const { data: roleData } = await supabase
                .from("user_roles")
                .select("role")
                .eq("user_id", session.user.id)
                .eq("role", "admin")
                .maybeSingle();

            if (!roleData) {
                // User doesn't have admin role - redirect to their appropriate dashboard
                const { data: userRole } = await supabase
                    .from("user_roles")
                    .select("role")
                    .eq("user_id", session.user.id)
                    .maybeSingle();

                if (userRole?.role === "student") {
                    navigateRef.current("/dashboard/student");
                } else if (userRole?.role === "parent") {
                    navigateRef.current("/dashboard/parent");
                } else if (userRole?.role === "school") {
                    navigateRef.current("/dashboard/school");
                } else {
                    navigateRef.current("/");
                }
                return;
            }

            // Check admin record exists and is active
            const { data: adminData } = await supabase
                .from("admins")
                .select("id, is_super_admin, is_active")
                .eq("user_id", session.user.id)
                .maybeSingle();

            if (!adminData || !adminData.is_active) {
                navigateRef.current("/");
                return;
            }

            // If super admin is required, check that
            if (requiresSuperAdmin && !adminData.is_super_admin) {
                // Regular admin trying to access super admin route
                navigateRef.current("/admin");
                return;
            }

            setIsAuthorized(true);
        } catch (error) {
            console.error("Admin auth check error:", error);
            navigateRef.current("/admin/login");
        } finally {
            setIsChecking(false);
        }
    };

    if (isChecking) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return isAuthorized ? <>{children}</> : null;
};

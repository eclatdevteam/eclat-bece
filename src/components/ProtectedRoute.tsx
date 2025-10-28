import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "student" | "parent" | "school";
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate("/auth");
        return;
      }

      // Check if email is verified
      if (!session.user.email_confirmed_at) {
        navigate("/verify-email");
        return;
      }

      // If a specific role is required, check it
      if (requiredRole) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", requiredRole)
          .maybeSingle();

        if (!roleData) {
          // Redirect to correct dashboard based on their actual role
          const { data: userRole } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .maybeSingle();

          if (userRole?.role === "student") navigate("/dashboard/student");
          else if (userRole?.role === "parent") navigate("/dashboard/parent");
          else if (userRole?.role === "school") navigate("/dashboard/school");
          else navigate("/role-selection");
          return;
        }

        // For students, check onboarding status
        if (requiredRole === "student") {
          const { data: studentData } = await supabase
            .from("students")
            .select("onboarding_completed")
            .eq("user_id", session.user.id)
            .maybeSingle();

          if (studentData && !studentData.onboarding_completed) {
            navigate("/onboarding");
            return;
          }
        }
      }

      setIsAuthorized(true);
    } catch (error) {
      console.error("Auth check error:", error);
      navigate("/auth");
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

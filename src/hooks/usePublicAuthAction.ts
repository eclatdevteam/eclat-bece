import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export function usePublicAuthAction() {
  const navigate = useNavigate();

  const handleAction = async (defaultFallbackRoute: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (roleData?.role === "student") {
          navigate("/dashboard/student");
          return;
        } else if (roleData?.role === "parent") {
          navigate("/dashboard/parent");
          return;
        } else if (roleData?.role === "school") {
          navigate("/dashboard/school");
          return;
        } else if (roleData?.role === "admin") {
          navigate("/admin");
          return;
        }
      }

      navigate(defaultFallbackRoute);
    } catch (error) {
      console.error("Auth action routing error:", error);
      navigate(defaultFallbackRoute);
    }
  };

  const handleLoginClick = () => handleAction("/auth/login/role-selection");
  const handleGetStartedClick = () => handleAction("/auth/signup/role-selection");

  return {
    handleLoginClick,
    handleGetStartedClick,
  };
}

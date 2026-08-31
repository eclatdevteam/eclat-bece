import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export function useRedirectIfAuthenticated() {
  const navigate = useNavigate();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user || !isMounted) {
          if (isMounted) setIsCheckingAuth(false);
          return;
        }

        // Fetch user role
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (!isMounted) return;

        const role = roleData?.role;
        if (role === "student") {
          navigate("/dashboard/student", { replace: true });
        } else if (role === "parent") {
          navigate("/dashboard/parent", { replace: true });
        } else if (role === "school") {
          navigate("/dashboard/school", { replace: true });
        } else if (role === "admin") {
          navigate("/admin", { replace: true });
        } else {
          setIsCheckingAuth(false);
        }
      } catch (err) {
        console.error("Auth redirect check error:", err);
        if (isMounted) setIsCheckingAuth(false);
      }
    };

    checkSession();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  return { isCheckingAuth };
}

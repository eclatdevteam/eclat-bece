import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { About } from "@/components/About";
import { Pricing } from "@/components/Pricing";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const Index = () => {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthAndRedirect();
  }, []);

  const checkAuthAndRedirect = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        // User is authenticated, check their role and redirect
        let { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .maybeSingle();

        // If no role exists, ask the server to provision the role from verified auth metadata.
        if (!roleData) {
          const { error: provisionError } = await supabase.functions.invoke("provision-user", {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });

          if (!provisionError) {
            const { data: provisionedRole } = await supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", session.user.id)
              .maybeSingle();

            roleData = provisionedRole;
          } else {
            console.warn("Provision user error:", provisionError);
          }
        }

        if (roleData?.role === "student") {
          navigate("/dashboard/student");
        } else if (roleData?.role === "parent") {
          navigate("/dashboard/parent");
        } else if (roleData?.role === "school") {
          navigate("/dashboard/school");
        } else if (roleData?.role === "admin") {
          navigate("/admin");
        }
      }
    } catch (error) {
      console.error("Auth check error:", error);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleLoginAction = () => {
    navigate("/auth/login/role-selection");
  };

  const handleSignUpAction = () => {
    navigate("/auth/signup/role-selection");
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation onLoginClick={handleLoginAction} onGetStartedClick={handleSignUpAction} />
      <Hero onGetStartedClick={handleSignUpAction} />
      <Features />
      <About />
      <Pricing onGetStartedClick={handleSignUpAction} />
      <Footer />
    </div>
  );
};

export default Index;

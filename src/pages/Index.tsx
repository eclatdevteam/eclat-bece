import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { About } from "@/components/About";
import { Pricing } from "@/components/Pricing";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();

  const handleAction = async (defaultFallbackRoute: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        // User is authenticated, check their role and redirect directly to their dashboard
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

      // If not authenticated or no matching role, navigate to requested selection page
      navigate(defaultFallbackRoute);
    } catch (error) {
      console.error("Auth routing check error:", error);
      navigate(defaultFallbackRoute);
    }
  };

  const handleLoginAction = () => {
    handleAction("/auth/login/role-selection");
  };

  const handleSignUpAction = () => {
    handleAction("/auth/signup/role-selection");
  };

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

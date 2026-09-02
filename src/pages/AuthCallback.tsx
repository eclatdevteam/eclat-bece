import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Session } from "@supabase/supabase-js";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(true);
  const hasExecutedRef = useRef(false);

  useEffect(() => {
    if (hasExecutedRef.current) return;
    hasExecutedRef.current = true;

    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);

        // 1. Check for OAuth errors (e.g., user cancelled consent)
        const oauthError = urlParams.get("error");
        const oauthErrorDesc = urlParams.get("error_description");
        if (oauthError) {
          console.warn("OAuth error from provider:", oauthError, oauthErrorDesc);
          toast({
            title: "Sign-In Cancelled",
            description: oauthErrorDesc || "Google sign-in was not completed.",
            variant: "destructive",
          });
          navigate("/auth/login/role-selection");
          return;
        }

        // 2. Resolve Role from URL parameter first, fallback to localStorage
        const urlRole = urlParams.get("role");
        const storedRole = localStorage.getItem("pendingRole");
        const storedSchoolName = localStorage.getItem("pendingSchoolName");

        // Immediately clean up storage so stale values never leak for future logins
        localStorage.removeItem("pendingRole");
        localStorage.removeItem("pendingSchoolName");

        const targetRole = urlRole || storedRole;

        // 3. Resolve Session (handling PKCE async code exchange gracefully)
        const getOrAwaitSession = async (): Promise<Session | null> => {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) return session;

          return new Promise((resolve) => {
            const timeout = setTimeout(() => {
              subscription.unsubscribe();
              resolve(null);
            }, 10000);

            const { data: { subscription } } = supabase.auth.onAuthStateChange(
              (event, newSession) => {
                if (newSession?.user && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION")) {
                  clearTimeout(timeout);
                  subscription.unsubscribe();
                  resolve(newSession);
                }
              }
            );
          });
        };

        const session = await getOrAwaitSession();

        if (!session?.user) {
          console.error("Session could not be established after OAuth redirect");
          toast({
            title: "Authentication Failed",
            description: "Unable to complete Google sign-in. Please try again.",
            variant: "destructive",
          });
          navigate("/auth/login/role-selection");
          return;
        }

        const user = session.user;

        // 4. Check if user already has a role in the database (existing user)
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (roleData) {
          const userRole = roleData.role;
          // Accurately route all roles including admin
          const dashboardPath = userRole === "parent" 
            ? "/dashboard/parent" 
            : userRole === "school" 
            ? "/dashboard/school" 
            : userRole === "admin"
            ? "/admin"
            : "/dashboard/student";

          navigate(dashboardPath);
          return;
        }

        // 5. New user - validate pending role
        const role = targetRole;

        if (!role || !["parent", "school"].includes(role)) {
          await supabase.auth.signOut();
          toast({
            title: "Setup Required",
            description: "Please choose Parent or School before using Google sign-in.",
            variant: "destructive",
          });
          navigate("/auth/login/role-selection");
          return;
        }

        // 6. Update user metadata with role and school name if available
        const { error: updateError } = await supabase.auth.updateUser({
          data: { 
            role: role,
            ...(storedSchoolName ? { school_name: storedSchoolName } : {}),
          }
        });

        if (updateError) {
          console.error("Error updating user metadata:", updateError);
        }

        // 7. Provision user (creates role and base record with explicit body fallback)
        const { error: provisionError } = await supabase.functions.invoke("provision-user", {
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: {
            role: role,
            school_name: storedSchoolName || undefined,
          },
        });

        if (provisionError) {
          console.error("Provision error:", provisionError);
          await supabase.auth.signOut();
          toast({
            title: "Setup Failed",
            description: "Unable to complete account setup. Please try again.",
            variant: "destructive",
          });
          navigate("/auth/login/role-selection");
          return;
        }

        // 8. Mark email as verified for Google users in profiles table
        await supabase
          .from("profiles")
          .update({ email_verified: true })
          .eq("id", user.id);

        // 9. Redirect to appropriate onboarding flow
        if (role === "parent") {
          navigate("/onboarding/parent");
        } else if (role === "school") {
          navigate("/onboarding/school");
        } else {
          navigate("/auth/login/role-selection");
        }

      } catch (error) {
        console.error("Callback error:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred during sign-in.",
          variant: "destructive",
        });
        navigate("/auth/login/role-selection");
      } finally {
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light/20 via-background to-accent-light/20 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground font-medium">Completing sign-in...</p>
      </div>
    </div>
  );
}

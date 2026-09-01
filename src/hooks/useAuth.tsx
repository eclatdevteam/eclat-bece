import { useAuthContext } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

export const useAuth = () => {
  const { user, session, loading } = useAuthContext();

  const handleSignOut = async (redirectTo?: string) => {
    // Preserve user theme preference
    const savedTheme = localStorage.getItem("theme");

    await supabase.auth.signOut();

    // Clear session storage
    sessionStorage.clear();

    // Selectively clean up auth storage while preserving user settings
    Object.keys(localStorage).forEach((key) => {
      if (key !== "theme" && (key.startsWith("sb-") || key.includes("supabase") || key === "pendingRole")) {
        localStorage.removeItem(key);
      }
    });

    if (savedTheme) {
      localStorage.setItem("theme", savedTheme);
    }

    // Determine redirect destination
    const targetUrl =
      redirectTo ||
      (window.location.pathname.startsWith("/admin") ? "/admin/login" : "/");

    // Use window.location.href to force a full page reload and clear any cached state
    window.location.href = targetUrl;
  };

  return { user, session, loading, signOut: handleSignOut };
};

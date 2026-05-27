import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/components/AuthProvider";

export const useAuth = () => {
  const { user, session, loading, signOut } = useAuthContext();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const pathname = window.location.pathname;
    await signOut();
    if (pathname.includes("/parent")) {
      navigate("/auth?role=parent");
    } else if (pathname.includes("/school")) {
      navigate("/auth?role=school");
    } else if (pathname.includes("/admin")) {
      navigate("/admin/login");
    } else {
      navigate("/auth?role=student");
    }
  };

  return { user, session, loading, signOut: handleSignOut };
};

import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
                setUser(session?.user ?? null);
                setLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        // Preserve user theme preference
        const savedTheme = localStorage.getItem("theme");

        await supabase.auth.signOut();

        // Clear session storage
        sessionStorage.clear();

        // Selectively clean up auth storage while preserving user settings
        Object.keys(localStorage).forEach((key) => {
            if (key !== "theme" && (key.startsWith("sb-") || key.includes("supabase") || key === "pendingRole" || key === "pendingSchoolName")) {
                localStorage.removeItem(key);
            }
        });

        if (savedTheme) {
            localStorage.setItem("theme", savedTheme);
        }

        setUser(null);
        setSession(null);
        // Navigation should be handled by the component calling signOut
    };

    return (
        <AuthContext.Provider value={{ user, session, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuthContext must be used within an AuthProvider");
    }
    return context;
};

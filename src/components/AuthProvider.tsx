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
        supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            setLoading(false);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, newSession) => {
                setSession((prevSession) => {
                    if (!prevSession && !newSession) return null;
                    if (prevSession?.access_token === newSession?.access_token) {
                        return prevSession; // Preserve stable session reference
                    }
                    return newSession;
                });

                setUser((prevUser) => {
                    const nextUser = newSession?.user ?? null;
                    if (!prevUser && !nextUser) return null;
                    if (prevUser && nextUser && prevUser.id === nextUser.id && prevUser.updated_at === nextUser.updated_at) {
                        return prevUser; // Preserve stable user reference
                    }
                    return nextUser;
                });

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

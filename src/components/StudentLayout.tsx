import { ReactNode, useEffect, useState } from "react";
import { Flame, LogOut, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { StudentSidebar } from "@/components/StudentSidebar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";

interface StudentLayoutProps {
  children: ReactNode;
}

export function StudentLayout({ children }: StudentLayoutProps) {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [currentStreak, setCurrentStreak] = useState(0);

  useEffect(() => {
    const fetchStreak = async () => {
      if (!user) return;

      const { data: studentData } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!studentData?.id) return;

      const { data: streakData } = await supabase
        .from("student_streaks")
        .select("current_streak")
        .eq("student_id", studentData.id)
        .maybeSingle();

      if (streakData) {
        setCurrentStreak(streakData.current_streak);
      }
    };

    fetchStreak();
  }, [user]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-primary-light/20 via-background to-accent-light/20">
        <StudentSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <img 
                  src={logo} 
                  alt="Éclat Logo" 
                  className="h-10 w-auto cursor-pointer" 
                  onClick={() => navigate("/")} 
                />
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                  currentStreak === 0 
                    ? 'bg-destructive/20' 
                    : currentStreak >= 7 
                    ? 'bg-green-500/20' 
                    : 'bg-accent-light'
                }`}>
                  <Flame className={`${
                    currentStreak === 0 
                      ? 'text-destructive' 
                      : currentStreak >= 7 
                      ? 'text-green-600' 
                      : 'text-accent'
                  }`} size={16} />
                  <span className={`text-sm font-semibold ${
                    currentStreak === 0 
                      ? 'text-destructive' 
                      : currentStreak >= 7 
                      ? 'text-green-600' 
                      : 'text-accent'
                  }`}>{currentStreak}-day streak!</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <ThemeToggle />
                <Button variant="ghost" size="icon">
                  <Settings size={20} />
                </Button>
                <Button variant="ghost" size="icon" onClick={signOut}>
                  <LogOut size={20} />
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

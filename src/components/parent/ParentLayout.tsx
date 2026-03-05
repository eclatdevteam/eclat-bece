import { ReactNode } from "react";
import { LayoutDashboard, Users, CreditCard, HelpCircle, Bell, Settings, LogOut } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/NotificationBell";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ParentSidebar } from "./ParentSidebar";
import { useTheme } from "next-themes";
import logoDark from "@/assets/logo-dark.png";
import logoLight from "@/assets/logo-light.png";

interface ParentLayoutProps {
    children: ReactNode;
}

export function ParentLayout({ children }: ParentLayoutProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { signOut } = useAuth();
    const { theme } = useTheme();
    const logo = theme === "dark" ? logoLight : logoDark;

    const navItems = [
        { title: "Dashboard", url: "/dashboard/parent", icon: LayoutDashboard },
        { title: "Children", url: "/dashboard/parent#children", icon: Users },
        { title: "Billing", url: "/dashboard/parent#subscriptions", icon: CreditCard },
        { title: "Resources", url: "/dashboard/parent#resources", icon: HelpCircle },
    ];

    const currentPath = location.pathname + location.hash;
    const isActive = (url: string) => currentPath === url;

    return (
        <SidebarProvider>
            <div className="min-h-screen flex w-full bg-gradient-to-br from-primary/5 via-background to-accent/5">
                <ParentSidebar />

                <div className="flex-1 flex flex-col relative">
                    {/* Desktop/Tablet Header */}
                    <header className="border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-40 transition-all duration-300">
                        <div className="flex items-center justify-between px-4 sm:px-6 py-4">
                            <div className="flex items-center gap-4">
                                <SidebarTrigger className="md:hidden hover:scale-105 transition-transform" />
                                <img
                                    src={logo}
                                    alt="Éclat Logo"
                                    className="h-10 sm:h-12 w-auto cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => navigate("/")}
                                />
                            </div>

                            <div className="flex items-center gap-2 sm:gap-4">
                                <div className="hidden sm:flex items-center bg-muted/30 rounded-full px-3 py-1 border border-border/50">
                                    <span className="text-xs font-semibold text-muted-foreground mr-2">ROLE:</span>
                                    <span className="text-xs font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-full">PARENT</span>
                                </div>
                                <NotificationBell />
                                <ThemeToggle />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-full hover:bg-muted"
                                    onClick={() => navigate("/dashboard/parent#settings")}
                                >
                                    <Settings className="h-5 w-5 text-muted-foreground" />
                                </Button>
                            </div>
                        </div>
                    </header>

                    {/* Main Content Area */}
                    <main className="flex-1 pb-24 md:pb-8">
                        <div className="container mx-auto">
                            {children}
                        </div>
                    </main>

                    {/* Mobile Bottom Navigation */}
                    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border/60 px-2 py-3 z-50 shadow-[0_-8px_20px_-8px_rgba(0,0,0,0.1)]">
                        <div className="flex justify-around items-center max-w-md mx-auto">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const active = isActive(item.url);
                                return (
                                    <button
                                        key={item.title}
                                        onClick={() => {
                                            if (item.url.startsWith("#")) {
                                                const el = document.getElementById(item.url.substring(1));
                                                if (el) el.scrollIntoView({ behavior: 'smooth' });
                                            } else {
                                                navigate(item.url);
                                            }
                                        }}
                                        className={`flex flex-col items-center gap-1 transition-all duration-300 relative px-4 py-1 rounded-2xl ${active ? "text-primary scale-110" : "text-muted-foreground hover:text-primary/70"
                                            }`}
                                    >
                                        <Icon className={`h-6 w-6 ${active ? "fill-primary/10 stroke-[2.5px]" : "stroke-[2px]"}`} />
                                        <span className={`text-[10px] font-bold uppercase tracking-tight ${active ? "opacity-100" : "opacity-60"}`}>
                                            {item.title}
                                        </span>
                                        {active && (
                                            <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)] animate-pulse" />
                                        )}
                                    </button>
                                );
                            })}
                            <button
                                onClick={signOut}
                                className="flex flex-col items-center gap-1 text-muted-foreground hover:text-destructive opacity-80"
                            >
                                <LogOut className="h-6 w-6 stroke-[2px]" />
                                <span className="text-[10px] font-bold uppercase tracking-tight opacity-60">Exit</span>
                            </button>
                        </div>
                    </nav>
                </div>
            </div>
        </SidebarProvider>
    );
}

import { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  BarChart3,
  Trophy,
  Settings,
  FileText,
  LogOut,
  Menu,
  X,
  Shield,
  Flag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useAdminPermissions } from "@/hooks/useAdminPermissions";

export const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { signOut } = useAuth();
  const { 
    admin, 
    isSuperAdmin, 
    canManageUsers, 
    canManageQuestions, 
    canManageFlags,
    canManageCompetitions, 
    canViewAnalytics 
  } = useAdminPermissions();

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out");
    }
  };

  const allNavigation = [
    { 
      name: "Dashboard", 
      href: "/admin", 
      icon: LayoutDashboard,
      allowed: true 
    },
    { 
      name: "Admin Users", 
      href: "/admin/users", 
      icon: Shield,
      allowed: isSuperAdmin 
    },
    { 
      name: "Question Bank", 
      href: "/admin/questions", 
      icon: BookOpen,
      allowed: isSuperAdmin || canManageQuestions 
    },
    { 
      name: "Passages", 
      href: "/admin/passages", 
      icon: FileText,
      allowed: isSuperAdmin || canManageQuestions 
    },
    { 
      name: "Flag Reports", 
      href: "/admin/flags", 
      icon: Flag,
      allowed: isSuperAdmin || canManageFlags 
    },
    { 
      name: "Platform Users", 
      href: "/admin/platform-users", 
      icon: Users,
      allowed: isSuperAdmin || canManageUsers 
    },
    { 
      name: "Competitions", 
      href: "/admin/competitions", 
      icon: Trophy,
      allowed: isSuperAdmin || canManageCompetitions 
    },
    { 
      name: "Analytics", 
      href: "/admin/analytics", 
      icon: BarChart3,
      allowed: isSuperAdmin || canViewAnalytics 
    },
    { 
      name: "Reports", 
      href: "/admin/reports", 
      icon: FileText,
      allowed: isSuperAdmin || canViewAnalytics 
    },
    { 
      name: "Settings", 
      href: "/admin/settings", 
      icon: Settings,
      allowed: true 
    },
  ];

  const visibleNavigation = allNavigation.filter((item) => item.allowed);

  const isActiveRoute = (href: string) => {
    if (href === "/admin") {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background dashboard-theme">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">Éclat Admin</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-card border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo & Role Status Badge */}
          <div className="hidden lg:flex flex-col gap-2 px-6 pt-6 pb-4">
            <div className="flex items-center gap-2">
              <Shield className="h-7 w-7 text-primary" />
              <span className="font-black text-xl tracking-tight text-foreground">
                Éclat Admin
              </span>
            </div>

            {admin && (
              <div className="mt-1">
                <Badge
                  variant={isSuperAdmin ? "default" : "secondary"}
                  className="text-[10px] font-extrabold px-2 py-0.5"
                >
                  {isSuperAdmin ? "🔐 Super Administrator" : "👤 Staff Administrator"}
                </Badge>
              </div>
            )}
          </div>

          <Separator className="hidden lg:block" />

          {/* Navigation Items */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {visibleNavigation.map((item) => {
              const Icon = item.icon;
              const active = isActiveRoute(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    active
                      ? "bg-primary text-primary-foreground shadow-sm font-bold"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <Separator />

          {/* Bottom Actions & User Profile */}
          <div className="p-4 space-y-3">
            {admin && (
              <div className="px-2 py-1">
                <p className="text-xs font-bold text-foreground truncate">{admin.full_name}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {isSuperAdmin ? "All Permissions" : "Custom Permissions"}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-semibold text-muted-foreground">Theme</span>
              <ThemeToggle />
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start rounded-xl font-bold text-xs h-9"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="lg:pl-64 pt-16 lg:pt-0">
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

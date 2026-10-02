import { useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3, BookOpen, Briefcase, Building2, ClipboardCheck,
  LayoutDashboard, LogOut, Settings, Trophy, Users, ChevronLeft, ChevronRight,
} from "lucide-react";
import logoLight from "@/assets/logo-light.png";
import logoDark from "@/assets/logo-dark.png";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "next-themes";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const menuItems = [
  { title: "Dashboard", url: "/dashboard/school", icon: LayoutDashboard },
  { title: "Students", url: "/dashboard/school/students", icon: Users },
  { title: "Teachers", url: "/dashboard/school/teachers", icon: Briefcase },
  { title: "Classes", url: "/dashboard/school/classes", icon: Building2 },
  { title: "Assignments", url: "/dashboard/school/assignments", icon: ClipboardCheck },
  { title: "Reports", url: "/dashboard/school/reports", icon: BarChart3 },
  { title: "Exams", url: "/dashboard/school/exams", icon: BookOpen },
  { title: "Leaderboard", url: "/dashboard/school/leaderboard", icon: Trophy },
  { title: "Settings", url: "/dashboard/school/settings", icon: Settings },
];

export function SchoolSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { resolvedTheme } = useTheme();
  const { state, toggleSidebar, isMobile, setOpenMobile } = useSidebar();
  const isCollapsed = state === "collapsed";

  const logo = resolvedTheme === "dark" ? logoLight : logoDark;
  const isActive = (path: string) => location.pathname === path;

  const handleNavigate = (url: string) => {
    navigate(url);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleLogout = async () => {
    if (isMobile) {
      setOpenMobile(false);
    }
    await signOut();
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 sm:h-16 items-center border-b border-sidebar-border px-4">
        <img src={logo} alt="Éclat" className="h-7 sm:h-8 w-auto cursor-pointer" onClick={() => handleNavigate("/dashboard/school")} />
      </div>

      <SidebarContent>
        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel className="px-4 pb-4 pt-6 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Navigation
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map(({ title, url, icon: Icon }) => {
                const active = isActive(url);
                return (
                  <SidebarMenuItem key={title}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          onClick={() => handleNavigate(url)}
                          className={`mx-2 h-10 rounded-md text-sm transition-colors ${
                            active
                              ? "bg-sky-100 text-sky-950 font-bold border-l-4 border-sky-600 shadow-sm dark:bg-[#334158] dark:text-white dark:border-l-0 dark:shadow-[inset_3px_0_0_#0c9dcc] dark:font-semibold"
                              : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          }`}
                        >
                          <Icon className={isCollapsed ? "" : "mr-2 h-4 w-4"} />
                          {!isCollapsed && <span>{title}</span>}
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      {isCollapsed && (
                        <TooltipContent side="right">
                          <p>{title}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="mb-1 w-full justify-start text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className={isCollapsed ? "h-4 w-4" : "mr-2 h-4 w-4"} />
              {!isCollapsed && <span>Logout</span>}
            </Button>
          </TooltipTrigger>
          {isCollapsed && (
            <TooltipContent side="right">
              <p>Logout</p>
            </TooltipContent>
          )}
        </Tooltip>

        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="hidden md:flex w-full justify-start text-muted-foreground hover:text-foreground"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="mr-2 h-4 w-4" />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

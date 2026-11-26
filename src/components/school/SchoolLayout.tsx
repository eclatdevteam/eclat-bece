import { Suspense, useState, useMemo } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { CalendarDays, Search, Bell } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SchoolSidebar } from "@/components/school/SchoolSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ContentLoader } from "@/components/PageLoader";
import { useSchoolData } from "@/hooks/useSchoolData";
import { useTheme } from "next-themes";
import logoLight from "@/assets/logo-light.png";
import logoDark from "@/assets/logo-dark.png";
import { toast } from "sonner";

/**
 * Persistent school portal shell — mounted once as the /dashboard/school layout
 * route element. Child pages render through the Outlet inside a local Suspense
 * boundary so lazy page chunks never blank the sidebar or header.
 */
export function SchoolLayout() {
  const navigate = useNavigate();
  const { school } = useSchoolData();
  const { resolvedTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");

  const logo = resolvedTheme === "dark" ? logoLight : logoDark;

  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const initials = useMemo(() => {
    const name = school?.school_name || "Cleveland School";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }, [school?.school_name]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/dashboard/school/students?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background text-foreground dashboard-theme">
        <SchoolSidebar />

        <div className="flex min-w-0 flex-1 flex-col h-full overflow-hidden">
          {/* Top Bar / Header */}
          <header className="flex flex-col border-b border-border bg-card/95 backdrop-blur z-20 transition-colors">
            {/* Desktop Top Bar */}
            <div className="hidden md:flex h-14 sm:h-16 flex-shrink-0 items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
              {/* Search Bar */}
              <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-sm lg:max-w-md">
                <SidebarTrigger className="text-muted-foreground hover:text-foreground hover:bg-accent md:hidden flex-shrink-0" />
                <form onSubmit={handleSearch} className="relative w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search students, classes, assignments..."
                    className="w-full h-9 pl-9 pr-12 rounded-full border border-border/80 bg-muted/40 hover:bg-muted/60 focus:bg-background focus:border-primary text-xs text-foreground placeholder:text-muted-foreground transition-all outline-none"
                  />
                  <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono font-semibold text-muted-foreground">
                    ⌘K
                  </kbd>
                </form>
              </div>

              {/* Status Badges & Quick User Controls */}
              <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
                <div className="rounded-full bg-sky-500/10 border border-sky-500/25 px-3 py-1 text-xs font-bold text-sky-600 dark:text-[#3bc2f3] tracking-wide">
                  School Portal
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5 text-primary" />
                  <span>{currentDate}</span>
                </div>
                <button
                  type="button"
                  onClick={() => toast.info("No unread alerts. Operational status is normal.")}
                  className="relative p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  title="Notifications"
                >
                  <Bell className="h-4 w-4" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-background" />
                </button>
                <ThemeToggle />
                <div
                  className="w-8 h-8 rounded-full bg-slate-800 dark:bg-slate-700 text-white font-bold text-xs flex items-center justify-center border border-slate-700 shadow-xs cursor-pointer select-none"
                  title={school?.school_name || "Cleveland School"}
                  onClick={() => navigate("/dashboard/school/settings")}
                >
                  {initials}
                </div>
              </div>
            </div>

            {/* Mobile Top Bar */}
            <div className="md:hidden flex flex-col px-4 py-3 gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SidebarTrigger className="text-muted-foreground hover:text-foreground hover:bg-accent" />
                  <img src={logo} alt="Éclat" className="h-6 w-auto" />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toast.info("No unread alerts.")}
                    className="relative p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent"
                  >
                    <Bell className="h-4 w-4" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-background" />
                  </button>
                  <ThemeToggle />
                  <div
                    className="w-7 h-7 rounded-full bg-slate-800 dark:bg-slate-700 text-white font-bold text-xs flex items-center justify-center border border-slate-700 select-none"
                    onClick={() => navigate("/dashboard/school/settings")}
                  >
                    {initials}
                  </div>
                </div>
              </div>

              {/* Mobile Search Input */}
              <form onSubmit={handleSearch} className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search students, classes, assignments..."
                  className="w-full h-8 pl-8 pr-10 rounded-full border border-border/80 bg-muted/40 text-xs text-foreground placeholder:text-muted-foreground outline-none"
                />
                <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none rounded border border-border bg-muted px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground">
                  ⌘K
                </kbd>
              </form>

              {/* Mobile Badges Row */}
              <div className="flex items-center justify-between pt-0.5">
                <span className="rounded-full bg-sky-500/10 border border-sky-500/25 px-2.5 py-0.5 text-[11px] font-bold text-sky-600 dark:text-[#3bc2f3]">
                  School Portal
                </span>
                <span className="flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                  <CalendarDays className="h-3 w-3 text-primary" />
                  <span>{currentDate}</span>
                </span>
              </div>
            </div>
          </header>

          {/* Main Content Area with safe scrolling and bounded width */}
          <main className="flex-1 min-h-0 min-w-0 overflow-y-auto px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
            <div className="mx-auto w-full max-w-7xl">
              <Suspense fallback={<ContentLoader />}>
                <Outlet />
              </Suspense>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

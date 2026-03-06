import { LayoutDashboard, Users, CreditCard, HelpCircle, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
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
    { title: "Dashboard", url: "/dashboard/parent", icon: LayoutDashboard },
    { title: "My Children", url: "/dashboard/parent/children", icon: Users },
    { title: "Subscriptions", url: "/dashboard/parent#subscriptions", icon: CreditCard },
    { title: "Help & Resources", url: "/dashboard/parent#resources", icon: HelpCircle },
];

export function ParentSidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { signOut } = useAuth();
    const { state, toggleSidebar } = useSidebar();
    const currentPath = location.pathname;
    const isCollapsed = state === "collapsed";

    const isActive = (url: string) => {
        if (url.includes("#")) {
            return currentPath + location.hash === url;
        }
        return currentPath === url;
    };

    return (
        <Sidebar collapsible="icon" className="border-r bg-card/50 backdrop-blur-sm">
            <SidebarContent>
                <SidebarGroup>
                    {!isCollapsed && (
                        <SidebarGroupLabel className="px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">
                            Parent Portal
                        </SidebarGroupLabel>
                    )}
                    <SidebarGroupContent>
                        <SidebarMenu className="px-2 space-y-1">
                            {menuItems.map((item) => {
                                const Icon = item.icon;
                                const active = isActive(item.url);
                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <Tooltip delayDuration={0}>
                                            <TooltipTrigger asChild>
                                                <SidebarMenuButton
                                                    onClick={() => {
                                                        if (item.url.includes("#") && currentPath === item.url.split("#")[0]) {
                                                            const el = document.getElementById(item.url.split("#")[1]);
                                                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                                                        } else {
                                                            navigate(item.url);
                                                        }
                                                    }}
                                                    className={`
                            h-11 rounded-xl transition-all duration-200
                            ${active
                                                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 font-semibold"
                                                            : "hover:bg-primary/10 text-muted-foreground hover:text-primary"}
                          `}
                                                >
                                                    <Icon className={`${isCollapsed ? "h-5 w-5" : "mr-3 h-5 w-5"} transition-transform duration-200 group-hover:scale-110`} />
                                                    {!isCollapsed && <span className="text-[15px]">{item.title}</span>}
                                                </SidebarMenuButton>
                                            </TooltipTrigger>
                                            {isCollapsed && (
                                                <TooltipContent side="right" className="bg-popover border-border animate-in fade-in zoom-in-95">
                                                    <p className="font-medium">{item.title}</p>
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

            <SidebarFooter className="p-4 border-t border-border/50">
                <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={signOut}
                            className={`
                w-full justify-start rounded-xl h-11 text-muted-foreground hover:bg-destructive/10 hover:text-destructive 
                transition-all duration-200 group
              `}
                        >
                            <LogOut className={`${isCollapsed ? "h-5 w-5" : "mr-3 h-5 w-5"} transition-transform group-hover:-translate-x-1`} />
                            {!isCollapsed && <span className="font-medium text-[15px]">Sign Out</span>}
                        </Button>
                    </TooltipTrigger>
                    {isCollapsed && (
                        <TooltipContent side="right" className="bg-destructive text-destructive-foreground font-medium">
                            <p>Sign Out</p>
                        </TooltipContent>
                    )}
                </Tooltip>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSidebar}
                    className="w-full justify-center mt-2 h-8 rounded-lg hover:bg-muted text-muted-foreground/60"
                >
                    {isCollapsed ? (
                        <ChevronRight className="h-4 w-4" />
                    ) : (
                        <div className="flex items-center gap-2">
                            <ChevronLeft className="h-4 w-4" />
                            <span className="text-xs font-medium uppercase tracking-tighter italic">Collapse Menu</span>
                        </div>
                    )}
                </Button>
            </SidebarFooter>
        </Sidebar>
    );
}

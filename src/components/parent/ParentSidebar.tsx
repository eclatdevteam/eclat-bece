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
    { title: "Assignments", url: "/dashboard/parent/assignments", icon: LayoutDashboard },
    { title: "Reports", url: "/dashboard/parent/reports", icon: CreditCard },
    { title: "Subscriptions", url: "/dashboard/parent/subscriptions", icon: CreditCard },
    { title: "Help & Resources", url: "/dashboard/parent/resources", icon: HelpCircle },
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
        return currentPath === url && !location.hash;
    };

    return (
        <Sidebar collapsible="icon" className="border-r border-border/50 bg-[#0d1d2f] text-foreground shadow-[inset_0_0_0_1px_rgba(141,191,255,0.06)]">
            <SidebarContent className="bg-[#0d1d2f]">
                <SidebarGroup>
                    {!isCollapsed && (
                        <SidebarGroupLabel className="mb-3 px-4 text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                            Parent Portal
                        </SidebarGroupLabel>
                    )}
                    <SidebarGroupContent>
                        <SidebarMenu className="space-y-1 px-2">
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
                                                    className={`h-11 rounded-xl border border-transparent transition-all duration-200 ${active ? 'bg-primary/12 text-primary shadow-[inset_0_0_0_1px_rgba(125,211,252,0.2)]' : 'text-slate-300 hover:bg-white/5 hover:text-primary'}`}
                                                >
                                                    <Icon className={`${isCollapsed ? 'h-5 w-5' : 'mr-3 h-5 w-5'} transition-transform duration-200 group-hover:scale-110`} />
                                                    {!isCollapsed && <span className="text-[15px] font-medium">{item.title}</span>}
                                                </SidebarMenuButton>
                                            </TooltipTrigger>
                                            {isCollapsed && (
                                                <TooltipContent side="right" className="border border-border/40 bg-popover text-foreground">
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

            <SidebarFooter className="border-t border-border/50 bg-[#0d1d2f] p-4">
                <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={signOut}
                            className="h-11 w-full justify-start rounded-xl text-slate-300 transition hover:bg-destructive/10 hover:text-destructive"
                        >
                            <LogOut className={`${isCollapsed ? 'h-5 w-5' : 'mr-3 h-5 w-5'} transition-transform group-hover:-translate-x-1`} />
                            {!isCollapsed && <span className="text-[15px] font-medium">Sign Out</span>}
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
                    className="mt-2 h-8 w-full justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-primary"
                >
                    {isCollapsed ? (
                        <ChevronRight className="h-4 w-4" />
                    ) : (
                        <div className="flex items-center gap-2">
                            <ChevronLeft className="h-4 w-4" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Collapse</span>
                        </div>
                    )}
                </Button>
            </SidebarFooter>
        </Sidebar>
    );
}

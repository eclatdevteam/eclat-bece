import { Award, BookOpen, Target, MoreVertical, CreditCard, ChevronRight, Trash2, User, Key, Fingerprint, Copy, Check, Eye } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { LinkedChild, ChildAnalytics, Assignment } from "@/types/parent";

interface ChildOverviewCardProps {
    child: LinkedChild;
    analytics?: ChildAnalytics;
    assignments?: Assignment[];
    index: number;
    onViewReport: (child: LinkedChild) => void;
    onAssignPractice: (child: LinkedChild) => void;
    onUpgradePremium: (child: LinkedChild) => void;
    onDeleteChild: (child: LinkedChild) => void;
    onEditName: (child: LinkedChild) => void;
    onEditUsername: (child: LinkedChild) => void;
    onChangePassword: (child: LinkedChild) => void;
    onReviewAssignment?: (assignment: Assignment, childName: string) => void;
}

export function ChildOverviewCard({
    child,
    analytics,
    assignments = [],
    index,
    onViewReport,
    onAssignPractice,
    onUpgradePremium,
    onDeleteChild,
    onEditName,
    onEditUsername,
    onChangePassword,
    onReviewAssignment
}: ChildOverviewCardProps) {
    const initials = child.profile.full_name?.charAt(0).toUpperCase() || "?";

    const handleCopyUsername = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (child.profile.username) {
            navigator.clipboard.writeText(child.profile.username);
            toast.success("Username copied to clipboard", {
                description: child.profile.username,
                duration: 2000,
            });
        }
    };

    const handleCopyId = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (child.profile.unique_id) {
            navigator.clipboard.writeText(child.profile.unique_id);
            toast.success("Student ID copied to clipboard", {
                description: child.profile.unique_id,
                duration: 2000,
            });
        }
    };

    return (
        <Card
            className="group border border-border bg-card text-card-foreground hover:border-primary/40 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden relative"
            style={{ animationDelay: `${index * 0.1}s` }}
        >
            {child.is_premium && (
                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-amber-400 to-amber-600 z-10" title="Premium Student" />
            )}

            <CardHeader className="pb-4 border-b border-border">
                <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3.5 min-w-0">
                            <div className={`
                                h-12 w-12 sm:h-14 sm:w-14 rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-black shrink-0 shadow-sm 
                                transition-transform group-hover:scale-105 duration-300
                                ${child.is_premium ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-slate-900' : 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground'}
                            `}>
                                {initials}
                            </div>
                            <div className="space-y-1 min-w-0">
                                <CardTitle
                                    className="text-lg sm:text-xl font-black tracking-tight text-foreground truncate"
                                    title={child.profile.full_name || "Unknown"}
                                >
                                    {child.profile.full_name || "Unknown"}
                                </CardTitle>
                                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                                    {child.is_premium ? (
                                        <span className="rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30 uppercase font-black text-[10px] px-2.5 py-0.5 whitespace-nowrap">
                                            Premium
                                        </span>
                                    ) : (
                                        <span className="rounded-full bg-muted text-muted-foreground border border-border uppercase font-bold text-[10px] px-2.5 py-0.5 whitespace-nowrap">
                                            Standard
                                        </span>
                                    )}
                                    <span className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[10px] font-bold text-primary uppercase whitespace-nowrap">
                                        {child.class_year === "year_6" ? "Year 6" : child.class_year === "year_9" ? "Year 9" : "General"}
                                    </span>
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <span
                                            className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-md border border-border whitespace-nowrap cursor-pointer hover:bg-accent hover:text-foreground transition-colors active:scale-95"
                                            title={`Click to copy: ${child.profile.unique_id}`}
                                            onClick={handleCopyId}
                                        >
                                            {child.profile.unique_id}
                                        </span>
                                        {child.profile.username && (
                                            <span
                                                className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-md border border-border truncate max-w-[120px] cursor-pointer hover:bg-accent hover:text-foreground transition-colors active:scale-95"
                                                title={`Click to copy: ${child.profile.username}`}
                                                onClick={handleCopyUsername}
                                            >
                                                @{child.profile.username}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground hover:bg-accent">
                                    <MoreVertical size={18} />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl p-1.5 shadow-2xl border border-border bg-popover text-popover-foreground">
                                {!child.is_premium && (
                                    <DropdownMenuItem
                                        className="rounded-lg text-amber-500 font-bold flex items-center gap-2 hover:bg-accent"
                                        onClick={() => onUpgradePremium(child)}
                                    >
                                        <CreditCard size={14} />
                                        Upgrade Premium
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                    className="rounded-lg font-semibold flex items-center gap-2 hover:bg-accent"
                                    onClick={() => onEditName(child)}
                                >
                                    <User size={14} />
                                    Edit Name
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="rounded-lg font-semibold flex items-center gap-2 hover:bg-accent"
                                    onClick={() => onChangePassword(child)}
                                >
                                    <Key size={14} />
                                    Change Password
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="rounded-lg font-semibold flex items-center gap-2 hover:bg-accent"
                                    onClick={() => onEditUsername(child)}
                                >
                                    <Fingerprint size={14} />
                                    Edit Username
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="rounded-lg text-rose-500 font-semibold focus:bg-rose-500/10 focus:text-rose-500 hover:bg-rose-500/10 hover:text-rose-500 flex items-center gap-2"
                                    onClick={() => onDeleteChild(child)}
                                >
                                    <Trash2 size={14} />
                                    Delete Account
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-border sm:border-none sm:pt-0">
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 sm:flex-none rounded-xl font-semibold text-xs h-8"
                            onClick={() => onViewReport(child)}
                        >
                            View Report
                        </Button>
                        <Button
                            size="sm"
                            className="flex-1 sm:flex-none rounded-xl font-semibold text-xs h-8 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                            onClick={() => onAssignPractice(child)}
                        >
                            Assign Task
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-5 pt-4">
                {/* Homework & Assignments Tracking */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="font-black text-[11px] uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500/60" />
                            Homework Progress
                        </h4>
                        {assignments.length > 3 && (
                            <span className="text-[10px] font-bold text-muted-foreground">Showing 3 of {assignments.length}</span>
                        )}
                    </div>
                    <div className="space-y-2">
                        {assignments.length > 0 ? (
                            assignments.slice(0, 3).map((assignment) => (
                                <div
                                    key={assignment.id}
                                    onClick={() => {
                                        if (assignment.status === 'completed' && onReviewAssignment) {
                                            onReviewAssignment(assignment, child.profile.full_name || "Child");
                                        }
                                    }}
                                    className={`group/assignment flex items-center justify-between p-3 rounded-2xl bg-muted/20 border border-border/50 hover:border-primary/30 transition-all ${
                                        assignment.status === 'completed' && onReviewAssignment
                                            ? 'cursor-pointer hover:bg-muted/30 hover:shadow-sm'
                                            : ''
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${assignment.status === 'completed' ? 'bg-emerald-500/10' : 'bg-primary/10 animate-pulse'}`}>
                                            <Target className={`h-4 w-4 ${assignment.status === 'completed' ? 'text-emerald-600' : 'text-primary'}`} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold leading-none mb-1">{assignment.subject}</p>
                                            <p className="text-[10px] text-muted-foreground font-medium">
                                                {assignment.num_questions} Questions • {assignment.status === 'completed' ? 'Done' : 'In Progress'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {assignment.status === 'completed' ? (
                                            <>
                                                <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-black text-[10px]">
                                                    {assignment.score}%
                                                </Badge>
                                                {onReviewAssignment && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onReviewAssignment(assignment, child.profile.full_name || "Child");
                                                        }}
                                                        className="h-7 px-2 text-[10px] font-bold rounded-lg gap-1 border-primary/25 text-primary hover:bg-primary/10 transition-colors shadow-none"
                                                        title="Review questions and answers"
                                                    >
                                                        <Eye className="w-3 h-3" />
                                                        Review
                                                    </Button>
                                                )}
                                            </>
                                        ) : (
                                            <span className="rounded-full bg-sky-500/10 text-sky-500 border border-sky-500/30 px-2 py-0.5 font-bold text-[10px]">
                                                PENDING
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-4 rounded-2xl bg-muted/10 border border-dashed border-border flex flex-col items-center justify-center gap-1.5">
                                <p className="text-[11px] font-bold text-muted-foreground">No active tasks assigned yet</p>
                                <Button 
                                    variant="link" 
                                    size="sm" 
                                    onClick={() => onAssignPractice(child)} 
                                    className="h-auto p-0 text-xs font-bold text-primary hover:underline"
                                >
                                    + Assign First Task
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {analytics ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {/* Four Pillars Gamification & Performance Strip (PRD Section 2) */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                                <p className="text-[9px] font-black uppercase text-amber-500">Level & Points</p>
                                <p className="text-lg font-black text-foreground">
                                    Lvl {analytics.currentLevel || 1}
                                </p>
                                <p className="text-[10px] text-muted-foreground font-bold">
                                    {(analytics.lifetimeEP || 0).toLocaleString()} EP
                                </p>
                            </div>
                            <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                                <p className="text-[9px] font-black uppercase text-purple-400">League Cohort</p>
                                <p className="text-sm font-black text-foreground truncate">
                                    {analytics.leagueName || "Starter"}
                                </p>
                                <p className="text-[10px] text-muted-foreground font-bold">
                                    Tier {analytics.leagueTier || 1}
                                </p>
                            </div>
                            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                                <p className="text-[9px] font-black uppercase text-emerald-500">Conquered</p>
                                <p className="text-lg font-black text-emerald-500">
                                    {analytics.strongTopicsCount || 0}
                                </p>
                                <p className="text-[10px] text-muted-foreground font-bold">
                                    Strong Topics
                                </p>
                            </div>
                            <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20">
                                <p className="text-[9px] font-black uppercase text-orange-500">Practice Streak</p>
                                <p className="text-lg font-black text-orange-500">
                                    {analytics.streakCount || 0}d
                                </p>
                                <p className="text-[10px] text-muted-foreground font-bold">
                                    {analytics.streakShields || 0} Shields
                                </p>
                            </div>
                        </div>

                        {/* Performance Visualizer (Chart) */}
                        {analytics.subjectPerformance.length > 0 && (
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-[11px] uppercase tracking-wider text-foreground flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                        Subject Mastery
                                    </h4>
                                    <button
                                        type="button"
                                        className="text-[10px] font-bold uppercase text-primary hover:underline flex items-center gap-0.5"
                                        onClick={() => onViewReport(child)}
                                    >
                                        Full Analysis <ChevronRight size={12} />
                                    </button>
                                </div>
                                <div className="h-[130px] w-full bg-muted/30 rounded-2xl border border-border p-3 relative overflow-hidden">
                                    <ChartContainer
                                        config={{
                                            avgScore: {
                                                label: "Average Score",
                                                color: "hsl(var(--primary))",
                                            },
                                        }}
                                        className="h-full w-full aspect-auto"
                                    >
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={analytics.subjectPerformance} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="currentColor" className="stroke-border/40" />
                                                <XAxis
                                                    dataKey="subject"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: "currentColor", fontSize: 9, fontWeight: 600 }}
                                                    className="fill-muted-foreground"
                                                    dy={8}
                                                />
                                                <ChartTooltip cursor={{ fill: 'hsl(var(--primary) / 0.1)' }} content={<ChartTooltipContent valueFormatter={(val) => `${val}%`} />} />
                                                <Bar
                                                    dataKey="avgScore"
                                                    fill="hsl(var(--primary))"
                                                    radius={[4, 4, 0, 0]}
                                                    maxBarSize={28}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </ChartContainer>
                                </div>
                            </div>
                        )}
                    </div>
                ) : assignments.length === 0 ? (
                    <div className="text-center py-6 px-4 bg-muted/20 rounded-2xl border border-dashed border-border">
                        <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mx-auto mb-2 text-primary">
                            <BookOpen className="h-6 w-6" />
                        </div>
                        <p className="font-bold text-xs uppercase tracking-wider text-foreground mb-0.5">Ready for Practice</p>
                        <p className="text-[11px] text-muted-foreground max-w-[220px] mx-auto leading-relaxed">
                            Performance stats and topic analytics will appear once practice sessions start.
                        </p>
                        <Button
                            size="sm"
                            className="mt-3 rounded-xl font-semibold text-xs h-8 px-4 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                            onClick={() => onAssignPractice(child)}
                        >
                            Assign First Drill
                        </Button>
                    </div>
                ) : null}
            </CardContent>
        </Card>
    );
}

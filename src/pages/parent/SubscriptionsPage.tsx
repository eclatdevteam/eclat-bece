import { useState, useEffect, useCallback } from "react";
import { CreditCard, LayoutDashboard, Zap, CheckCircle2, Clock, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useParentAccount } from "@/hooks/useParentAccount";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DummyPaymentModal } from "@/components/parent/DummyPaymentModal";
import { format } from "date-fns";

interface LinkedChild {
    id: string;
    user_id: string;
    class_year: string;
    is_premium: boolean;
    profile: {
        full_name: string | null;
        unique_id: string;
        username: string | null;
    };
}

interface Subscription {
    id: string;
    student_id: string;
    plan: string;
    status: string;
    amount: number;
    currency: string;
    started_at: string;
    expires_at: string | null;
}

const STANDARD_FEATURES = [
    "Access to core question bank",
    "50 questions per practice session",
    "Basic subject coverage",
    "Parent progress overview",
];

const PREMIUM_FEATURES = [
    "Unlimited practice questions",
    "Full analytics & performance reports",
    "All subjects including comprehension",
    "Detailed topic-level breakdown",
    "Priority support badge",
    "Leaderboard access",
];

export default function SubscriptionsPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { parentId, loading: parentLoading } = useParentAccount();

    const [children, setChildren] = useState<LinkedChild[]>([]);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedChild, setSelectedChild] = useState<{ id: string; name: string } | null>(null);

    const fetchSubscriptionsData = useCallback(async () => {
        if (!parentId) {
            if (!parentLoading) {
                setIsLoading(false);
            }
            return;
        }
        try {
            setIsLoading(true);
            const [childrenResult, subsResult] = await Promise.all([
                supabase
                    .from("students")
                    .select("id, user_id, class_year, is_premium, profile:profiles(full_name, unique_id, username)")
                    .eq("parent_id", parentId),
                supabase
                    .from("subscriptions")
                    .select("*")
                    .eq("parent_id", parentId)
                    .eq("status", "active"),
            ]);

            if (childrenResult.data) setChildren(childrenResult.data as unknown as LinkedChild[]);
            if (subsResult.data) setSubscriptions(subsResult.data as Subscription[]);
        } catch (err) {
            console.error("Error loading subscriptions:", err);
            toast.error("Failed to load subscription data");
        } finally {
            setIsLoading(false);
        }
    }, [parentId, parentLoading]);

    useEffect(() => {
        fetchSubscriptionsData();
    }, [fetchSubscriptionsData]);

    const refetch = async () => {
        if (!parentId) return;
        const [childrenResult, subsResult] = await Promise.all([
            supabase
                .from("students")
                .select("id, user_id, class_year, is_premium, profile:profiles(full_name, unique_id, username)")
                .eq("parent_id", parentId),
            supabase
                .from("subscriptions")
                .select("*")
                .eq("parent_id", parentId)
                .eq("status", "active"),
        ]);
        if (childrenResult.data) setChildren(childrenResult.data as unknown as LinkedChild[]);
        if (subsResult.data) setSubscriptions(subsResult.data as Subscription[]);
    };

    const getSubscription = (studentId: string) =>
        subscriptions.find((s) => s.student_id === studentId);

    const classLabel = (cy: string) =>
        cy === "year_6" ? "Year 6" : cy === "year_9" ? "Year 9" : cy;

    const premiumCount = children.filter((c) => c.is_premium).length;

    return (
        <div className="p-6 space-y-10 animate-fade-in max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-border/40">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider text-xs">
                        <CreditCard className="h-4 w-4" />
                        <span>Billing & Plans</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-foreground">
                        My <span className="text-primary italic">Subscriptions</span>.
                    </h1>
                    <p className="text-muted-foreground font-medium max-w-md">
                        Manage premium access for your children and review your active plans.
                    </p>
                </div>
                <Button
                    onClick={() => navigate("/dashboard/parent")}
                    variant="outline"
                    className="rounded-2xl border-2 font-bold h-12 shadow-sm hover:bg-muted"
                >
                    <LayoutDashboard className="mr-2 h-5 w-5" />
                    Dashboard
                </Button>
            </div>

            {/* Summary Metric */}
            {!isLoading && children.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <Card className="rounded-[2rem] border-2 border-primary/10 bg-primary/5 p-6 space-y-1">
                        <p className="text-xs font-black uppercase tracking-widest text-primary/60">Total Children</p>
                        <p className="text-4xl font-black text-primary">{children.length}</p>
                    </Card>
                    <Card className="rounded-[2rem] border-2 border-amber-500/10 bg-amber-500/5 p-6 space-y-1">
                        <p className="text-xs font-black uppercase tracking-widest text-amber-600/60">Premium</p>
                        <p className="text-4xl font-black text-amber-600">{premiumCount}</p>
                    </Card>
                    <Card className="rounded-[2rem] border-2 border-muted bg-muted/20 p-6 space-y-1">
                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Standard</p>
                        <p className="text-4xl font-black text-muted-foreground">{children.length - premiumCount}</p>
                    </Card>
                </div>
            )}

            {/* Plan Comparison */}
            <div>
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-8 w-1.5 bg-primary rounded-full" />
                    <h2 className="text-2xl font-black text-foreground tracking-tight uppercase">Available Plans</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Standard */}
                    <Card className="rounded-[2rem] border-2 border-border/60 p-6 flex flex-col gap-5">
                        <div>
                            <Badge variant="outline" className="text-muted-foreground uppercase font-black text-[10px]">Standard</Badge>
                            <p className="text-3xl font-black mt-3">Free</p>
                            <p className="text-sm text-muted-foreground font-medium mt-1">Default for all children</p>
                        </div>
                        <ul className="space-y-2.5 flex-1">
                            {STANDARD_FEATURES.map((f) => (
                                <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-muted-foreground/50 shrink-0" />
                                    {f}
                                </li>
                            ))}
                        </ul>
                    </Card>

                    {/* Premium */}
                    <Card className="rounded-[2rem] border-2 border-amber-400/40 bg-gradient-to-br from-amber-500/5 to-primary/5 p-6 flex flex-col gap-5 relative overflow-hidden shadow-lg shadow-amber-500/10">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-3xl -translate-y-8 translate-x-8" />
                        <div>
                            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 uppercase font-black text-[10px]">
                                <Zap className="h-3 w-3 mr-1" />
                                Premium
                            </Badge>
                            <div className="flex items-baseline gap-2 mt-3">
                                <p className="text-3xl font-black">₦15,000</p>
                                <p className="text-sm text-muted-foreground font-medium">/ year · per child</p>
                            </div>
                            <p className="text-sm text-muted-foreground font-medium mt-1">Billed annually per child</p>
                        </div>
                        <ul className="space-y-2.5 flex-1 relative z-10">
                            {PREMIUM_FEATURES.map((f) => (
                                <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-amber-500 shrink-0" />
                                    {f}
                                </li>
                            ))}
                        </ul>
                    </Card>
                </div>
            </div>

            {/* Children Status */}
            <div>
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-8 w-1.5 bg-primary rounded-full" />
                    <h2 className="text-2xl font-black text-foreground tracking-tight uppercase">Children's Plans</h2>
                </div>

                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2].map((i) => (
                            <div key={i} className="h-24 rounded-[2rem] bg-muted animate-pulse border-2 border-border/50" />
                        ))}
                    </div>
                ) : children.length === 0 ? (
                    <Card className="rounded-[2.5rem] border-2 border-dashed border-border/60 bg-muted/20 p-16 flex flex-col items-center text-center gap-4">
                        <CreditCard className="h-12 w-12 text-muted-foreground/30" />
                        <div>
                            <p className="text-xl font-black">No children added yet</p>
                            <p className="text-muted-foreground text-sm mt-1">Add a child first to manage their subscription.</p>
                        </div>
                        <Button onClick={() => navigate("/dashboard/parent/children")} variant="hero" className="rounded-2xl font-black h-11 px-6">
                            Go to My Children
                        </Button>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {children.map((child) => {
                            const initials = child.profile.full_name?.charAt(0).toUpperCase() || "?";
                            const sub = getSubscription(child.id);
                            return (
                                <Card
                                    key={child.id}
                                    className={`rounded-[2rem] border-2 transition-all duration-200 ${child.is_premium
                                        ? "border-amber-400/30 bg-amber-500/3 hover:border-amber-400/50"
                                        : "border-border/60 hover:border-primary/30"
                                        }`}
                                >
                                    <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                                        {/* Avatar */}
                                        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center text-xl font-black text-white shrink-0 shadow-md ${child.is_premium ? "bg-gradient-to-br from-amber-400 to-amber-600" : "bg-gradient-to-br from-primary to-primary/70"}`}>
                                            {initials}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-lg font-black text-foreground truncate">{child.profile.full_name || "Unknown"}</p>
                                            <div className="flex items-center flex-wrap gap-2 mt-1">
                                                {child.is_premium ? (
                                                    <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 uppercase font-black text-[10px]">
                                                        <Zap className="h-3 w-3 mr-1" /> Premium
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-muted-foreground uppercase font-black text-[10px]">Standard</Badge>
                                                )}
                                                <span className="text-[10px] font-black text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-lg uppercase">
                                                    {classLabel(child.class_year)}
                                                </span>
                                                {sub?.expires_at && (
                                                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                                                        <Calendar className="h-3 w-3" />
                                                        Renews {format(new Date(sub.expires_at), "dd MMM yyyy")}
                                                    </span>
                                                )}
                                                {sub?.started_at && (
                                                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                                                        <Clock className="h-3 w-3" />
                                                        Since {format(new Date(sub.started_at), "dd MMM yyyy")}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action */}
                                        {!child.is_premium ? (
                                            <Button
                                                variant="hero"
                                                className="rounded-2xl font-black h-11 px-6 shadow-lg shadow-primary/20 shrink-0"
                                                onClick={() => {
                                                    setSelectedChild({ id: child.id, name: child.profile.full_name || "Child" });
                                                    setPaymentModalOpen(true);
                                                }}
                                            >
                                                <Zap className="mr-2 h-4 w-4" />
                                                Upgrade
                                            </Button>
                                        ) : (
                                            <div className="flex items-center gap-1.5 text-amber-600 font-black text-sm shrink-0">
                                                <CheckCircle2 className="h-5 w-5" />
                                                Active
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            <DummyPaymentModal
                open={paymentModalOpen}
                onOpenChange={setPaymentModalOpen}
                studentId={selectedChild?.id || ""}
                studentName={selectedChild?.name || ""}
                onSuccess={refetch}
            />
        </div>
    );
}

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Key, Eye, EyeOff } from "lucide-react";
import { getEdgeFunctionError } from "@/lib/errorUtils";

const getErrorMessage = (error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback;

interface ChangeChildPasswordDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    child: { id: string; profile: { full_name: string } } | null;
}

export function ChangeChildPasswordDialog({ open, onOpenChange, child }: ChangeChildPasswordDialogProps) {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!child) return;

        if (password.length < 6) {
            toast.error("Password must be at least 6 characters long");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setIsSubmitting(true);
        try {
            const { data, error } = await supabase.functions.invoke("manage-student-account", {
                body: {
                    studentId: child.id,
                    action: "change-password",
                    password,
                },
            });

            if (error) {
                const message = await getEdgeFunctionError(error, "Failed to change password");
                throw new Error(message);
            }
            if (data?.error) throw new Error(data.error);

            toast.success(`Password for ${child.profile.full_name} has been reset`);
            onOpenChange(false);
            setPassword("");
            setConfirmPassword("");
        } catch (error: unknown) {
            console.error("Error changing password:", error);
            toast.error(error instanceof Error ? error.message : "Failed to change password");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] rounded-2xl border border-border bg-card text-card-foreground shadow-2xl">
                <DialogHeader>
                    <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center mb-2">
                        <Key className="w-5 h-5 text-amber-500" />
                    </div>
                    <DialogTitle className="text-xl font-bold text-foreground">Change Password</DialogTitle>
                    <DialogDescription className="font-medium text-muted-foreground text-xs sm:text-sm">
                        Set a new password for <span className="text-foreground font-semibold">{child?.profile.full_name}</span>.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-5 py-2">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="newPassword" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                New Password
                            </Label>
                            <div className="relative group">
                                <Input
                                    id="newPassword"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Minimum 6 characters"
                                    className="h-11 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground font-medium focus-visible:ring-1 focus-visible:ring-amber-500 pr-12 transition-all"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Confirm Password
                            </Label>
                            <Input
                                id="confirmPassword"
                                type={showPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Repeat new password"
                                className="h-11 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground font-medium focus-visible:ring-1 focus-visible:ring-amber-500"
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter className="pt-2 flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="rounded-xl font-semibold h-11 px-5"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || !password || password !== confirmPassword}
                            className="rounded-xl font-bold h-11 px-6 bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-sm"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Resetting...
                                </>
                            ) : (
                                "Update Password"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

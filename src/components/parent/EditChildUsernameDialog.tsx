import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Fingerprint } from "lucide-react";
import { getEdgeFunctionError } from "@/lib/errorUtils";

const getErrorMessage = (error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback;

interface EditChildUsernameDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    child: { id: string; profile: { username?: string } } | null;
    onSuccess: () => void;
}

export function EditChildUsernameDialog({ open, onOpenChange, child, onSuccess }: EditChildUsernameDialogProps) {
    const [username, setUsername] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (child) {
            setUsername(child.profile.username || "");
        }
    }, [child, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!child || !username.trim()) return;

        const normalizedUsername = username.trim().toLowerCase();

        if (normalizedUsername.length < 2 || normalizedUsername.length > 20) {
            toast.error("Username must be between 2 and 20 characters");
            return;
        }

        if (normalizedUsername === child.profile.username?.toLowerCase()) {
            onOpenChange(false);
            return;
        }

        setIsSubmitting(true);
        try {
            const { data, error } = await supabase.functions.invoke("manage-student-account", {
                body: {
                    studentId: child.id,
                    action: "edit-username",
                    username: normalizedUsername,
                },
            });

            if (error) {
                const message = await getEdgeFunctionError(error, "Failed to update username");
                throw new Error(message);
            }
            if (data?.error) throw new Error(data.error);

            toast.success("Username updated successfully");
            onSuccess();
            onOpenChange(false);
        } catch (error: unknown) {
            console.error("Error updating username:", error);
            toast.error(error instanceof Error ? error.message : "Failed to update username");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] rounded-2xl border border-border bg-card text-card-foreground shadow-2xl">
                <DialogHeader>
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-2">
                        <Fingerprint className="w-5 h-5" />
                    </div>
                    <DialogTitle className="text-xl font-bold text-foreground">Edit Username</DialogTitle>
                    <DialogDescription className="font-medium text-muted-foreground text-xs sm:text-sm">
                        Change your child's login username. It must be unique.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-5 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="username" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Username
                        </Label>
                        <Input
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value.replace(/\s+/g, '').toLowerCase())}
                            placeholder="e.g. jdoe123"
                            className="h-11 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground font-mono focus-visible:ring-1 focus-visible:ring-primary lowercase"
                            required
                        />
                        <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1.5 px-1">
                            Username must be 2-20 characters, lowercase, and contain no spaces.
                        </p>
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
                            disabled={isSubmitting || !username.trim() || username.trim().toLowerCase() === child?.profile.username?.toLowerCase()}
                            className="rounded-xl font-bold h-11 px-6 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Checking...
                                </>
                            ) : (
                                "Update Username"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

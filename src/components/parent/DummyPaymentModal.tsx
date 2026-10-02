import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Zap } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getEdgeFunctionError } from "@/lib/errorUtils";

const getErrorMessage = (error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback;

interface DummyPaymentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    studentId: string;
    studentName: string;
    onSuccess: () => void;
}

export function DummyPaymentModal({
    open,
    onOpenChange,
    studentId,
    studentName,
    onSuccess,
}: DummyPaymentModalProps) {
    const [isProcessing, setIsProcessing] = useState(false);

    const handlePayment = async () => {
        setIsProcessing(true);

        try {
            // Simulate payment processing delay
            await new Promise((resolve) => setTimeout(resolve, 1500));

            const { data, error } = await supabase.functions.invoke("manage-student-account", {
                body: { studentId, action: "upgrade-premium" },
            });

            if (error) {
                const message = await getEdgeFunctionError(error, "Payment failed. Please try again.");
                throw new Error(message);
            }
            if (data?.error) throw new Error(data.error);

            toast.success(`${studentName} now has Premium Access!`);
            onSuccess();
            onOpenChange(false);
        } catch (error: unknown) {
            console.error("Error processing payment:", error);
            toast.error(error instanceof Error ? error.message : "Payment failed. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] rounded-2xl border border-border bg-card text-card-foreground shadow-2xl">
                <DialogHeader>
                    <div className="mx-auto bg-primary/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-3 text-primary">
                        <Zap className="h-6 w-6 text-primary" />
                    </div>
                    <DialogTitle className="text-center text-xl font-bold text-foreground">Unlock Premium Features</DialogTitle>
                    <DialogDescription className="text-center text-muted-foreground text-xs sm:text-sm">
                        Upgrade <strong className="text-foreground font-semibold">{studentName}</strong>'s account for unlimited practice questions and detailed analytics.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="bg-muted/40 p-4 rounded-xl border border-border flex justify-between items-center">
                        <div>
                            <p className="font-semibold text-foreground text-sm">1 Year Subscription</p>
                            <p className="text-xs text-muted-foreground">Billed annually</p>
                        </div>
                        <p className="text-2xl font-black text-primary">₦15,000</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl inline-block leading-relaxed">
                            Notice: This is a dummy payment process for testing. No real charges will be made.
                        </p>
                    </div>
                </div>
                <DialogFooter className="sm:justify-between flex gap-2 pt-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isProcessing}
                        className="rounded-xl font-semibold h-11 px-5"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handlePayment}
                        disabled={isProcessing}
                        className="rounded-xl font-bold h-11 px-6 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm gap-2"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            "Pay Now (Test)"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

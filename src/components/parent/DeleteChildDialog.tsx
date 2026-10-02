import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Trash2 } from "lucide-react";
import { LinkedChild } from "@/types/parent";
import { Button } from "@/components/ui/button";

interface DeleteChildDialogProps {
    child: LinkedChild | null;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    isDeleting: boolean;
}

export function DeleteChildDialog({
    child,
    isOpen,
    onOpenChange,
    onConfirm,
    isDeleting,
}: DeleteChildDialogProps) {
    if (!child) return null;

    return (
        <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
            <AlertDialogContent className="rounded-2xl border border-destructive/20 bg-card text-card-foreground p-6 sm:p-8 max-w-lg shadow-2xl">
                <AlertDialogHeader className="space-y-3">
                    <div className="w-12 h-12 bg-destructive/10 rounded-2xl flex items-center justify-center mb-1 text-destructive">
                        <Trash2 className="h-6 w-6" />
                    </div>
                    <AlertDialogTitle className="text-2xl font-bold tracking-tight text-foreground">
                        Delete Student Account?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-sm font-medium leading-relaxed text-muted-foreground">
                        This will permanently delete all data, including quiz results, progress, and account access for{" "}
                        <strong className="text-foreground font-bold">{child.profile.full_name}</strong>.
                        <br /><br />
                        This action <span className="text-destructive font-bold uppercase tracking-wider">cannot be undone</span>.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-8 gap-3 sm:flex-row flex-col">
                    <AlertDialogCancel asChild>
                        <Button variant="outline" className="flex-1 rounded-xl font-semibold h-12 transition-all">
                            Keep Account
                        </Button>
                    </AlertDialogCancel>
                    <AlertDialogAction asChild>
                        <Button
                            variant="destructive"
                            onClick={(e) => {
                                e.preventDefault();
                                onConfirm();
                            }}
                            disabled={isDeleting}
                            className="flex-1 rounded-xl font-bold bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-md h-12 transition-all"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Permanently Delete"
                            )}
                        </Button>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

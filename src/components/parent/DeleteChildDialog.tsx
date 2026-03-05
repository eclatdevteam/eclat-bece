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
            <AlertDialogContent className="rounded-[2.5rem] border-2 border-destructive/20 p-8 max-w-lg">
                <AlertDialogHeader className="space-y-4">
                    <div className="w-16 h-16 bg-destructive/10 rounded-3xl flex items-center justify-center mb-2">
                        <Trash2 className="h-8 w-8 text-destructive" />
                    </div>
                    <AlertDialogTitle className="text-3xl font-black tracking-tight text-foreground">
                        Delete Student Account?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-base font-medium leading-relaxed text-muted-foreground">
                        This will permanently delete all data, including quiz results, progress, and account access for{" "}
                        <strong className="text-foreground font-black underline decoration-primary/30 underline-offset-4">{child.profile.full_name}</strong>.
                        <br /><br />
                        This action <span className="text-destructive font-black uppercase tracking-wider">cannot be undone</span>.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-10 gap-3 sm:flex-row flex-col">
                    <AlertDialogCancel asChild>
                        <Button variant="outline" className="flex-1 rounded-2xl font-bold border-2 h-14 hover:bg-muted transition-all">
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
                            className="flex-1 rounded-2xl font-black bg-destructive hover:bg-destructive/90 text-white shadow-lg shadow-destructive/20 h-14 transition-all"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
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

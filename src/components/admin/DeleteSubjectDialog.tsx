import { useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Trash2, Archive, Loader2, ShieldCheck } from "lucide-react";
import { SubjectWithCounts } from "@/types/subject";

interface DeleteSubjectDialogProps {
  subject: SubjectWithCounts | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (id: string, forceArchive: boolean) => Promise<any>;
}

export function DeleteSubjectDialog({
  subject,
  open,
  onOpenChange,
  onDelete,
}: DeleteSubjectDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!subject) return null;

  const totalQuestions = subject.total_count || 0;
  const isPopulated = totalQuestions > 0;

  const handleAction = async (archiveOnly: boolean) => {
    setIsDeleting(true);
    try {
      await onDelete(subject.id, archiveOnly);
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[480px]">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className={`h-11 w-11 rounded-full flex items-center justify-center shrink-0 ${
              isPopulated ? "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400" : "bg-destructive/10 text-destructive"
            }`}>
              {isPopulated ? <AlertTriangle className="h-6 w-6" /> : <Trash2 className="h-6 w-6" />}
            </div>
            <div>
              <AlertDialogTitle className="text-lg">
                {isPopulated ? `Deactivate "${subject.name}"?` : `Delete "${subject.name}"?`}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-muted-foreground mt-0.5">
                Code: {subject.code} • Category: {subject.category === "core" ? "Core" : "Elective"}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="space-y-3 py-2 text-sm">
          {isPopulated ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20 p-3 space-y-2">
              <p className="text-amber-900 dark:text-amber-200 text-xs leading-relaxed">
                <strong>Cannot Permanently Delete:</strong> This subject has questions attached in the database:
              </p>
              <div className="flex flex-wrap gap-2 pt-0.5">
                <Badge variant="outline" className="bg-white dark:bg-slate-900 text-xs">
                  Year 6: {subject.year_6_count.toLocaleString()} questions
                </Badge>
                <Badge variant="outline" className="bg-white dark:bg-slate-900 text-xs">
                  Year 9: {subject.year_9_count.toLocaleString()} questions
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground pt-1">
                To prevent orphaned records and preserve student practice history, please <strong>Deactivate (Archive)</strong> this subject instead. It will be hidden from student practice and new question authoring.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border bg-muted/40 p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
                <span>Zero Attached Questions Detected</span>
              </div>
              <p className="text-xs text-muted-foreground">
                This subject has no questions in Year 6 or Year 9. It is completely safe to permanently delete from the system.
              </p>
            </div>
          )}
        </div>

        <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          {isPopulated ? (
            <Button
              variant="default"
              onClick={() => handleAction(true)}
              disabled={isDeleting}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              <Archive className="h-4 w-4 mr-1.5" />
              Deactivate Subject
            </Button>
          ) : (
            <Button
              variant="destructive"
              onClick={() => handleAction(false)}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              <Trash2 className="h-4 w-4 mr-1.5" />
              Permanently Delete
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

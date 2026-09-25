import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Edit3, AlertTriangle } from "lucide-react";
import { SubjectWithCounts, SubjectCategory } from "@/types/subject";
import { toast } from "sonner";

interface EditSubjectDialogProps {
  subject: SubjectWithCounts | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, input: any) => Promise<any>;
  onRenameCascade: (id: string, newName: string) => Promise<any>;
}

export function EditSubjectDialog({
  subject,
  open,
  onOpenChange,
  onUpdate,
  onRenameCascade,
}: EditSubjectDialogProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [category, setCategory] = useState<SubjectCategory>("core");
  const [description, setDescription] = useState("");
  const [availableYear6, setAvailableYear6] = useState(true);
  const [availableYear9, setAvailableYear9] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (subject) {
      setName(subject.name);
      setCode(subject.code);
      setCategory(subject.category || "core");
      setDescription(subject.description || "");
      setAvailableYear6(subject.available_year_6);
      setAvailableYear9(subject.available_year_9);
      setIsActive(subject.is_active);
      setDisplayOrder(subject.display_order);
    }
  }, [subject]);

  if (!subject) return null;

  const nameChanged = name.trim() !== subject.name;
  const hasQuestions = (subject.total_count || 0) > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Subject name is required");
      return;
    }
    if (!code.trim()) {
      toast.error("Subject code is required");
      return;
    }
    if (!availableYear6 && !availableYear9) {
      toast.error("At least one cohort (Year 6 or Year 9) must be selected");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. If name changed and questions exist, run cascade rename
      if (nameChanged) {
        const renameRes = await onRenameCascade(subject.id, name.trim());
        if (!renameRes?.success) {
          setIsSubmitting(false);
          return;
        }
      }

      // 2. Update remaining fields
      await onUpdate(subject.id, {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        category,
        description: description.trim() || undefined,
        available_year_6: availableYear6,
        available_year_9: availableYear9,
        is_active: isActive,
        display_order: Number(displayOrder) || 0,
      });

      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-primary" />
            Edit Subject: {subject.name}
          </DialogTitle>
          <DialogDescription>
            Update subject metadata, cohort availability, and active status.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {nameChanged && hasQuestions && (
            <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/30">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-xs text-amber-800 dark:text-amber-300">
                <strong>Cascade Rename Warning:</strong> Renaming this subject from &quot;{subject.name}&quot; to &quot;{name}&quot; will automatically update all {subject.total_count} existing questions, passages, and assignments in the database.
              </AlertDescription>
            </Alert>
          )}

          {/* Name & Code */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="edit-name" className="h-5 flex items-center">
                Subject Name *
              </Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-code" className="h-5 flex items-center">
                Short Code *
              </Label>
              <Input
                id="edit-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={8}
                required
              />
            </div>
          </div>

          {/* Curriculum Category */}
          <div className="space-y-1.5">
            <Label>Curriculum Category</Label>
            <Select value={category} onValueChange={(v: SubjectCategory) => setCategory(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="core">Core Subject</SelectItem>
                <SelectItem value="elective">Elective Subject</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Cohort Applicability */}
          <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Applicable Cohorts *
            </Label>
            <div className="flex flex-col sm:flex-row gap-4 pt-1">
              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <Checkbox
                  checked={availableYear6}
                  onCheckedChange={(checked) => setAvailableYear6(!!checked)}
                />
                <span>Year 6 (Primary)</span>
              </label>
              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <Checkbox
                  checked={availableYear9}
                  onCheckedChange={(checked) => setAvailableYear9(!!checked)}
                />
                <span>Year 9 (BECE)</span>
              </label>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Display Order & Active Switch */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2">
              <Label htmlFor="edit-order" className="text-xs text-muted-foreground">
                Display Order:
              </Label>
              <Input
                id="edit-order"
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                className="w-20 h-8 text-xs"
                min={0}
              />
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="is-active" className="text-xs font-medium cursor-pointer">
                {isActive ? "Active in Curriculum" : "Deactivated (Archived)"}
              </Label>
              <Switch
                id="is-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Sparkles, BookOpen } from "lucide-react";
import { CreateSubjectInput, generateSubjectCode, SubjectCategory } from "@/types/subject";
import { toast } from "sonner";

interface CreateSubjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateSubjectInput) => Promise<{ success: boolean; error?: string }>;
}

const COMMON_EMOJIS = ["📚", "📐", "🔬", "🌍", "📝", "💼", "💻", "🎨", "🧪", "🧬", "⚡", "📖", "🏃", "🎶", "⚖️", "🌱"];

export function CreateSubjectDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreateSubjectDialogProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [icon, setIcon] = useState("📚");
  const [category, setCategory] = useState<SubjectCategory>("core");
  const [description, setDescription] = useState("");
  const [availableYear6, setAvailableYear6] = useState(true);
  const [availableYear9, setAvailableYear9] = useState(true);
  const [displayOrder, setDisplayOrder] = useState<number>(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [codeManuallyEdited, setCodeManuallyEdited] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setCode("");
      setIcon("📚");
      setCategory("core");
      setDescription("");
      setAvailableYear6(true);
      setAvailableYear9(true);
      setDisplayOrder(10);
      setCodeManuallyEdited(false);
    }
  }, [open]);

  // Auto-generate code from subject name unless manually changed
  const handleNameChange = (val: string) => {
    setName(val);
    if (!codeManuallyEdited) {
      setCode(generateSubjectCode(val));
    }
  };

  const handleCodeChange = (val: string) => {
    setCode(val.toUpperCase());
    setCodeManuallyEdited(true);
  };

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
      toast.error("Please select at least one applicable cohort (Year 6 or Year 9)");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onSubmit({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        icon,
        category,
        description: description.trim() || undefined,
        available_year_6: availableYear6,
        available_year_9: availableYear9,
        display_order: Number(displayOrder) || 10,
        is_active: true,
      });

      if (res.success) {
        onOpenChange(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Create New Subject
          </DialogTitle>
          <DialogDescription>
            Add an academic subject to the curriculum and configure its cohort availability.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Name & Code */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="subject-name">Subject Name *</Label>
              <Input
                id="subject-name"
                placeholder="e.g. French Language"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="subject-code" className="flex items-center gap-1">
                Short Code *
                <Sparkles className="h-3 w-3 text-muted-foreground" title="Auto-generated" />
              </Label>
              <Input
                id="subject-code"
                placeholder="e.g. FREN"
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                maxLength={8}
                required
              />
            </div>
          </div>

          {/* Icon & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Subject Icon</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-16 text-center text-xl h-10 p-0"
                  maxLength={4}
                />
                <div className="flex flex-wrap gap-1 max-w-[170px]">
                  {COMMON_EMOJIS.slice(0, 8).map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setIcon(emoji)}
                      className={`h-7 w-7 text-sm rounded border flex items-center justify-center transition hover:bg-muted ${
                        icon === emoji ? "border-primary bg-primary/10" : "border-border"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

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
                <span>Year 6 (Common Entrance / Primary)</span>
              </label>
              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <Checkbox
                  checked={availableYear9}
                  onCheckedChange={(checked) => setAvailableYear9(!!checked)}
                />
                <span>Year 9 (BECE / Junior High)</span>
              </label>
            </div>
          </div>

          {/* Description & Display Order */}
          <div className="space-y-1.5">
            <Label htmlFor="subject-description">Description (Optional)</Label>
            <Textarea
              id="subject-description"
              placeholder="Brief summary of learning objectives for this subject..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <Label htmlFor="display-order" className="text-xs text-muted-foreground">
                Display Order:
              </Label>
              <Input
                id="display-order"
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                className="w-20 h-8 text-xs"
                min={1}
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
              Create Subject
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

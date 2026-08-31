import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Copy, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SchoolData {
  id: string;
  user_id: string;
  school_code: string;
  school_name: string | null;
  contact_email: string | null;
  address: string | null;
}

interface SchoolSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  school: SchoolData | null;
  onSuccess: (updated: Partial<SchoolData>) => void;
}

export function SchoolSettingsDialog({ open, onOpenChange, school, onSuccess }: SchoolSettingsDialogProps) {
  const [schoolName, setSchoolName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [address, setAddress] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (school) {
      setSchoolName(school.school_name || "");
      setContactEmail(school.contact_email || "");
      setAddress(school.address || "");
    }
  }, [school, open]);

  const handleCopyCode = async () => {
    if (!school?.school_code) return;
    try {
      await navigator.clipboard.writeText(school.school_code);
      setCopied(true);
      toast.success("School code copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy school code");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school) return;

    if (!schoolName.trim()) {
      toast.error("School name is required");
      return;
    }

    setIsSaving(true);
    try {
      const updates = {
        school_name: schoolName.trim(),
        contact_email: contactEmail.trim() || null,
        address: address.trim() || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("schools")
        .update(updates)
        .eq("id", school.id);

      if (error) throw error;

      toast.success("School profile updated successfully!");
      onSuccess(updates);
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating school settings:", error);
      toast.error(error.message || "Failed to update school settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <DialogTitle className="text-xl">School Profile & Settings</DialogTitle>
          </div>
          <DialogDescription>
            Manage your school details and connection code for student onboarding.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 py-2">
          {/* School Code Badge */}
          <div className="p-4 bg-muted/60 rounded-xl border border-border/60 space-y-2">
            <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              School Connection Code
            </Label>
            <div className="flex items-center justify-between gap-3">
              <span className="text-2xl font-black text-primary font-mono tracking-widest">
                {school?.school_code || "—"}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyCode}
                className="gap-1.5"
              >
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy Code"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Students enter this code in their Account Settings to link their account to your school.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="school-name">School Name</Label>
            <Input
              id="school-name"
              placeholder="e.g. Corona Secondary School"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              required
              maxLength={150}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-email">Contact / Administrative Email</Label>
            <Input
              id="contact-email"
              type="email"
              placeholder="e.g. admin@school.edu"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              maxLength={255}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">School Address</Label>
            <Input
              id="address"
              placeholder="e.g. Victoria Island, Lagos"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              maxLength={250}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" variant="hero" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

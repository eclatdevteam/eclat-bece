import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Check, Copy, Mail, Shield, Clock, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface InviteSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invitee: {
    email: string;
    fullName: string;
    isSuperAdmin: boolean;
    token: string;
    emailSent: boolean;
  } | null;
}

export function InviteSuccessDialog({
  open,
  onOpenChange,
  invitee,
}: InviteSuccessDialogProps) {
  const [copied, setCopied] = useState(false);

  if (!invitee) return null;

  const inviteLink = `${window.location.origin}/admin/setup/${invitee.token}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast.success("Invitation link copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-3xl border-2 p-6 sm:p-7">
        <DialogHeader className="text-center sm:text-left space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mb-1">
            <Mail className="h-6 w-6" />
          </div>
          <DialogTitle className="text-2xl font-black text-foreground">
            Invitation Generated
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
            An administrator setup link has been created for {invitee.fullName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {/* Invitee Summary Box */}
          <div className="p-4 rounded-2xl bg-muted/60 border border-border/80 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-semibold">Recipient:</span>
              <span className="font-bold text-foreground">{invitee.fullName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-semibold">Email:</span>
              <span className="font-bold text-foreground">{invitee.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-semibold">Role:</span>
              <Badge
                variant={invitee.isSuperAdmin ? "default" : "secondary"}
                className="text-[10px] font-extrabold"
              >
                {invitee.isSuperAdmin ? "Super Admin" : "Staff Admin"}
              </Badge>
            </div>
          </div>

          {/* Invitation URL Copy Box */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              Direct Setup Link
            </label>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={inviteLink}
                className="h-10 text-xs font-mono bg-background border-2 border-border/80 rounded-xl pr-2 select-all"
              />
              <Button
                type="button"
                variant={copied ? "default" : "outline"}
                size="sm"
                onClick={handleCopy}
                className="h-10 px-3.5 rounded-xl font-bold text-xs gap-1.5 border-2 flex-shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-white" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copy</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Expiry & Email Status Alert */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-300">
            <Clock className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              This setup link will expire in <strong>24 hours</strong>. {invitee.emailSent ? "An email notification was also dispatched." : "Please copy and share this link directly with the recipient."}
            </p>
          </div>
        </div>

        <DialogFooter className="pt-2 sm:justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => window.open(inviteLink, "_blank")}
            className="text-xs font-bold text-muted-foreground hover:text-foreground gap-1.5"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Test Link in New Tab
          </Button>

          <Button
            type="button"
            variant="hero"
            onClick={() => onOpenChange(false)}
            className="text-xs font-bold rounded-xl px-5 h-9"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

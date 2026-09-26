import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, Copy, Check, Award, ShieldCheck, Sparkles, ExternalLink } from "lucide-react";
import { StudentCertificate } from "@/services/gamification/certificateService";
import { toast } from "sonner";

interface DistinctionCertificateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certificate: StudentCertificate | null;
}

export function DistinctionCertificateModal({
  open,
  onOpenChange,
  certificate,
}: DistinctionCertificateModalProps) {
  const [copied, setCopied] = useState(false);
  const certRef = useRef<HTMLDivElement>(null);

  if (!certificate) return null;

  const studentName = certificate.metadata?.student_name || "Scholar";
  const schoolName = certificate.metadata?.school_name || "Éclat Academy";
  const academicYear = certificate.metadata?.academic_year || "2026 Academic Year";
  const honorsRank = certificate.metadata?.honors_rank;
  const formattedDate = new Date(certificate.issued_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const verificationUrl = `${window.location.origin}/verify-certificate?code=${encodeURIComponent(
    certificate.verification_code
  )}`;

  const handleCopyVerificationLink = async () => {
    try {
      await navigator.clipboard.writeText(verificationUrl);
      setCopied(true);
      toast.success("Verification link copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-4 sm:p-6 bg-background">
        <DialogHeader className="print:hidden pb-2 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              <DialogTitle className="text-lg font-bold">Verified Academic Distinction Certificate</DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-8 text-xs font-bold"
                onClick={handleCopyVerificationLink}
              >
                {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Link Copied" : "Copy Verification Link"}
              </Button>
              <Button
                variant="hero"
                size="sm"
                className="gap-1.5 h-8 text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-white"
                onClick={handlePrint}
              >
                <Printer className="h-3.5 w-3.5" />
                Print / Save PDF
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Certificate Canvas */}
        <div
          ref={certRef}
          className="print:fixed print:inset-0 print:m-0 print:p-8 print:w-full print:h-full print:bg-white print:z-50 my-2 relative rounded-2xl border-8 border-double border-amber-500/50 bg-gradient-to-br from-amber-50/40 via-background to-amber-100/30 dark:from-slate-950 dark:via-background dark:to-amber-950/20 p-6 sm:p-10 shadow-lg text-center select-none"
        >
          {/* Ornate Corner Flourishes */}
          <div className="absolute top-2 left-2 text-amber-500/40 text-xl font-serif">❧</div>
          <div className="absolute top-2 right-2 text-amber-500/40 text-xl font-serif">☙</div>
          <div className="absolute bottom-2 left-2 text-amber-500/40 text-xl font-serif">❧</div>
          <div className="absolute bottom-2 right-2 text-amber-500/40 text-xl font-serif">☙</div>

          {/* Certificate Inner Border */}
          <div className="border-2 border-amber-500/30 rounded-xl p-6 sm:p-8 space-y-6">
            {/* Header / Academy Crest */}
            <div className="space-y-1">
              <div className="inline-flex items-center justify-center p-3 rounded-full bg-amber-500/10 border-2 border-amber-500/30 shadow-xs mb-2">
                <Sparkles className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-amber-700 dark:text-amber-400">
                Éclat Preparatory &amp; Educational Systems
              </p>
              <h2 className="text-xl sm:text-2xl font-serif font-black tracking-wider text-foreground">
                CERTIFICATE OF ACADEMIC DISTINCTION
              </h2>
            </div>

            {/* Recipient Declaration */}
            <div className="space-y-2">
              <p className="text-xs italic text-muted-foreground font-serif">
                This official distinction is proudly and solemnly conferred upon
              </p>
              <h1 className="text-3xl sm:text-4xl font-serif font-extrabold text-foreground tracking-wide py-1 border-b-2 border-amber-500/40 inline-block px-8">
                {studentName}
              </h1>
              <p className="text-xs font-bold text-muted-foreground">
                {schoolName} • {academicYear}
              </p>
            </div>

            {/* Achievement Citation */}
            <div className="max-w-xl mx-auto space-y-2">
              <h3 className="text-lg font-bold text-amber-700 dark:text-amber-400">
                {certificate.title}
              </h3>
              <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed font-serif italic">
                "{certificate.description}"
              </p>
              {honorsRank && (
                <div className="pt-1">
                  <Badge variant="outline" className="border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold px-3 py-1">
                    Honorary Rank: {honorsRank}
                  </Badge>
                </div>
              )}
            </div>

            {/* Seal & Signatures Footer */}
            <div className="pt-6 border-t border-amber-500/20 grid grid-cols-3 items-end gap-4 text-center">
              {/* Left Signatory */}
              <div className="space-y-1">
                <div className="font-serif italic text-sm text-foreground/80 border-b border-foreground/30 pb-0.5">
                  Academic Director
                </div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                  Éclat Board of Examiners
                </p>
              </div>

              {/* Center Seal */}
              <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full border-4 border-double border-amber-600 bg-gradient-to-br from-amber-400 to-amber-600 flex flex-col items-center justify-center text-white shadow-md">
                  <ShieldCheck className="h-6 w-6" />
                  <span className="text-[8px] font-black tracking-widest uppercase">VERIFIED</span>
                </div>
                <p className="text-[9px] font-bold text-muted-foreground mt-1">{formattedDate}</p>
              </div>

              {/* Right Signatory / Verification Code */}
              <div className="space-y-1">
                <div className="font-mono font-black text-xs text-primary border-b border-foreground/30 pb-0.5 truncate">
                  {certificate.verification_code}
                </div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                  Registry Verification ID
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Certificate Info Bar (Screen Only) */}
        <div className="print:hidden flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/50 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Permanent verifiable record in the Éclat Academic Credential Registry</span>
          </div>
          <a
            href={verificationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 font-bold text-primary hover:underline"
          >
            <span>Verify Online</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}

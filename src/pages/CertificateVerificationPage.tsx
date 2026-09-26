import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, AlertCircle, Search, Award, CheckCircle2, ArrowLeft, Printer, Sparkles } from "lucide-react";
import { verifyCertificateByCode, StudentCertificate } from "@/services/gamification/certificateService";
import { DistinctionCertificateModal } from "@/components/certificate/DistinctionCertificateModal";
import { useTheme } from "next-themes";
import logoDark from "@/assets/logo-dark.png";
import logoLight from "@/assets/logo-light.png";

export default function CertificateVerificationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const logo = theme === "dark" ? logoLight : logoDark;

  const initialCode = searchParams.get("code") || "";
  const [code, setCode] = useState(initialCode);
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<{
    performed: boolean;
    valid: boolean;
    certificate?: StudentCertificate;
    error?: string;
  }>({ performed: false, valid: false });

  const [modalOpen, setModalOpen] = useState(false);

  const handleVerify = async (lookupCode: string) => {
    if (!lookupCode.trim()) return;
    setIsVerifying(true);
    const res = await verifyCertificateByCode(lookupCode);
    setResult({
      performed: true,
      valid: res.valid,
      certificate: res.certificate,
      error: res.error,
    });
    setIsVerifying(false);
  };

  useEffect(() => {
    if (initialCode) {
      handleVerify(initialCode);
    }
  }, [initialCode]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light/20 via-background to-accent-light/20 dashboard-theme flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="Éclat Logo"
              className="h-10 w-auto cursor-pointer"
              onClick={() => navigate("/")}
            />
            <span className="hidden sm:inline text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
              Credential Registry
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-1.5 font-bold">
            <ArrowLeft size={16} /> Home
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 flex-1 max-w-3xl">
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 text-primary mb-2">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
            Academic Certificate Verification
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
            Verify the authenticity of distinction certificates, mythic achievements, and national league titles issued by the Éclat Academic Registry.
          </p>
        </div>

        {/* Verification Input Card */}
        <Card className="border-2 shadow-md mb-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Enter Verification Code</CardTitle>
            <CardDescription className="text-xs">
              Found at the bottom right corner of any official Éclat certificate (e.g., ECLAT-CERT-2026-X9Q2)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleVerify(code);
              }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. ECLAT-CERT-2026-9F7K"
                  className="pl-10 font-mono font-bold tracking-wider uppercase h-11"
                />
              </div>
              <Button
                type="submit"
                variant="hero"
                disabled={isVerifying || !code.trim()}
                className="h-11 px-6 font-bold"
              >
                {isVerifying ? "Verifying..." : "Verify Certificate"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Result Area */}
        {result.performed && (
          <div className="animate-scale-in">
            {result.valid && result.certificate ? (
              <Card className="border-2 border-emerald-500/50 bg-emerald-50/20 dark:bg-emerald-950/10 shadow-lg">
                <CardHeader className="pb-3 border-b border-emerald-500/20">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-6 w-6" />
                      <span className="font-black text-sm uppercase tracking-wider">
                        Official Verified Credential
                      </span>
                    </div>
                    <Badge variant="outline" className="font-mono text-xs border-emerald-500/40 text-emerald-700 dark:text-emerald-300">
                      {result.certificate.verification_code}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-5">
                  <div>
                    <p className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Recipient</p>
                    <p className="text-2xl font-serif font-black text-foreground">
                      {result.certificate.metadata?.student_name || "Official Scholar"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {result.certificate.metadata?.school_name} • {result.certificate.metadata?.academic_year}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-background border border-emerald-500/20 space-y-2">
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-amber-500" />
                      <h3 className="font-bold text-base text-foreground">{result.certificate.title}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground italic leading-relaxed">
                      "{result.certificate.description}"
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs pt-2 border-t border-border/40">
                    <div>
                      <span className="text-muted-foreground">Date Issued:</span>
                      <p className="font-bold text-foreground">
                        {new Date(result.certificate.issued_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Issuing Authority:</span>
                      <p className="font-bold text-foreground">Éclat Academic Registry</p>
                    </div>
                  </div>

                  <Button
                    variant="hero"
                    className="w-full gap-2 font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-white"
                    onClick={() => setModalOpen(true)}
                  >
                    <Printer className="h-4 w-4" /> View Full Certificate &amp; Print
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-2 border-destructive/40 bg-destructive/5">
                <CardContent className="p-6 text-center space-y-3">
                  <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
                  <h3 className="font-bold text-lg text-foreground">Certificate Not Found</h3>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    {result.error || "The verification code entered does not match any record in the Éclat Academic Credential Registry. Please ensure the code was typed correctly."}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>

      {/* Distinction Certificate Modal */}
      {result.certificate && (
        <DistinctionCertificateModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          certificate={result.certificate}
        />
      )}
    </div>
  );
}

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { 
  GraduationCap, 
  Users, 
  School, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles, 
  ArrowLeft,
  BookOpen
} from "lucide-react";
import logoDark from "@/assets/logo-dark.png";
import logoLight from "@/assets/logo-light.png";

export type AuthRole = "student" | "parent" | "school" | "admin" | "general";

interface AuthLayoutProps {
  role?: AuthRole;
  badgeText?: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footerLink?: {
    text: string;
    actionText: string;
    to?: string;
    onClick?: () => void;
  };
}

export function AuthLayout({
  role = "general",
  badgeText,
  title,
  subtitle,
  children,
  footerLink,
}: AuthLayoutProps) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const logo = theme === "dark" ? logoLight : logoDark;

  // Minimalist, punchy role showcases
  const roleShowcase = {
    student: {
      badge: "Student Portal",
      icon: GraduationCap,
      headline: "Prepare. Practice. Excel.",
      description: "Nigeria's premier CBT exam preparation arena for Common Entrance and BECE scholars.",
      highlights: [
        "Authentic BECE & Common Entrance question bank",
        "Monthly ₦50,000 scholarship rewards",
        "Instant step-by-step answer explanations",
      ],
    },
    parent: {
      badge: "Parent Portal",
      icon: Users,
      headline: "Support Your Child's Success",
      description: "Gain complete clarity on your child's curriculum strengths and assign targeted practice quizzes.",
      highlights: [
        "Real-time diagnostic analytics across subjects",
        "Custom homework quiz assignments",
        "Multi-child management from one dashboard",
      ],
    },
    school: {
      badge: "School Portal",
      icon: School,
      headline: "Institutional Diagnostic Suite",
      description: "Manage Year 6 and Year 9 cohorts, schedule CBT mock exams, and monitor curriculum readiness.",
      highlights: [
        "Curriculum cohort management (Primary 6 & JSS 3)",
        "Class-wide quiz assignments & instant grading",
        "One-click CSV performance gradebook export",
      ],
    },
    admin: {
      badge: "Administration",
      icon: ShieldCheck,
      headline: "Platform Operations",
      description: "Centralized administration for curriculum banks, competitions, and user management.",
      highlights: [
        "Curriculum question bank authoring",
        "Competition management & audit controls",
        "Platform-wide user administration",
      ],
    },
    general: {
      badge: "Éclat Education",
      icon: BookOpen,
      headline: "Excellence in Examination Prep",
      description: "Empowering Nigerian scholars with authentic CBT practice and national rewards.",
      highlights: [
        "WAEC BECE & National Common Entrance",
        "Interactive study tools & diagnostic feedback",
        "National scholarship competitions",
      ],
    },
  }[role];

  const ShowcaseIcon = roleShowcase.icon;

  return (
    <div className="min-h-screen bg-background flex flex-col lg:grid lg:grid-cols-12 overflow-x-hidden">
      {/* Mobile Top Navigation Bar */}
      <div className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-border/60 bg-card/80 backdrop-blur-md sticky top-0 z-40">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Éclat Logo" className="h-9 w-auto" />
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="text-xs font-bold gap-1 px-3 h-9 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={15} /> Home
          </Button>
        </div>
      </div>

      {/* Left Brand Showcase Panel (Desktop lg+) - Minimalist & Elegant */}
      <div className="hidden lg:flex lg:col-span-5 xl:col-span-5 relative bg-gradient-to-br from-[#011C3A] via-[#022852] to-[#083363] text-white p-10 xl:p-14 flex-col justify-between overflow-hidden shadow-2xl border-r border-white/10">
        {/* Background Ambient Glow */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10">
          <Link to="/" className="inline-block mb-12 hover:opacity-90 transition-opacity">
            <img src={logoLight} alt="Éclat" className="h-12 w-auto brightness-0 invert drop-shadow-md" />
          </Link>

          {/* Role Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#40D3F2] text-xs font-extrabold uppercase tracking-wider mb-6 shadow-sm">
            <ShowcaseIcon size={15} className="text-[#40D3F2]" />
            <span>{badgeText || roleShowcase.badge}</span>
          </div>

          <h2 className="text-3xl xl:text-4xl font-black tracking-tight leading-tight text-white mb-4">
            {roleShowcase.headline}
          </h2>
          <p className="text-white/80 text-base leading-relaxed max-w-md mb-10">
            {roleShowcase.description}
          </p>

          {/* Minimalist Highlights */}
          <div className="space-y-4">
            {roleShowcase.highlights.map((h, i) => (
              <div key={i} className="flex items-center gap-3 text-sm font-semibold text-white/90">
                <div className="w-5 h-5 rounded-full bg-[#40D3F2]/25 border border-[#40D3F2]/50 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 size={13} className="text-[#40D3F2]" />
                </div>
                <span>{h}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Clean Footer Branding */}
        <div className="relative z-10 pt-6 border-t border-white/10 text-xs text-white/60 font-medium">
          Empowering Nigerian students, parents, and schools.
        </div>
      </div>

      {/* Right Form Panel (Desktop & Mobile) - High-Contrast & Pronounced */}
      <div className="flex-1 lg:col-span-7 xl:col-span-7 flex flex-col justify-between p-4 sm:p-8 md:p-12 relative bg-gradient-to-br from-background via-background to-primary/5">
        {/* Desktop Top Utilities */}
        <div className="hidden lg:flex items-center justify-between mb-6 max-w-xl mx-auto w-full">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="gap-2 font-bold text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl px-3 h-9"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Button>

          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </div>

        {/* Form Card Container - Pronounced & Highly Visible */}
        <div className="w-full max-w-[460px] mx-auto my-auto py-4 sm:py-6">
          <div className="bg-card border-2 border-border shadow-2xl rounded-3xl p-6 sm:p-9 relative">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-extrabold mb-2.5">
                <Sparkles size={13} />
                <span>{badgeText || roleShowcase.badge}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">{title}</h1>
              <p className="text-sm font-medium text-muted-foreground mt-1.5">{subtitle}</p>
            </div>

            {/* Injected Form */}
            {children}

            {/* Footer Link */}
            {footerLink && (
              <div className="text-center text-sm font-medium text-muted-foreground mt-6 pt-4 border-t border-border/50">
                <span>{footerLink.text} </span>
                {footerLink.to ? (
                  <Link to={footerLink.to} className="font-bold text-primary hover:underline ml-1">
                    {footerLink.actionText}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={footerLink.onClick}
                    className="font-bold text-primary hover:underline ml-1 cursor-pointer"
                  >
                    {footerLink.actionText}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Desktop Bottom Legal Footer */}
        <div className="hidden sm:flex items-center justify-center gap-4 text-xs font-semibold text-muted-foreground max-w-xl mx-auto w-full pt-4">
          <span>© 2026 Éclat Platform</span>
          <span>•</span>
          <Link to="/privacy-policy" className="hover:underline">
            Privacy Policy
          </Link>
          <span>•</span>
          <Link to="/terms-of-service" className="hover:underline">
            Terms of Service
          </Link>
        </div>
      </div>
    </div>
  );
}

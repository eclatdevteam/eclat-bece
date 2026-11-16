import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { usePublicAuthAction } from "@/hooks/usePublicAuthAction";
import { 
  Printer, 
  Mail, 
  Search, 
  FileText, 
  Shield, 
  CheckCircle2, 
  ChevronRight, 
  BookOpen, 
  Sparkles,
  ExternalLink,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface TocItem {
  id: string;
  number?: number;
  title: string;
}

interface LegalLayoutProps {
  title: string;
  subtitle?: string;
  lastUpdated?: string;
  version?: string;
  tocItems?: TocItem[];
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  children: React.ReactNode;
}

export const LegalLayout: React.FC<LegalLayoutProps> = ({
  title,
  subtitle,
  lastUpdated = "11 November 2026",
  version = "1.0",
  tocItems = [],
  searchQuery = "",
  onSearchChange,
  children,
}) => {
  const { handleLoginClick, handleGetStartedClick } = usePublicAuthAction();
  const location = useLocation();
  const [activeId, setActiveId] = useState<string>("");
  const [mobileTocOpen, setMobileTocOpen] = useState(false);

  // Legal hub tabs
  const legalTabs = [
    { title: "Terms of Service", path: "/terms-of-service", icon: FileText },
    { title: "Privacy Policy", path: "/privacy-policy", icon: Shield },
    { title: "Parent & School Agreements", path: "/agreements", icon: CheckCircle2 },
    { title: "Pupil Privacy Guide", path: "/pupil-privacy", icon: Sparkles },
  ];

  // ScrollSpy to highlight the active section in view
  useEffect(() => {
    if (!tocItems.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 }
    );

    tocItems.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [tocItems]);

  const handlePrint = () => {
    window.print();
  };

  const scrollToSection = (id: string) => {
    setMobileTocOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const navOffset = 90;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
      setActiveId(id);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070e20] text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Main Navigation (hidden on print) */}
      <div className="print:hidden">
        <Navigation onLoginClick={handleLoginClick} onGetStartedClick={handleGetStartedClick} />
      </div>

      {/* Legal Hero Header */}
      <header className="relative bg-white dark:bg-[#091329] border-b border-slate-200 dark:border-slate-800 pt-16 pb-8 px-4 sm:px-6 lg:px-8 print:border-none print:py-4">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            {/* Title & Metadata */}
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/60 text-xs font-bold uppercase tracking-wider text-cyan-800 dark:text-cyan-300">
                <BookOpen size={13} className="text-cyan-600 dark:text-cyan-400" />
                <span>Éclat Legal & Regulatory Center</span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                {title}
              </h1>

              {subtitle && (
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl">
                  {subtitle}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1">
                <span>Eclatapp Technologies Ltd</span>
                <span>•</span>
                <span>Lagos, Nigeria</span>
                <span>•</span>
                <span>Last Updated: <strong className="text-slate-700 dark:text-slate-200">{lastUpdated}</strong></span>
                {version && (
                  <>
                    <span>•</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-semibold">
                      v{version}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Print & Action Buttons (hidden on print) */}
            <div className="flex items-center gap-3 print:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="gap-2 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                <Printer size={15} />
                <span>Print / Save PDF</span>
              </Button>
              <a
                href="mailto:support@eclatapp.xyz"
                className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-md bg-sky-500 hover:bg-sky-600 text-white transition-colors"
              >
                <Mail size={15} />
                <span>Legal Support</span>
              </a>
            </div>

          </div>

          {/* Legal Navigation Tabs */}
          <nav aria-label="Legal Center Navigation" className="flex items-center gap-2 overflow-x-auto pt-8 border-t border-slate-100 dark:border-slate-800/80 mt-6 print:hidden scrollbar-none">
            {legalTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = location.pathname === tab.path;
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-sky-500 text-white shadow-sm dark:bg-[#0c9dcc] dark:text-white"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <Icon size={15} />
                  <span>{tab.title}</span>
                </Link>
              );
            })}
          </nav>

        </div>
      </header>

      {/* Mobile Floating TOC Toggle (hidden on print) */}
      {tocItems.length > 0 && (
        <div className="lg:hidden sticky top-0 z-30 bg-white/95 dark:bg-[#081226]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 print:hidden">
          <button
            type="button"
            onClick={() => setMobileTocOpen(!mobileTocOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <span className="flex items-center gap-2">
              <BookOpen size={14} className="text-sky-500" />
              <span>Jump to Section {activeId ? `(${tocItems.find(t => t.id === activeId)?.title || "..."})` : ""}</span>
            </span>
            <ChevronDown size={14} className={`transition-transform ${mobileTocOpen ? "rotate-180" : ""}`} />
          </button>

          {mobileTocOpen && (
            <div className="mt-2 max-h-60 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#091329] p-2 shadow-lg space-y-1">
              {tocItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollToSection(item.id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition-colors ${
                    activeId === item.id
                      ? "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 font-bold"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  {item.number ? `${item.number}. ` : ""}{item.title}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Legal Content Canvas */}
      <main className="flex-1 container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Sticky Table of Contents (Desktop Only, hidden on print) */}
          {tocItems.length > 0 && (
            <aside className="hidden lg:block lg:col-span-4 sticky top-24 print:hidden">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#091329] p-5 shadow-sm space-y-4">
                
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 flex items-center gap-2">
                    <BookOpen size={14} className="text-sky-500" />
                    <span>Table of Contents</span>
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">
                    {tocItems.length} sections
                  </span>
                </div>

                {/* Section Quick Search */}
                {onSearchChange && (
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => onSearchChange(e.target.value)}
                      placeholder="Filter sections..."
                      className="h-8 pl-8 text-xs bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700"
                    />
                  </div>
                )}

                {/* Section Links */}
                <nav className="max-h-[calc(100vh-280px)] overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                  {tocItems.map((item) => {
                    const isActive = activeId === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => scrollToSection(item.id)}
                        className={`w-full text-left flex items-start gap-2 px-3 py-1.5 rounded-lg text-xs transition-all ${
                          isActive
                            ? "bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 font-bold border-l-2 border-sky-500 pl-2.5"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        }`}
                      >
                        {item.number && (
                          <span className="font-mono text-[11px] text-slate-400 shrink-0">
                            {item.number}.
                          </span>
                        )}
                        <span className="line-clamp-2 leading-relaxed">{item.title}</span>
                      </button>
                    );
                  })}
                </nav>

                {/* Quick Help Card */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                  <p>Have legal or privacy questions?</p>
                  <a
                    href="mailto:support@eclatapp.xyz"
                    className="font-semibold text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1 mt-1"
                  >
                    <span>Contact Legal Desk</span>
                    <ExternalLink size={11} />
                  </a>
                </div>

              </div>
            </aside>
          )}

          {/* Right Column: Main Legal Reading Canvas */}
          <article className={`${tocItems.length > 0 ? "lg:col-span-8" : "lg:col-span-12"} w-full`}>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#091329] p-6 sm:p-10 shadow-sm print:border-none print:shadow-none print:p-0">
              {children}
            </div>
          </article>

        </div>
      </main>

      {/* Global Footer (hidden on print) */}
      <div className="print:hidden mt-auto">
        <Footer />
      </div>
    </div>
  );
};

import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { LegalLayout } from "@/components/legal/LegalLayout";
import {
  termsOfServiceMetadata,
  termsOfServicePreamble,
  termsOfServiceSections,
  termsOfServiceAcknowledgement,
} from "@/data/legal/termsOfServiceData";
import { 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  ChevronRight, 
  Link as LinkIcon, 
  FileCheck2,
  ShieldCheck,
  Building2,
  Mail,
  ExternalLink
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function TermsOfServicePage() {
  const [searchQuery, setSearchQuery] = useState("");

  const tocItems = useMemo(() => {
    return termsOfServiceSections.map((section) => ({
      id: section.id,
      number: section.number,
      title: section.title,
    }));
  }, []);

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return termsOfServiceSections;
    const q = searchQuery.toLowerCase();
    return termsOfServiceSections.filter(
      (section) =>
        section.title.toLowerCase().includes(q) ||
        section.paragraphs?.some((p) => p.toLowerCase().includes(q)) ||
        section.list?.some((item) => item.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  return (
    <LegalLayout
      title={termsOfServiceMetadata.title}
      subtitle="Governing rules, rights, and responsibilities for using the Éclat CBT and educational platform in Nigeria."
      lastUpdated={termsOfServiceMetadata.lastUpdated}
      version={termsOfServiceMetadata.version}
      tocItems={tocItems}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
    >
      <div className="space-y-10 text-slate-700 dark:text-slate-300">
        
        {/* Preamble Card */}
        <section className="p-6 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
          <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-bold text-sm">
            <ShieldCheck size={18} />
            <span>Official Operating Terms</span>
          </div>
          {termsOfServicePreamble.map((para, index) => (
            <p key={index} className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
              {para}
            </p>
          ))}
          <div className="pt-2 flex flex-wrap gap-3 text-xs">
            <Link
              to="/privacy-policy"
              className="text-sky-600 dark:text-sky-400 font-semibold hover:underline inline-flex items-center gap-1"
            >
              <span>Read our Privacy Policy</span>
              <ChevronRight size={13} />
            </Link>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <Link
              to="/agreements"
              className="text-sky-600 dark:text-sky-400 font-semibold hover:underline inline-flex items-center gap-1"
            >
              <span>View Parent & School Agreements</span>
              <ChevronRight size={13} />
            </Link>
          </div>
        </section>

        {/* Section List */}
        <div className="space-y-12">
          {filteredSections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="scroll-mt-28 space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 first:border-none first:pt-0"
            >
              {/* Section Header */}
              <div className="flex items-baseline justify-between group">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                  <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-xs font-mono font-bold shrink-0">
                    {section.number}
                  </span>
                  <span>{section.title}</span>
                </h2>
                <a
                  href={`#${section.id}`}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-sky-500 p-1"
                  aria-label={`Link to section ${section.number}`}
                >
                  <LinkIcon size={16} />
                </a>
              </div>

              {/* Main Paragraphs */}
              {section.paragraphs && section.paragraphs.length > 0 && (
                <div className="space-y-3">
                  {section.paragraphs.map((para, i) => (
                    <p key={i} className="text-sm sm:text-base leading-relaxed">
                      {para}
                    </p>
                  ))}
                </div>
              )}

              {/* Bulleted List */}
              {section.list && section.list.length > 0 && (
                <ul className="space-y-2 pl-2">
                  {section.list.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm sm:text-base leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0 mt-2" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Special Highlight Callout */}
              {section.callout && (
                <div
                  className={`p-4 rounded-xl border flex items-start gap-3 my-4 ${
                    section.callout.type === "warning"
                      ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200"
                      : "bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800/60 text-sky-900 dark:text-sky-200"
                  }`}
                >
                  {section.callout.type === "warning" ? (
                    <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  ) : (
                    <Info size={18} className="text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                  )}
                  <div className="text-xs sm:text-sm space-y-1">
                    {section.callout.title && (
                      <p className="font-bold">{section.callout.title}</p>
                    )}
                    <p className="leading-relaxed opacity-95">{section.callout.text}</p>
                  </div>
                </div>
              )}

              {/* Subsections */}
              {section.subsections && section.subsections.length > 0 && (
                <div className="space-y-4 pt-2">
                  {section.subsections.map((sub, i) => (
                    <div key={i} className="space-y-2">
                      {sub.title && (
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          {sub.title}
                        </h3>
                      )}
                      {sub.paragraphs?.map((p, pi) => (
                        <p key={pi} className="text-sm sm:text-base leading-relaxed">
                          {p}
                        </p>
                      ))}
                      {sub.list && (
                        <ul className="space-y-1.5 pl-2">
                          {sub.list.map((item, li) => (
                            <li key={li} className="flex items-start gap-2 text-sm sm:text-base leading-relaxed">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0 mt-2" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>

        {/* Section 22 Contact Card Preview */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white shadow-md space-y-4">
          <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
            <Building2 size={18} />
            <span>Corporate Contact & Legal Enquiries</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-300">
            <div>
              <p className="font-semibold text-white">Eclatapp Technologies Ltd</p>
              <p>Alara Street, Onike, Yaba</p>
              <p>Lagos State, Nigeria</p>
            </div>
            <div className="space-y-1">
              <p className="flex items-center gap-2">
                <Mail size={14} className="text-sky-400" />
                <a href="mailto:support@eclatapp.xyz" className="text-sky-300 hover:underline">
                  support@eclatapp.xyz
                </a>
              </p>
              <p className="flex items-center gap-2">
                <ExternalLink size={14} className="text-sky-400" />
                <a href="https://eclatapp.com.ng" target="_blank" rel="noopener noreferrer" className="text-sky-300 hover:underline">
                  https://eclatapp.com.ng
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Formal Acknowledgement Block */}
        <div className="p-6 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 space-y-2">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
            <FileCheck2 size={18} />
            <span>Formal Legal Acknowledgement</span>
          </div>
          <p className="text-xs sm:text-sm text-emerald-950 dark:text-emerald-200 leading-relaxed font-medium">
            {termsOfServiceAcknowledgement}
          </p>
        </div>

      </div>
    </LegalLayout>
  );
}

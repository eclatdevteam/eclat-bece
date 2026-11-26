import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { LegalLayout } from "@/components/legal/LegalLayout";
import {
  privacyPolicyMetadata,
  privacyPolicySections,
} from "@/data/legal/privacyPolicyData";
import { 
  ShieldCheck, 
  ShieldX, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  Link as LinkIcon, 
  Server, 
  Lock, 
  Eye, 
  Scale, 
  Building2, 
  Mail,
  ChevronRight
} from "lucide-react";

export default function PrivacyPolicyPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const tocItems = useMemo(() => {
    return privacyPolicySections.map((section) => ({
      id: section.id,
      number: section.number,
      title: section.title,
    }));
  }, []);

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return privacyPolicySections;
    const q = searchQuery.toLowerCase();
    return privacyPolicySections.filter(
      (section) =>
        section.title.toLowerCase().includes(q) ||
        section.paragraphs?.some((p) => p.toLowerCase().includes(q)) ||
        section.list?.some((item) => item.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  return (
    <LegalLayout
      title={privacyPolicyMetadata.title}
      subtitle="How Éclat collects, protects, and handles personal information for Nigerian pupils, parents, and schools under the Nigeria Data Protection Act."
      lastUpdated={privacyPolicyMetadata.lastUpdated}
      version={privacyPolicyMetadata.version}
      tocItems={tocItems}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
    >
      <div className="space-y-10 text-slate-700 dark:text-slate-300">

        {/* Introduction Callout */}
        <section className="p-6 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/60 space-y-3">
          <div className="flex items-center gap-2 text-cyan-800 dark:text-cyan-300 font-bold text-sm">
            <ShieldCheck size={18} />
            <span>Child Privacy & Data Protection Commitment</span>
          </div>
          <p className="text-sm leading-relaxed text-cyan-950 dark:text-cyan-100">
            At Éclat, we believe children should be able to learn, practise and develop their abilities in an environment that respects their privacy and protects their personal information. Because children use our services, we recognise that their personal data requires particular care.
          </p>
          <div className="pt-2 flex flex-wrap gap-3 text-xs">
            <Link
              to="/pupil-privacy"
              className="text-cyan-700 dark:text-cyan-300 font-semibold hover:underline inline-flex items-center gap-1"
            >
              <span>View our child-friendly Pupil Privacy Guide</span>
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

              {/* Section 4 Special Exclusions Highlight ("What we do NOT collect") */}
              {section.id === "information-we-do-not-ordinarily-request" && (
                <div className="p-5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs uppercase tracking-wider">
                    <ShieldCheck size={16} />
                    <span>Safety by Design: Strictly Excluded Data</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    Éclat does not track students in the real world. We never ask for or store:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {[
                      "No Home or Residential Addresses",
                      "No Government Identity Numbers (NIN, Passports)",
                      "No Biometric Information",
                      "No Medical or Health Records",
                      "No Religious Information",
                      "No Bank Card Numbers (Handled via Paystack)",
                      "No Unrestricted Student-to-Student Messaging",
                      "No Real-time Continuous Geolocation",
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 rounded bg-white dark:bg-[#070e20] border border-slate-200 dark:border-slate-800">
                        <ShieldX size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="font-medium text-slate-800 dark:text-slate-200">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 5 Purpose Matrix Table */}
              {section.table && (
                <div className="my-6 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white uppercase font-bold text-[11px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        {section.table.headers.map((h, hi) => (
                          <th key={hi} className="px-4 py-3">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {section.table.rows.map((row, ri) => (
                        <tr key={ri} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap sm:whitespace-normal">
                            {row.purpose}
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                            {row.information}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Special Highlight Callout */}
              {section.callout && (
                <div
                  className={`p-4 rounded-xl border flex items-start gap-3 my-4 ${
                    section.callout.type === "warning"
                      ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200"
                      : section.callout.type === "success"
                      ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200"
                      : "bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800/60 text-sky-900 dark:text-sky-200"
                  }`}
                >
                  {section.callout.type === "warning" ? (
                    <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  ) : section.callout.type === "success" ? (
                    <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
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
                    <div key={i} className="space-y-2 rounded-lg bg-slate-50/50 dark:bg-slate-800/20 p-3 sm:p-4 border border-slate-100 dark:border-slate-800/60">
                      {sub.subtitle && (
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <CheckCircle2 size={15} className="text-sky-500" />
                          <span>{sub.subtitle}</span>
                        </h3>
                      )}
                      {sub.paragraphs?.map((p, pi) => (
                        <p key={pi} className="text-sm leading-relaxed">
                          {p}
                        </p>
                      ))}
                      {sub.list && (
                        <ul className="space-y-1 pl-2 pt-1">
                          {sub.list.map((item, li) => (
                            <li key={li} className="flex items-start gap-2 text-xs sm:text-sm leading-relaxed">
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

        {/* Regulatory Agency Contact Card */}
        <div className="p-6 rounded-2xl bg-slate-900 text-white shadow-md space-y-4">
          <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
            <Scale size={18} />
            <span>National Regulatory Authority & Contact</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-300">
            <div>
              <p className="font-semibold text-white">Éclat Privacy Desk</p>
              <p>Eclatapp Technologies Ltd</p>
              <p>Alara Street, Onike, Yaba, Lagos, Nigeria</p>
              <p className="mt-2 text-sky-300">Email: support@eclatapp.xyz</p>
            </div>
            <div className="border-t sm:border-t-0 sm:border-l border-slate-700 pt-3 sm:pt-0 sm:pl-4 space-y-1">
              <p className="font-semibold text-white">Nigeria Data Protection Commission (NDPC)</p>
              <p className="text-slate-400">
                Individuals have the statutory right to make a complaint directly to the NDPC if they believe their personal data protection rights have been infringed.
              </p>
            </div>
          </div>
        </div>

      </div>
    </LegalLayout>
  );
}

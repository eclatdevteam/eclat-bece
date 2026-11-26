import React, { useState } from "react";
import { Link } from "react-router-dom";
import { LegalLayout } from "@/components/legal/LegalLayout";
import {
  agreementsMetadata,
  parentGuardianAgreement,
  schoolAgreementAndTerms,
} from "@/data/legal/agreementsData";
import { 
  Users, 
  School, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  FileText, 
  Lock,
  Printer
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AgreementsPage() {
  const [selectedRole, setSelectedRole] = useState<"parent" | "school">("parent");

  const currentAgreement = selectedRole === "parent" ? parentGuardianAgreement : schoolAgreementAndTerms;

  return (
    <LegalLayout
      title={agreementsMetadata.title}
      subtitle="Statutory consent agreements and data processing terms for Parents, Guardians, and School Institutions registering on Éclat."
      lastUpdated={agreementsMetadata.lastUpdated}
      version="1.0"
    >
      <div className="space-y-8 text-slate-700 dark:text-slate-300">

        {/* Role Switcher Tabs */}
        <div className="flex items-center gap-3 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 max-w-md">
          <button
            type="button"
            onClick={() => setSelectedRole("parent")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              selectedRole === "parent"
                ? "bg-white dark:bg-[#0c1a35] text-sky-600 dark:text-sky-300 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Users size={15} />
            <span>Parent / Guardian</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole("school")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              selectedRole === "school"
                ? "bg-white dark:bg-[#0c1a35] text-sky-600 dark:text-sky-300 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <School size={15} />
            <span>School / Institution</span>
          </button>
        </div>

        {/* Agreement Card */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#081226] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 text-xs font-bold uppercase tracking-wider mb-2">
                {selectedRole === "parent" ? <Users size={13} /> : <School size={13} />}
                <span>{currentAgreement.badge}</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {currentAgreement.title}
              </h2>
            </div>

            <Link to={currentAgreement.actionUrl}>
              <Button size="sm" className="gap-2 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs">
                <span>{currentAgreement.actionButtonText}</span>
                <ArrowRight size={14} />
              </Button>
            </Link>
          </div>

          {/* Statement of Legal Authority */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-start gap-3">
            <Lock size={18} className="text-sky-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{currentAgreement.intro}</p>
          </div>

          {/* Enumerated Terms */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Agreed Conditions & Processing Authority
            </h3>
            
            <div className="space-y-3">
              {currentAgreement.statements.map((stmt, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-start gap-3"
                >
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    {stmt}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Active Consent Notice */}
          <div className="p-5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 text-xs sm:text-sm text-amber-900 dark:text-amber-200 space-y-2">
            <p className="font-bold flex items-center gap-2">
              <ShieldCheck size={16} className="text-amber-600 dark:text-amber-400" />
              <span>Mandatory Binding Acceptance</span>
            </p>
            <p className="leading-relaxed">
              {currentAgreement.consentClause}
            </p>
          </div>

          {/* Quick Registration Link */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-500">
              Questions regarding authority or institutional onboarding? Contact{" "}
              <a href="mailto:support@eclatapp.xyz" className="text-sky-600 dark:text-sky-400 underline">
                support@eclatapp.xyz
              </a>
            </p>
            <Link to={currentAgreement.actionUrl}>
              <Button className="w-full sm:w-auto gap-2 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs">
                <span>Proceed to {selectedRole === "parent" ? "Parent" : "School"} Registration</span>
                <ArrowRight size={14} />
              </Button>
            </Link>
          </div>

        </div>

        {/* Cross Link to Terms & Privacy */}
        <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
          <div className="space-y-1">
            <p className="font-bold text-slate-800 dark:text-slate-200">Related Legal Documentation</p>
            <p className="text-slate-500">Review our underlying platform rules and data protection commitments.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/terms-of-service" className="text-sky-600 dark:text-sky-400 font-semibold hover:underline">
              Terms of Service
            </Link>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <Link to="/privacy-policy" className="text-sky-600 dark:text-sky-400 font-semibold hover:underline">
              Privacy Policy
            </Link>
          </div>
        </div>

      </div>
    </LegalLayout>
  );
}

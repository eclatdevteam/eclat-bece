import React from "react";
import { Link } from "react-router-dom";
import { PupilPrivacyView } from "@/components/legal/PupilPrivacyView";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StudentPrivacyPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Top Header / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <Link
            to="/dashboard/student"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-sky-500 transition-colors mb-1"
          >
            <ArrowLeft size={14} />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <ShieldCheck size={28} className="text-sky-500" />
            <span>Your Privacy on Éclat</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Learn what information Éclat remembers about you and how your learning data is kept secure.
          </p>
        </div>
      </div>

      {/* Main Pupil Privacy Cards */}
      <PupilPrivacyView />
    </div>
  );
}

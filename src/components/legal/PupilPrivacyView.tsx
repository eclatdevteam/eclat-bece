import React from "react";
import {
  pupilPrivacyIntro,
  pupilPrivacyCards,
  pupilPrivacyClosing,
} from "@/data/legal/pupilPrivacyData";
import { 
  Smile, 
  BookOpen, 
  Trophy, 
  ShieldAlert, 
  HelpCircle, 
  Heart, 
  Sparkles, 
  Lock, 
  Mail,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";

export const PupilPrivacyView: React.FC = () => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "book":
        return <BookOpen className="text-cyan-500" size={24} />;
      case "smile":
        return <Smile className="text-indigo-500" size={24} />;
      case "trophy":
        return <Trophy className="text-amber-500" size={24} />;
      case "shield-alert":
        return <ShieldAlert className="text-rose-500" size={24} />;
      case "help-circle":
        return <HelpCircle className="text-emerald-500" size={24} />;
      default:
        return <Sparkles className="text-sky-500" size={24} />;
    }
  };

  const getBorderColor = (color: string) => {
    switch (color) {
      case "cyan":
        return "border-cyan-200 dark:border-cyan-800/60 bg-cyan-50/40 dark:bg-cyan-950/20";
      case "indigo":
        return "border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/40 dark:bg-indigo-950/20";
      case "amber":
        return "border-amber-200 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/20";
      case "rose":
        return "border-rose-200 dark:border-rose-800/60 bg-rose-50/40 dark:bg-rose-950/20";
      case "emerald":
        return "border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20";
      default:
        return "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900";
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      
      {/* Friendly Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-sky-500 via-cyan-500 to-indigo-600 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-4 bottom-2 opacity-10 pointer-events-none text-9xl">
          👋
        </div>
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-white">
            <ShieldCheck size={14} />
            <span>Student Privacy & Safety</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            {pupilPrivacyIntro.greeting}
          </h2>
          <p className="text-sm sm:text-base leading-relaxed max-w-2xl text-white/95">
            {pupilPrivacyIntro.message}
          </p>
        </div>
      </div>

      {/* Interactive Question Cards */}
      <div className="grid grid-cols-1 gap-6">
        {pupilPrivacyCards.map((card, idx) => (
          <div
            key={card.id}
            className={`p-6 sm:p-7 rounded-2xl border ${getBorderColor(
              card.themeColor
            )} shadow-sm space-y-4 transition-transform`}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 shadow-sm shrink-0">
                {getIcon(card.iconName)}
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Step {idx + 1}
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  {card.question}
                </h3>
              </div>
            </div>

            <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 font-medium">
              {card.leadText}
            </p>

            {card.bulletPoints && (
              <ul className="space-y-2 pl-2">
                {card.bulletPoints.map((pt, pti) => (
                  <li key={pti} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    <CheckCircle2 size={16} className="text-sky-500 shrink-0 mt-0.5" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            )}

            {card.alertNote && (
              <div className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 font-semibold flex items-start gap-2.5">
                <Lock size={15} className="text-sky-500 shrink-0 mt-0.5" />
                <span>{card.alertNote}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Closing Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white shadow-md text-center space-y-4">
        <h3 className="text-xl font-bold text-amber-400">
          {pupilPrivacyClosing.heading}
        </h3>
        <p className="text-sm sm:text-base leading-relaxed max-w-2xl mx-auto text-slate-300">
          {pupilPrivacyClosing.message}
        </p>
        <div className="pt-2">
          <a
            href="mailto:support@eclatapp.xyz"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold transition-colors"
          >
            <Mail size={15} />
            <span>Need Help? Contact Éclat Support</span>
          </a>
        </div>
      </div>

    </div>
  );
};

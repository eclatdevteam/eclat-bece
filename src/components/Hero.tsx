import { useNavigate } from "react-router-dom";
import { Sparkles, Trophy, ArrowRight, BookOpen, Flame, Award } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroProps {
  onGetStartedClick: () => void;
}

export const Hero = ({ onGetStartedClick }: HeroProps) => {
  const navigate = useNavigate();

  return (
    <section id="hero" className="relative min-h-[90vh] lg:min-h-[92vh] flex items-center justify-center pt-20 pb-16 px-4 sm:px-6 lg:px-8 text-slate-900 dark:text-white overflow-hidden transition-colors duration-200">
      {/* Background Glows & Ambient Mesh */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#3bc2f3]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-32 w-96 h-96 bg-[#0c9dcc]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-[#ffca6a]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto relative z-10 max-w-5xl text-center">
        {/* Top Floating Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-50 dark:bg-[#0c2438] border border-cyan-200 dark:border-[#2d4b68] text-cyan-800 dark:text-[#58c4e8] text-xs sm:text-sm font-bold uppercase tracking-wider mb-8 shadow-sm animate-fade-in">
          <Sparkles size={15} className="text-amber-500" />
          <span>Nigeria's Premier BECE & Common Entrance CBT Arena</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-6 animate-slide-up text-slate-900 dark:text-white">
          Ace Your Exams. <br className="hidden sm:inline" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#0c9dcc] via-cyan-600 to-[#d97706] dark:from-[#3bc2f3] dark:via-cyan-100 dark:to-[#ffca6a]">
            Win National Scholarships.
          </span>
        </h1>

        {/* Concise High-Impact Subtitle */}
        <p className="text-base sm:text-xl text-slate-700 dark:text-slate-200 max-w-2xl mx-auto leading-relaxed mb-10 animate-slide-up font-medium" style={{ animationDelay: "0.1s" }}>
          Gamified CBT prep with authentic past questions, live duel challenges, and monthly cash prizes for top Nigerian scholars.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <Button
            size="lg"
            onClick={onGetStartedClick}
            className="w-full sm:w-auto h-12 sm:h-13 px-8 text-base font-extrabold rounded-xl bg-[#3bc2f3] text-slate-950 hover:bg-[#32ade0] shadow-xl shadow-cyan-500/20 gap-2 transition-all transform hover:-translate-y-0.5 hover:scale-105"
          >
            <span>Get Started Free</span>
            <ArrowRight size={18} />
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate("/leaderboard")}
            className="w-full sm:w-auto h-12 sm:h-13 px-7 text-base font-bold rounded-xl bg-white dark:bg-[#0c1628] text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#15273f] hover:border-[#3bc2f3] hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#233148] gap-2 transition-all"
          >
            <Trophy size={18} className="text-amber-500" />
            <span>National Standings</span>
          </Button>
        </div>

        {/* Metric Badges Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto pt-6 border-t border-slate-200 dark:border-[#202b43] animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1628] border border-slate-200 dark:border-[#233148] hover:border-[#3bc2f3]/40 transition-all text-left shadow-md">
            <div className="flex items-center gap-2 text-[#0c9dcc] dark:text-[#3bc2f3] font-bold text-xs mb-1">
              <BookOpen size={14} />
              <span>Authentic Bank</span>
            </div>
            <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white">10,000+ Questions</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">WAEC & NECO Aligned</p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1628] border border-slate-200 dark:border-[#233148] hover:border-[#3bc2f3]/40 transition-all text-left shadow-md">
            <div className="flex items-center gap-2 text-amber-500 font-bold text-xs mb-1">
              <Trophy size={14} />
              <span>Scholarships</span>
            </div>
            <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white">₦50,000 Monthly</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Top Performer Prizes</p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1628] border border-slate-200 dark:border-[#233148] hover:border-[#3bc2f3]/40 transition-all text-left shadow-md">
            <div className="flex items-center gap-2 text-cyan-600 dark:text-[#58c4e8] font-bold text-xs mb-1">
              <Flame size={14} />
              <span>Duel Mode</span>
            </div>
            <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white">Live 1-on-1 Battles</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Challenge Classmates</p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1628] border border-slate-200 dark:border-[#233148] hover:border-[#3bc2f3]/40 transition-all text-left shadow-md">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs mb-1">
              <Award size={14} />
              <span>Diagnostics</span>
            </div>
            <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white">Curriculum Mastery</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Instant Weakness Alerts</p>
          </div>
        </div>
      </div>
    </section>
  );
};

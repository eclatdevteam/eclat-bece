import { useNavigate } from "react-router-dom";
import { ArrowRight, Trophy } from "lucide-react";

interface CtaBannerProps {
  onGetStartedClick: () => void;
}

export const CtaBanner = ({ onGetStartedClick }: CtaBannerProps) => {
  const navigate = useNavigate();

  return (
    <section className="py-8 lg:py-12 transition-colors duration-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div 
          className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-[#1e2f50] bg-[#f0f9ff] dark:bg-[#071329] p-6 sm:p-8 lg:p-10 text-center shadow-lg transition-colors duration-200"
          style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: "32px 32px",
            color: "rgba(14, 165, 233, 0.12)"
          }}
        >
          {/* Decorative Corner Orbs */}
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-cyan-500/10 dark:bg-cyan-400/5 pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-blue-500/10 dark:bg-blue-400/5 pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            
            {/* Pill Badge */}
            <div className="inline-flex items-center px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 text-xs font-semibold tracking-wide">
              <span>START YOUR JOURNEY TODAY</span>
            </div>

            {/* Headline */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Ready to Win?
            </h2>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              Join thousands of junior secondary students mastering study revision across Nigeria. Free past questions, live challenges, and scholarships await.
            </p>

            {/* Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={onGetStartedClick}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold bg-[#00a8e8] hover:bg-[#0096d1] text-slate-950 shadow-md shadow-cyan-500/25 transition-all hover:scale-[1.02]"
              >
                <span>Get Started Free</span>
                <ArrowRight size={16} />
              </button>

              <button
                onClick={() => navigate("/leaderboard")}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold border border-slate-300 dark:border-[#223555] bg-white dark:bg-[#0c1830] text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#142444] transition-all"
              >
                <Trophy size={16} className="text-amber-500" />
                <span>National Standings</span>
              </button>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

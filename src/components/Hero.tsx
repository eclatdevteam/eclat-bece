import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Trophy, ArrowRight, Play, CheckCircle2 } from "lucide-react";
import pic1 from "@/assets/pic1.jpg";
import pic2 from "@/assets/pic2.jpg";
import pic3 from "@/assets/pic3.jpg";
import pic4 from "@/assets/pic4.jpg";
import pic5 from "@/assets/pic5.png";

interface HeroProps {
  onGetStartedClick: () => void;
}

export const Hero = ({ onGetStartedClick }: HeroProps) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onGetStartedClick();
    }
  };

  return (
    <section id="hero" className="relative pt-6 pb-10 lg:pt-10 lg:pb-12 overflow-hidden transition-colors duration-200">
      {/* Blueprint Grid Background Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-25"
        style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: "36px 36px",
          color: "rgba(14, 165, 233, 0.2)"
        }}
      />

      {/* Subtle radial glow mesh */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-400/10 dark:bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[450px] h-[450px] bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-8 items-center mb-10 lg:mb-12">

          {/* Left Column: Headline, Search, Actions & Social Proof */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 text-xs font-semibold tracking-wide">
              <span className="text-amber-500 text-xs">✦</span>
              <span>OVER 10,000+ PRACTICE QUESTIONS & SCHOLARSHIPS</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-black tracking-tight text-slate-900 dark:text-white leading-[1.12]">
              Ace Your Exams. <br />
              <span className="relative inline-block">
                Win National
                {/* Hand-drawn style gold underline */}
                <svg
                  className="absolute -bottom-1 left-0 w-full overflow-visible"
                  height="7"
                  viewBox="0 0 200 8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 5.5C50 2 150 2 198 5.5"
                    stroke="#f59e0b"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </span>{" "}
              <span className="text-[#00a8e8] dark:text-[#38bdf8]">
                Scholarships.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed font-normal">
              Certified CBT arena with authentic past examination questions from the past and recent years to prepare you for 100% success on any exam for WAEC, NECO & BECE
            </p>

            {/* Search Input Bar */}
            <form onSubmit={handleSearch} className="max-w-xl">
              <div className="relative flex items-center rounded-full border border-slate-300 dark:border-[#223555] bg-white dark:bg-[#0c1830] p-1.5 shadow-md shadow-slate-200/50 dark:shadow-none focus-within:border-cyan-500 transition-colors">
                <Search size={18} className="ml-3.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search an exam or subject to practice now..."
                  className="w-full bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
                />
                <button
                  type="submit"
                  aria-label="Search"
                  className="w-9 h-9 rounded-full bg-[#00a8e8] hover:bg-[#0096d1] text-white flex items-center justify-center shrink-0 shadow-sm transition-all hover:scale-105"
                >
                  <Search size={16} />
                </button>
              </div>
            </form>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={onGetStartedClick}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold bg-[#00a8e8] hover:bg-[#0096d1] text-slate-950 shadow-md shadow-cyan-500/25 transition-all hover:scale-[1.02]"
              >
                <span>Start Practicing Free</span>
                <Play size={14} className="fill-slate-950" />
              </button>

              <button
                onClick={() => navigate("/leaderboard")}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold border border-slate-300 dark:border-[#223555] bg-white dark:bg-[#0c1830] text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#142444] transition-all"
              >
                <Trophy size={16} className="text-amber-500" />
                <span>National Standings</span>
              </button>
            </div>

            {/* Social Proof / Avatar Stack */}
            <div className="flex items-center gap-3 pt-3">
              <div className="flex -space-x-2.5 overflow-hidden">
                <img
                  src={pic1}
                  alt="Student 1"
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-[#060e20] object-cover"
                />
                <img
                  src={pic2}
                  alt="Student 2"
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-[#060e20] object-cover"
                />
                <img
                  src={pic3}
                  alt="Student 3"
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-[#060e20] object-cover"
                />
                <img
                  src={pic4}
                  alt="Student 4"
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-[#060e20] object-cover"
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                <span className="font-semibold text-slate-800 dark:text-slate-200">100+ Monthly scholarships awarded</span> | Trusted by over 5k parents, schools & students nationwide
              </p>
            </div>
          </div>

          {/* Right Column: Interactive App Showcase Card */}
          <div className="lg:col-span-5 relative">
            <div className="rounded-3xl border border-slate-200 dark:border-[#1e2f50] bg-white dark:bg-[#09152b] p-4 sm:p-5 shadow-2xl shadow-cyan-950/10 dark:shadow-black/40 relative">

              {/* Main Photo with floating badges */}
              <div className="relative rounded-2xl overflow-hidden aspect-[16/11] mb-4 bg-slate-100 dark:bg-slate-900">
                <img
                  src={pic5}
                  alt="Student cheering at tablet"
                  className="w-full h-full object-cover object-center"
                />

                {/* Floating pill badge top left */}
                <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-[11px] font-semibold text-white border border-white/10 shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>LIVE CBT DUEL ARENA</span>
                </div>

                {/* Floating pill badge top right */}
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-cyan-600/90 backdrop-blur-md text-[11px] font-bold text-white shadow-lg">
                  BECE / WAEC / NECO
                </div>
              </div>

              {/* 2 Feature mini-cards */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-[#0c2420] border border-emerald-200 dark:border-emerald-800/40 text-left">
                  <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 text-xs font-bold mb-0.5">
                    <CheckCircle2 size={13} />
                    <span>Today, 27 Oct</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-emerald-200/70 font-medium">Leaderboard Season Active</p>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 dark:bg-[#261e0e] border border-amber-200 dark:border-amber-800/40 text-left">
                  <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 text-xs font-bold mb-0.5">
                    <Trophy size={13} />
                    <span>₦50,000 Monthly</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-amber-200/70 font-medium">Top Student Prize Pool</p>
                </div>
              </div>

              {/* Bottom Live Battle Matchup Bar */}
              <div className="p-2.5 rounded-xl border border-slate-200 dark:border-[#1a2b48] bg-slate-50 dark:bg-[#060f22] flex items-center justify-between text-xs">
                {/* Player 1 */}
                <div className="flex items-center gap-2">
                  <img
                    src={pic1}
                    alt="Chiamaka O."
                    className="w-6 h-6 rounded-full object-cover ring-1 ring-cyan-500"
                  />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100 block text-[11px] leading-tight">Chiamaka O.</span>
                    <span className="text-[9px] text-slate-500 dark:text-slate-400">JSS 3</span>
                  </div>
                </div>

                {/* Score / VS Badge */}
                <div className="px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-[#13233e] text-[10px] font-black text-cyan-700 dark:text-cyan-300">
                  7 - 4 <span className="text-[9px] text-slate-500 dark:text-slate-400">VS</span>
                </div>

                {/* Player 2 */}
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="font-bold text-slate-900 dark:text-slate-100 block text-[11px] leading-tight">David K.</span>
                    <span className="text-[9px] text-slate-500 dark:text-slate-400">JSS 3</span>
                  </div>
                  <img
                    src={pic2}
                    alt="David K."
                    className="w-6 h-6 rounded-full object-cover ring-1 ring-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Metric Badges Row (4 Stat Cards) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 pt-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0c1830] border border-slate-200 dark:border-[#1e2f50] text-left shadow-sm">
            <p className="text-2xl sm:text-3xl font-black text-cyan-600 dark:text-[#38bdf8] mb-1">
              10,000+
            </p>
            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
              Authentic Past Questions
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Updated for WAEC, NECO & BECE
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0c1830] border border-slate-200 dark:border-[#1e2f50] text-left shadow-sm">
            <p className="text-2xl sm:text-3xl font-black text-cyan-600 dark:text-[#38bdf8] mb-1">
              ₦50,000
            </p>
            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
              Monthly Scholarships
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Rewarding academic excellence every month
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0c1830] border border-slate-200 dark:border-[#1e2f50] text-left shadow-sm">
            <p className="text-2xl sm:text-3xl font-black text-cyan-600 dark:text-[#38bdf8] mb-1">
              1v1 Duels
            </p>
            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
              Real-time Battle Arena
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Compete with classmates across Nigeria
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0c1830] border border-slate-200 dark:border-[#1e2f50] text-left shadow-sm">
            <p className="text-2xl sm:text-3xl font-black text-cyan-600 dark:text-[#38bdf8] mb-1">
              100% MERDC
            </p>
            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
              Curriculum Aligned
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Standard approved junior secondary syllabi
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};

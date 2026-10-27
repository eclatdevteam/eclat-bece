import { CheckCircle2, Trophy, ArrowRight, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const About = () => {
  const navigate = useNavigate();

  const curriculumPills = [
    {
      name: "Mathematics (3,240 Qs)",
      className:
        "text-cyan-700 dark:text-[#38bdf8] border-cyan-400/60 dark:border-[#0284c7]/50 bg-cyan-50 dark:bg-[#07192f]",
    },
    {
      name: "English Studies (2,890 Qs)",
      className:
        "text-blue-700 dark:text-[#60a5fa] border-blue-400/60 dark:border-[#2563eb]/50 bg-blue-50 dark:bg-[#0a1836]",
    },
    {
      name: "Basic Science (2,120 Qs)",
      className:
        "text-emerald-700 dark:text-[#34d399] border-emerald-400/60 dark:border-[#059669]/50 bg-emerald-50 dark:bg-[#061f1a]",
    },
    {
      name: "Social Studies (1,840 Qs)",
      className:
        "text-amber-800 dark:text-[#fbbf24] border-amber-400/60 dark:border-[#d97706]/50 bg-amber-50 dark:bg-[#241a06]",
    },
    {
      name: "Basic Tech (2,512 Qs)",
      className:
        "text-cyan-700 dark:text-[#38bdf8] border-cyan-400/60 dark:border-[#0284c7]/50 bg-cyan-50 dark:bg-[#07192f]",
    },
    {
      name: "Agric Sci (890 Qs)",
      className:
        "text-indigo-700 dark:text-[#818cf8] border-indigo-400/60 dark:border-[#4f46e5]/50 bg-indigo-50 dark:bg-[#121233]",
    },
  ];

  return (
    <section id="about" className="py-10 lg:py-14 transition-colors duration-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 text-xs font-semibold tracking-wide mb-4">
            <span>THE PROVEN 3-STEP METHODOLOGY</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
            How Éclat Works
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            A simple, rewarding framework that transforms stressful exam preparation into a daily habit of success.
          </p>
        </div>

        {/* 3 Step Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-10">
          
          {/* Step 1 */}
          <div className="rounded-3xl border border-slate-200 dark:border-[#1e2f50] bg-white dark:bg-[#0c1830] p-6 lg:p-7 flex flex-col justify-between shadow-sm text-left group hover:border-cyan-500/50 transition-all">
            <div>
              <div className="flex items-center justify-between mb-5">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                  Step 01
                </span>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Practice Mode
                </span>
              </div>

              {/* Simulation Box */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#1a2b48] bg-slate-50 dark:bg-[#071124] mb-6 space-y-2.5">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Simplify: 3(2x - 5) + 4
                </p>
                <div className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1830] text-[11px] text-slate-500 dark:text-slate-400">
                  Option A: 6x - 15
                </div>
                <div className="p-2 rounded-lg border border-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 text-[11px] font-bold text-cyan-800 dark:text-cyan-300 flex items-center justify-between">
                  <span>Option B: 6x - 11</span>
                  <CheckCircle2 size={13} className="text-cyan-600 dark:text-cyan-400" />
                </div>
              </div>

              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Master Authentic Questions
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal mb-6">
                Practice past WAEC, NECO & BECE questions with verified answers and detailed, step-by-step explanations.
              </p>
            </div>

            <button
              onClick={() => navigate("/dashboard/student")}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors"
            >
              <span>Explore question bank</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* Step 2 */}
          <div className="rounded-3xl border border-slate-200 dark:border-[#1e2f50] bg-white dark:bg-[#0c1830] p-6 lg:p-7 flex flex-col justify-between shadow-sm text-left group hover:border-amber-500/50 transition-all">
            <div>
              <div className="flex items-center justify-between mb-5">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  Step 02
                </span>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Duel Arena
                </span>
              </div>

              {/* Simulation Box */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#1a2b48] bg-slate-50 dark:bg-[#071124] mb-6 flex flex-col items-center justify-center text-center py-5">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-2">
                  <Trophy size={18} />
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  1v1 Duel Challenge
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Timed Head-to-Head Battle
                </p>
              </div>

              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Compete in National Duels
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal mb-6">
                Challenge peers in real-time speed quizzes. Climb the leaderboard, earn rank badges, and win scholarship prizes.
              </p>
            </div>

            <button
              onClick={() => navigate("/leaderboard")}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
            >
              <span>Join the arena</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* Step 3 */}
          <div className="rounded-3xl border border-slate-200 dark:border-[#1e2f50] bg-white dark:bg-[#0c1830] p-6 lg:p-7 flex flex-col justify-between shadow-sm text-left group hover:border-emerald-500/50 transition-all">
            <div>
              <div className="flex items-center justify-between mb-5">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Step 03
                </span>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Analytics
                </span>
              </div>

              {/* Simulation Box */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#1a2b48] bg-slate-50 dark:bg-[#071124] mb-6 space-y-2">
                <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-[11px] font-bold text-emerald-800 dark:text-emerald-400">
                  <span>Accuracy: 94%</span>
                  <CheckCircle2 size={13} />
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-100 dark:bg-[#0c1830] border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300">
                  <span>Weakness: Comprehension</span>
                  <span className="text-amber-500 font-bold">Review</span>
                </div>
              </div>

              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Pinpoint & Eradicate Gaps
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal mb-6">
                Our diagnostic engine identifies your weak topics and recommends targeted drills to guarantee exam readiness.
              </p>
            </div>

            <button
              onClick={() => navigate("/about")}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
            >
              <span>View sample report</span>
              <ArrowRight size={13} />
            </button>
          </div>

        </div>

        {/* Standard Nigerian Junior Secondary Curriculum Banner */}
        <div className="rounded-3xl border border-slate-200 dark:border-[#1a2b48] bg-white dark:bg-[#081226] p-6 lg:p-7 shadow-sm text-left transition-colors duration-200">
          {/* Header row with white box book icon */}
          <div className="flex items-center gap-3.5 mb-5">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-cyan-600 shadow-sm shrink-0 border border-slate-100">
              <BookOpen size={20} className="text-[#00a8e8]" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                Standard Nigerian Junior Secondary Curriculum
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
                Comprehensive question banks aligned with official NERDC specifications.
              </p>
            </div>
          </div>

          {/* Curriculum Pills with precise counts and colors */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {curriculumPills.map((item, idx) => (
              <span
                key={idx}
                className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all cursor-default ${item.className}`}
              >
                {item.name}
              </span>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

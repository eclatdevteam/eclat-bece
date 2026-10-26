import { BookOpen, Trophy, TrendingUp, CheckCircle2, Zap } from "lucide-react";

export const About = () => {
  const steps = [
    {
      step: "01",
      icon: BookOpen,
      title: "Master Authentic Questions",
      description: "Practice with verified WAEC BECE and National Common Entrance past questions across Mathematics, English, Basic Science, and Social Studies with comprehensive, step-by-step solutions.",
      gradient: "from-[#0c9dcc] to-blue-600 dark:from-[#3bc2f3] dark:to-blue-600",
      iconColor: "text-[#0c9dcc] dark:text-[#3bc2f3]",
      iconBg: "bg-cyan-50 dark:bg-[#3bc2f3]/10",
      pill: "Curated & Syllabus-Aligned",
    },
    {
      step: "02",
      icon: Trophy,
      title: "Compete in National Duels",
      description: "Put your knowledge to the test in real-time 1v1 duels, climb regional and national leaderboards, and qualify for monthly ₦50,000 top-scholar scholarship awards.",
      gradient: "from-amber-500 to-orange-500 dark:from-amber-400 dark:to-orange-500",
      iconColor: "text-amber-500 dark:text-amber-400",
      iconBg: "bg-amber-50 dark:bg-amber-400/10",
      pill: "Monthly & Annual Cash Prizes",
    },
    {
      step: "03",
      icon: TrendingUp,
      title: "Pinpoint & Eradicate Gaps",
      description: "Receive instant diagnostic telemetry breaking down weak topics, accuracy trends, and pace per question so students and parents know exactly where to focus.",
      gradient: "from-emerald-500 to-teal-600 dark:from-emerald-400 dark:to-teal-500",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-50 dark:bg-emerald-400/10",
      pill: "Instant Performance Reports",
    },
  ];

  return (
    <section id="about" className="py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-200/50 dark:border-[#202b43]/50 relative overflow-hidden transition-colors duration-200">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-[#3bc2f3]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto relative z-10 max-w-6xl">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-50 dark:bg-[#0c2438] border border-cyan-200 dark:border-[#2d4b68] text-cyan-800 dark:text-[#58c4e8] text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
            <Zap size={14} className="text-amber-500" />
            <span>The Proven 3-Step Methodology</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
            How Éclat Works
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
            A continuous, rewarding cycle that transforms tedious exam revision into a thrilling daily accomplishment.
          </p>
        </div>

        {/* 3 Steps Grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 relative">
          {steps.map((s, index) => {
            const Icon = s.icon;
            return (
              <div
                key={index}
                className="relative bg-slate-50/80 dark:bg-[#0c1628] border border-slate-200 dark:border-[#233148] hover:border-[#0c9dcc]/60 dark:hover:border-[#3bc2f3]/60 rounded-2xl p-7 shadow-md dark:shadow-xl hover:shadow-cyan-950/20 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1.5 overflow-hidden"
              >
                {/* Accent Top Gradient Stripe */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${s.gradient}`} />

                <div>
                  {/* Top Row: Step Number & Icon */}
                  <div className="flex items-center justify-between mb-5">
                    <div className={`w-12 h-12 rounded-xl ${s.iconBg} border border-slate-200 dark:border-[#233148] ${s.iconColor} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                      <Icon size={24} />
                    </div>
                    <span className="text-3xl font-black text-slate-300 dark:text-slate-600 group-hover:text-slate-400 font-mono transition-colors">
                      {s.step}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 leading-snug group-hover:text-[#0c9dcc] dark:group-hover:text-[#3bc2f3] transition-colors">
                    {s.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                    {s.description}
                  </p>
                </div>

                {/* Bottom Feature Pill */}
                <div className="pt-6 mt-6 border-t border-slate-200 dark:border-[#202b43] flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <CheckCircle2 size={15} className={`${s.iconColor} shrink-0`} />
                  <span>{s.pill}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

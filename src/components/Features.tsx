import { BookOpen, BarChart3, Users, Swords, Sparkles, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const Features = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: BookOpen,
      tag: "For Parents & Guardians",
      title: "Personalized Practice Builder",
      description: "Create custom Mathematics, English, Basic Science, and Social Studies drills tailored to your child's needs. Pick topics, adjust question volume, and guide their prep directly from your dashboard.",
      accent: "text-[#0c9dcc] dark:text-[#3bc2f3]",
      bgGlow: "bg-cyan-50 dark:bg-[#3bc2f3]/10",
      borderGlow: "hover:border-[#0c9dcc]/50 dark:group-hover:border-[#3bc2f3]/50",
      pill: "Custom Assignments & Deadlines",
      link: "/dashboard/parent",
    },
    {
      icon: Swords,
      tag: "For Competitive Students",
      title: "Real-Time 1v1 Battle Duels",
      description: "Step into the national arena to challenge classmates or match with students across Nigeria in timed head-to-head showdowns. Sharpen reflexes and conquer exam anxiety.",
      accent: "text-amber-500 dark:text-amber-400",
      bgGlow: "bg-amber-50 dark:bg-amber-400/10",
      borderGlow: "hover:border-amber-400/50 dark:group-hover:border-amber-400/50",
      pill: "Compete for XP & Scholarships",
      link: "/dashboard/student",
    },
    {
      icon: BarChart3,
      tag: "Smart Diagnostics",
      title: "In-Depth Performance Analytics",
      description: "Track speed, accuracy, and topic-level mastery in real time. Visual progress charts pinpoint exact curriculum gaps so you never waste hours reviewing topics already mastered.",
      accent: "text-emerald-600 dark:text-emerald-400",
      bgGlow: "bg-emerald-50 dark:bg-emerald-400/10",
      borderGlow: "hover:border-emerald-400/50 dark:group-hover:border-emerald-400/50",
      pill: "Curriculum Weakness Alerts",
      link: "/dashboard/parent",
    },
    {
      icon: Users,
      tag: "For Schools & Tutors",
      title: "Classroom & Cohort Management",
      description: "Enroll entire classrooms, generate instant student link codes, assign past question homework sets, and compare cohort scores with comprehensive downloadable reports.",
      accent: "text-cyan-700 dark:text-cyan-300",
      bgGlow: "bg-cyan-50 dark:bg-cyan-400/10",
      borderGlow: "hover:border-cyan-300/50 dark:group-hover:border-cyan-300/50",
      pill: "Class-wide Grade Tracking",
      link: "/dashboard/school",
    },
  ];

  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 border-y border-slate-200/50 dark:border-[#202b43]/50 relative overflow-hidden transition-colors duration-200">
      {/* Ambient Lighting */}
      <div className="absolute top-1/4 -left-32 w-80 h-80 bg-[#3bc2f3]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-80 h-80 bg-[#ffca6a]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-50 dark:bg-[#0c2438] border border-cyan-200 dark:border-[#2d4b68] text-cyan-800 dark:text-[#58c4e8] text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
            <Sparkles size={14} className="text-amber-500" />
            <span>Comprehensive Learning Ecosystem</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4 leading-tight">
            Built for Students, <br className="hidden sm:inline" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#0c9dcc] via-cyan-600 to-[#d97706] dark:from-[#3bc2f3] dark:via-cyan-100 dark:to-[#ffca6a]">
              Empowered by Parents & Schools
            </span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            State-of-the-art tools designed to make junior secondary exam preparation structured, collaborative, and deeply engaging.
          </p>
        </div>

        {/* Feature Cards 2x2 Grid */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                onClick={() => feature.link && navigate(feature.link)}
                className={`relative bg-white dark:bg-[#0c1628] border border-slate-200 dark:border-[#233148] ${feature.borderGlow} hover:bg-slate-50/80 dark:hover:bg-[#0e1c33] rounded-2xl p-7 sm:p-8 transition-all duration-300 flex flex-col justify-between group shadow-md dark:shadow-xl hover:shadow-cyan-950/30 hover:-translate-y-1 cursor-pointer`}
              >
                <div>
                  {/* Top Bar with Tag and Icon */}
                  <div className="flex items-center justify-between gap-4 mb-6">
                    <div className={`w-13 h-13 rounded-xl ${feature.bgGlow} border border-slate-200 dark:border-[#233148] flex items-center justify-center p-3 group-hover:scale-110 transition-transform`}>
                      <Icon className={feature.accent} size={26} />
                    </div>
                    <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 px-3 py-1 rounded-full bg-slate-100 dark:bg-[#080f22] border border-slate-200 dark:border-[#202b43]">
                      {feature.tag}
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-[#0c9dcc] dark:group-hover:text-[#3bc2f3] transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-6 font-normal">
                    {feature.description}
                  </p>
                </div>

                {/* Bottom Feature Indicator */}
                <div className="pt-4 border-t border-slate-200 dark:border-[#202b43] flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <CheckCircle2 size={16} className={`${feature.accent} shrink-0`} />
                  <span>{feature.pill}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

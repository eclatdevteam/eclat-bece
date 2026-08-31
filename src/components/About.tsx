import { BookOpen, Trophy, TrendingUp, CheckCircle2 } from "lucide-react";

export const About = () => {
  const steps = [
    {
      step: "01",
      icon: BookOpen,
      title: "Practice Questions",
      description: "Master thousands of authentic WAEC BECE and National Common Entrance past questions across Mathematics, English, Basic Science, and Social Studies with instant explanations.",
      color: "from-cyan-500 to-blue-600",
      pill: "Carefully Curated Practice Questions",
    },
    {
      step: "02",
      icon: Trophy,
      title: "Compete Nationwide",
      description: "Put your knowledge to the test in real-time head-to-head duels, accumulate competition points, and compete for national monthly and yearly cash prizes.",
      color: "from-amber-500 to-orange-600",
      pill: "Month & Yearly Prizes",
    },
    {
      step: "03",
      icon: TrendingUp,
      title: "Track Your Progress",
      description: "Detailed performance reports pinpoint exact weak topics and curriculum gaps so parents, teachers, and students know precisely where to focus before exam day.",
      color: "from-emerald-500 to-teal-600",
      pill: "Instant Reports",
    },
  ];

  return (
    <section id="about" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background via-muted/30 to-background border-b border-border/40 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto relative z-10 max-w-6xl">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 animate-fade-in">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight">
            How Éclat Works
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base mt-3 leading-relaxed">
            A simple, rewarding 3-step loop that turns exam preparation into an engaging daily habit.
          </p>
        </div>

        {/* 3 Steps Grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 relative">
          {steps.map((s, index) => {
            const Icon = s.icon;
            return (
              <div
                key={index}
                className="relative bg-card border-2 border-border/80 hover:border-primary/80 rounded-3xl p-7 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1.5 overflow-hidden"
              >
                {/* Accent Top Gradient Stripe */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${s.color}`} />

                <div>
                  {/* Top Row: Step Number & Icon */}
                  <div className="flex items-center justify-between mb-5">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.color} text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                      <Icon size={22} />
                    </div>
                    <span className="text-3xl font-black text-muted-foreground/30 font-mono">
                      {s.step}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-xl font-bold text-foreground mb-2.5 leading-snug group-hover:text-primary transition-colors">
                    {s.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {s.description}
                  </p>
                </div>

                {/* Bottom Feature Pill */}
                <div className="pt-6 mt-6 border-t border-border/50 flex items-center gap-2 text-xs font-bold text-foreground">
                  <CheckCircle2 size={14} className="text-primary flex-shrink-0" />
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

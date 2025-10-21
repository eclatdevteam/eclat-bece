import { CheckCircle2 } from "lucide-react";

export const About = () => {
  const steps = [
    {
      title: "Practice Real SAT Questions",
      description: "Access thousands of authentic SAT questions covering Reading, Writing, and Math sections.",
    },
    {
      title: "Compete Globally",
      description: "Climb leaderboards and compete with students worldwide for cash prizes.",
    },
    {
      title: "Track Your Progress",
      description: "Monitor your improvement with detailed analytics and personalized insights.",
    },
  ];

  return (
    <section id="about" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto">
        <div className="max-w-5xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              How Éclat Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A simple, powerful system that connects students, parents, and schools in the learning journey.
            </p>
          </div>

          {/* Steps */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {steps.map((step, index) => (
              <div
                key={index}
                className="relative animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="bg-gradient-card border-2 border-border rounded-xl p-6 hover:border-primary hover:shadow-hover transition-all">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-lg">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-2">{step.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-primary/30" />
                )}
              </div>
            ))}
          </div>

          {/* Benefits Grid */}
          <div className="bg-primary-light/50 rounded-2xl p-8 animate-scale-in" style={{ animationDelay: "0.3s" }}>
            <h3 className="text-2xl font-bold text-foreground mb-6 text-center">
              Why Students Choose Éclat
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                "Authentic SAT practice questions",
                "Win real cash prizes monthly",
                "Track your score improvements",
                "Compete with students worldwide",
                "Personalized study insights",
                "Mobile & desktop optimized",
              ].map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle2 className="text-primary flex-shrink-0" size={20} />
                  <span className="text-foreground">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

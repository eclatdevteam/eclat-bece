import { BookOpen, Trophy, BarChart3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Features = () => {
  const features = [
    {
      icon: BookOpen,
      title: "Comprehensive SAT Practice",
      description: "Master Reading, Writing, and Math with thousands of authentic SAT questions organized by section and difficulty.",
      color: "text-primary",
      bgColor: "bg-primary-light",
    },
    {
      icon: Trophy,
      title: "Global Competition",
      description: "Compete with SAT students worldwide. Top performers win real cash prizes monthly and annually!",
      color: "text-accent",
      bgColor: "bg-accent-light",
    },
    {
      icon: BarChart3,
      title: "Detailed Performance Analytics",
      description: "Track your progress with in-depth analytics. Parents and tutors can monitor performance in real-time.",
      color: "text-primary-glow",
      bgColor: "bg-primary-light",
    },
  ];

  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in">
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Everything You Need to Excel
          </h2>
          <p className="text-lg text-muted-foreground">
            Powerful features designed to make learning engaging, competitive, and rewarding.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="border-2 hover:border-primary hover:shadow-hover transition-all duration-300 bg-gradient-card animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader>
                  <div className={`w-14 h-14 ${feature.bgColor} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className={`${feature.color}`} size={28} />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

import { Navigation } from "@/components/Navigation";
import { About } from "@/components/About";
import { Footer } from "@/components/Footer";
import { usePublicAuthAction } from "@/hooks/usePublicAuthAction";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, GraduationCap, Award, CheckCircle2, ArrowRight } from "lucide-react";

export default function AboutPage() {
  const { handleLoginClick, handleGetStartedClick } = usePublicAuthAction();

  const values = [
    {
      icon: BookOpen,
      title: "Curriculum-Aligned Preparation",
      description: "Our question bank is strictly developed against official Nigerian Ministry of Education, WAEC BECE, and National Common Entrance Examination benchmarks.",
    },
    {
      icon: Award,
      title: "Gamified Motivation & Rewards",
      description: "We turn study time into friendly nationwide contests with live leaderboards, badges, streaks, and real cash prizes to keep students eager to practice.",
    },
    {
      icon: GraduationCap,
      title: "Parent & School Collaboration",
      description: "Empowering educators and parents with diagnostic insights, custom homework assignment tools, and real-time early warning metrics.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation onLoginClick={handleLoginClick} onGetStartedClick={handleGetStartedClick} />
      
      {/* Hero Header */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-primary/10 via-background to-background text-center">
        <div className="container mx-auto max-w-4xl animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-6">
            <GraduationCap className="h-4 w-4" />
            Empowering Nigerian Scholars
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
            Transforming Exam Prep into an <span className="text-primary">Inspiring Journey</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-8">
            Éclat is Nigeria's leading diagnostic and competitive quiz platform for Primary 6 Common Entrance and JSS 3 BECE candidates.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" variant="hero" onClick={handleGetStartedClick} className="font-bold text-base px-8 h-12 bg-gradient-to-r from-primary to-accent">
              Join Free Today <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Core How It Works Section */}
      <About />

      {/* Pillars of Excellence */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">Our Core Pillars</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Built from the ground up for Nigerian educational excellence.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {values.map((v, i) => {
              const Icon = v.icon;
              return (
                <Card key={i} className="border-2 border-border/80 hover:border-primary transition-all duration-300 bg-card">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl font-bold text-foreground">{v.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm leading-relaxed">{v.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary/15 via-accent/15 to-primary/15 border-t border-border/20 text-center">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold text-foreground mb-4">Ready to excel in your upcoming examinations?</h2>
          <p className="text-muted-foreground mb-8">Start with a free practice quiz or register your school to onboard entire classes.</p>
          <Button size="lg" variant="hero" onClick={handleGetStartedClick} className="font-bold text-base px-8 h-12 bg-gradient-to-r from-primary to-accent">
            Get Started Now
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}

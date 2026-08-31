import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { usePublicAuthAction } from "@/hooks/usePublicAuthAction";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  BarChart3, 
  Trophy, 
  Swords, 
  Users, 
  School, 
  CheckCircle2, 
  Sparkles, 
  Zap,
  ArrowRight
} from "lucide-react";

export default function FeaturesPage() {
  const { handleLoginClick, handleGetStartedClick } = usePublicAuthAction();

  const featureList = [
    {
      icon: BookOpen,
      title: "Authentic Examination Practice",
      tag: "Exam Simulation",
      description: "Thousands of questions structured precisely for WAEC BECE (Year 9) and National Common Entrance (Year 6) across Mathematics, English, Basic Science, Social Studies, and Business Studies.",
      highlights: ["Official curriculum alignment", "Step-by-step answer explanations", "Timed CBT mode"],
    },
    {
      icon: BarChart3,
      title: "AI-Powered Diagnostic Analytics",
      tag: "Smart Insights",
      description: "Pinpoint strengths and knowledge gaps with granular subject and topic breakdown scores. Get automated remediation tips on weakest areas.",
      highlights: ["Subject mastery tracking", "At-risk warnings (<65%)", "Progress over time charts"],
    },
    {
      icon: Users,
      title: "Parental Oversight & Custom Homework",
      tag: "For Parents",
      description: "Parents can assign custom quizzes with tailored topics and time limits, monitor active learning time, and receive instant completion notifications.",
      highlights: ["Multi-child management", "Targeted quiz assignments", "Instant score updates"],
    },
    {
      icon: School,
      title: "School & Classroom Management",
      tag: "For Schools",
      description: "Teachers and school administrators can manage Year 6 & Year 9 cohorts, push weekly practice assignments to whole classes, and export formatted CSV grade books.",
      highlights: ["Class cohort breakdown", "Bulk quiz assignments", "One-click CSV exports"],
    },
    {
      icon: Trophy,
      title: "National Competition Leaderboards",
      tag: "Rewards & Gamification",
      description: "Compete with students across all 36 states. Top-performing scholars earn monthly cash rewards, trophies, and national recognition.",
      highlights: ["Monthly & annual leaderboards", "Streak multipliers", "Verified cash prizes"],
    },
    {
      icon: Swords,
      title: "Duel of Minds Head-to-Head",
      tag: "Interactive Fun",
      description: "Challenge friends and classmates in real-time multiplayer academic battles. Quick-fire rounds make reviewing lessons thrilling.",
      highlights: ["Real-time multiplayer", "Subject-specific battles", "Elo rating rankings"],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation onLoginClick={handleLoginClick} onGetStartedClick={handleGetStartedClick} />
      
      {/* Hero Header */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-primary/10 via-background to-background text-center">
        <div className="container mx-auto max-w-4xl animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-6">
            <Sparkles className="h-4 w-4" />
            Cutting-Edge Learning Suite
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
            Everything You Need for <span className="text-primary">Exam Success</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-8">
            Explore the powerful tools built into Éclat for students, parents, and educators.
          </p>
          <Button size="lg" variant="hero" onClick={handleGetStartedClick} className="font-bold text-base px-8 h-12 bg-gradient-to-r from-primary to-accent">
            Try Free Practice Quiz <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featureList.map((f, i) => {
              const Icon = f.icon;
              return (
                <Card key={i} className="border-2 border-border/80 hover:border-primary transition-all duration-300 bg-card hover:shadow-lg flex flex-col">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                        {f.tag}
                      </span>
                    </div>
                    <CardTitle className="text-xl font-bold text-foreground">{f.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-between">
                    <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                      {f.description}
                    </p>
                    <ul className="space-y-2 border-t border-border/40 pt-4">
                      {f.highlights.map((h, hi) => (
                        <li key={hi} className="flex items-center text-xs font-medium text-foreground gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                          {h}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interactive Banner */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30 border-t border-border/20 text-center">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Start learning smarter today</h2>
          <p className="text-muted-foreground mb-8">Join thousands of students and teachers advancing their academic journey.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" variant="hero" onClick={handleGetStartedClick} className="font-bold text-base px-8 h-12 bg-gradient-to-r from-primary to-accent">
              Get Started for Free
            </Button>
            <Button size="lg" variant="outline" onClick={handleLoginClick} className="font-bold text-base px-8 h-12">
              Sign In to Account
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

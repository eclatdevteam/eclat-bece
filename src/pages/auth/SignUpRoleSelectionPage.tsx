import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Users, School, ArrowRight, ArrowLeft, Sparkles, CheckCircle2, BookOpen } from "lucide-react";
import { useRedirectIfAuthenticated } from "@/hooks/useRedirectIfAuthenticated";
import { useTheme } from "next-themes";
import logoDark from "@/assets/logo-dark.png";
import logoLight from "@/assets/logo-light.png";

export default function SignUpRoleSelectionPage() {
  const navigate = useNavigate();
  useRedirectIfAuthenticated();
  const { theme } = useTheme();
  const logo = theme === "dark" ? logoLight : logoDark;

  const roles = [
    {
      id: "parent",
      icon: Users,
      badge: "Family Account",
      title: "Parent Account",
      description: "Create a family account to manage your children's learning, assign customized homework quizzes, and track detailed progress.",
      features: [
        "Create & manage multiple student profiles",
        "Curriculum diagnostic topic tracking",
        "Custom practice quiz generator",
      ],
      color: "from-purple-500 to-indigo-600",
      accentBg: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      to: "/auth?role=parent",
    },
    {
      id: "school",
      icon: School,
      badge: "Institutional Account",
      title: "School Account",
      description: "Onboard your school to track Primary 6 and JSS 3 cohorts, assign class-wide CBT mock exams, and export CSV performance reports.",
      features: [
        "Unique school student connection code",
        "Year 6 & Year 9 cohort performance tracking",
        "Early warning diagnostic alerts",
      ],
      color: "from-emerald-500 to-teal-600",
      accentBg: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      to: "/auth?role=school",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex flex-col justify-between p-4 sm:p-8">
      {/* Top Header */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between py-2">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Éclat Logo" className="h-10 w-auto" />
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="text-xs font-bold gap-1.5 rounded-xl text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={16} /> Home
          </Button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto w-full my-auto py-8">
        <div className="text-center mb-10 animate-fade-in max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold mb-3">
            <Sparkles size={12} />
            <span>Join Éclat Today</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
            Choose Your Account Type
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base mt-2">
            Get started with free access to WAEC BECE and National Common Entrance CBT exam prep.
          </p>
        </div>

        {/* Roles Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {roles.map((r, index) => {
            const Icon = r.icon;
            return (
              <Card
                key={r.id}
                className="relative cursor-pointer border-2 hover:border-primary/80 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 rounded-3xl bg-card/90 backdrop-blur-sm flex flex-col justify-between group overflow-hidden"
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => navigate(r.to)}
              >
                {/* Accent top stripe */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${r.color}`} />

                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${r.color} text-white shadow-md group-hover:scale-110 transition-transform`}>
                      <Icon size={24} />
                    </div>
                    <Badge variant="outline" className={`text-[10px] font-bold ${r.accentBg}`}>
                      {r.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-bold text-foreground">{r.title}</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground leading-relaxed mt-1">
                    {r.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 pt-0">
                  <div className="space-y-2 border-t border-border/50 pt-3">
                    {r.features.map((f, fi) => (
                      <div key={fi} className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <CheckCircle2 size={13} className="text-primary flex-shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    className="w-full text-xs font-bold h-10 rounded-xl gap-1.5 shadow-sm group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                    variant="outline"
                  >
                    <span>Create {r.title}</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Student Notice Banner */}
        <div className="mt-8 p-4 rounded-2xl bg-primary/10 border border-primary/20 max-w-2xl mx-auto flex items-center gap-3 text-xs text-muted-foreground">
          <BookOpen size={20} className="text-primary flex-shrink-0" />
          <span>
            <strong>Looking for a Student account?</strong> Student accounts are created and managed by parents. Ask your parent to sign up above or{" "}
            <Link to="/student-login" className="font-bold text-primary hover:underline">
              log in with your student username
            </Link>.
          </span>
        </div>

        {/* Footer info */}
        <div className="text-center mt-8 space-y-3">
          <p className="text-sm text-muted-foreground">
            Already registered?{" "}
            <Link
              to="/auth/login/role-selection"
              className="text-primary font-bold hover:underline"
            >
              Sign In to Your Account
            </Link>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full text-center text-xs text-muted-foreground py-4">
        <span>© 2026 Éclat Platform • Empowering learning, one quiz at a time</span>
      </footer>
    </div>
  );
}

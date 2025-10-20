import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, GraduationCap, Users, School } from "lucide-react";

export default function RoleSelectionPage() {
  const navigate = useNavigate();

  const roles = [
    {
      id: "student",
      icon: GraduationCap,
      title: "Student",
      description: "Access quizzes and track your progress",
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: "parent",
      icon: Users,
      title: "Parent",
      description: "Monitor your child's learning journey",
      color: "from-purple-500 to-pink-500",
    },
    {
      id: "school",
      icon: School,
      title: "School",
      description: "Manage students and view analytics",
      color: "from-green-500 to-emerald-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light/20 via-background to-accent-light/20 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 mb-4">
            <BookOpen className="text-primary" size={40} />
            <h1 className="text-4xl font-bold text-foreground">Éclat</h1>
          </div>
          <p className="text-xl text-muted-foreground">Select your role to continue</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {roles.map((role, index) => {
            const Icon = role.icon;
            return (
              <Card
                key={role.id}
                className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 animate-scale-in group"
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => navigate(`/auth?role=${role.id}`)}
              >
                <CardHeader className="text-center">
                  <div className={`mx-auto mb-4 p-4 rounded-full bg-gradient-to-br ${role.color} w-fit group-hover:scale-110 transition-transform`}>
                    <Icon className="text-white" size={32} />
                  </div>
                  <CardTitle className="text-xl">{role.title}</CardTitle>
                  <CardDescription>{role.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm text-primary font-medium">Click to continue →</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <button
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

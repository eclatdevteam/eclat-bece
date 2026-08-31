import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, School } from "lucide-react";

export default function SignUpRoleSelectionPage() {
  const navigate = useNavigate();

  const roles = [
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
          <p className="text-xl text-muted-foreground">Select your role to sign up</p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Parent Card (Left) */}
          <Card
            className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 animate-scale-in group w-full md:w-80"
            style={{ animationDelay: '0ms' }}
            onClick={() => navigate(`/auth?role=parent`)}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 w-fit group-hover:scale-110 transition-transform">
                <Users className="text-white" size={32} />
              </div>
              <CardTitle className="text-xl">Parent</CardTitle>
              <CardDescription>Monitor your child's learning journey</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-primary font-medium">Click to continue →</p>
            </CardContent>
          </Card>

          {/* Middle Section */}
          <div className="flex flex-col items-center gap-4 text-center animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="text-6xl font-black text-primary/20">OR</div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-foreground">Choose Your Path</h3>
              <p className="text-muted-foreground text-sm">Sign up to get started with Éclat</p>
            </div>
          </div>

          {/* School Card (Right) */}
          <Card
            className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 animate-scale-in group w-full md:w-80"
            style={{ animationDelay: '200ms' }}
            onClick={() => navigate(`/auth?role=school`)}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-4 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 w-fit group-hover:scale-110 transition-transform">
                <School className="text-white" size={32} />
              </div>
              <CardTitle className="text-xl">School</CardTitle>
              <CardDescription>Manage students and view analytics</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-primary font-medium">Click to continue →</p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8 space-y-3">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/auth/login/role-selection")}
              className="text-primary font-semibold hover:underline"
            >
              Log In
            </button>
          </p>
          <div>
            <button
              onClick={() => navigate("/")}
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

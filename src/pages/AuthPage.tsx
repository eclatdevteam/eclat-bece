import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen } from "lucide-react";

export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") || "student";
  const [isLoading, setIsLoading] = useState(false);

  const getRoleTitle = () => {
    switch (role) {
      case "parent": return "Parent";
      case "school": return "School";
      default: return "Student";
    }
  };

  const getDashboardPath = () => {
    switch (role) {
      case "parent": return "/dashboard/parent";
      case "school": return "/dashboard/school";
      default: return "/dashboard/student";
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate login - no actual authentication
    setTimeout(() => {
      setIsLoading(false);
      navigate(getDashboardPath());
    }, 1000);
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate signup - no actual authentication
    setTimeout(() => {
      setIsLoading(false);
      navigate(getDashboardPath());
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light/20 via-background to-accent-light/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 mb-2">
            <BookOpen className="text-primary" size={32} />
            <h1 className="text-3xl font-bold text-foreground">Éclat</h1>
          </div>
          <p className="text-muted-foreground">Empowering learning, one quiz at a time</p>
        </div>

        <Card className="border-2 animate-scale-in">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Welcome, {getRoleTitle()}</CardTitle>
            <CardDescription className="text-center">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              {/* Login Form */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  {role === "student" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="login-email">Email</Label>
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="you@example.com"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="login-password">Password</Label>
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="••••••••"
                          required
                        />
                      </div>
                    </>
                  )}
                  
                  {role === "parent" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="login-child-code">Child Code or Email</Label>
                        <Input
                          id="login-child-code"
                          type="text"
                          placeholder="ABC123 or child@example.com"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="login-password">Your Password</Label>
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="••••••••"
                          required
                        />
                      </div>
                    </>
                  )}
                  
                  {role === "school" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="login-school-code">School Code</Label>
                        <Input
                          id="login-school-code"
                          type="text"
                          placeholder="SCH123"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="login-password">Password</Label>
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="••••••••"
                          required
                        />
                      </div>
                    </>
                  )}
                  <Button
                    type="submit"
                    variant="hero"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                  <p className="text-sm text-center text-muted-foreground">
                    Forgot your password?{" "}
                    <button type="button" className="text-primary hover:underline">
                      Reset here
                    </button>
                  </p>
                </form>
              </TabsContent>

              {/* Signup Form */}
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  {role === "student" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="signup-name">Full Name</Label>
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="Ada Okafor"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="you@example.com"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="••••••••"
                          required
                        />
                      </div>
                    </>
                  )}
                  
                  {role === "parent" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="signup-name">Your Full Name</Label>
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="Ada Okafor"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-child-code">Child Code or Email</Label>
                        <Input
                          id="signup-child-code"
                          type="text"
                          placeholder="ABC123 or child@example.com"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Your Password</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="••••••••"
                          required
                        />
                      </div>
                    </>
                  )}
                  
                  {role === "school" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="signup-school-name">School Name</Label>
                        <Input
                          id="signup-school-name"
                          type="text"
                          placeholder="Lagos International School"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-school-code">School Code</Label>
                        <Input
                          id="signup-school-code"
                          type="text"
                          placeholder="SCH123"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="••••••••"
                          required
                        />
                      </div>
                    </>
                  )}
                  <Button
                    type="submit"
                    variant="hero"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center">
              <Button variant="ghost" onClick={() => navigate("/role-selection")} className="text-sm">
                ← Back to Role Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

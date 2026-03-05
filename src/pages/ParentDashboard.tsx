import { useState, useEffect } from "react";
import { Users, TrendingUp, BookOpen, Plus, FileText, LogOut, Settings, Award, Target } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { CompetitionLeaderboards } from "@/components/CompetitionLeaderboards";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { StudentReportDialog } from "@/components/StudentReportDialog";
import { AssignPracticeDialog } from "@/components/AssignPracticeDialog";
import { DummyPaymentModal } from "@/components/parent/DummyPaymentModal";
import { useTheme } from "next-themes";
import logoDark from "@/assets/logo-dark.png";
import logoLight from "@/assets/logo-light.png";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

interface LinkedChild {
  id: string;
  user_id: string;
  class_year: string | null;
  is_premium?: boolean;
  profile: {
    full_name: string | null;
    unique_id: string;
  };
}

interface QuizResult {
  id: string;
  subject: string;
  score: number;
  correct_answers: number;
  total_questions: number;
  completed_at: string;
}

interface ChildAnalytics {
  studentId: string;
  averageScore: number;
  totalQuizzes: number;
  subjectPerformance: { subject: string; avgScore: number; count: number }[];
  recentQuizzes: QuizResult[];
}

export default function ParentDashboard() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { theme } = useTheme();
  const [reportOpen, setReportOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedChild, setSelectedChild] = useState<{ name: string; class: string; avatar: string } | null>(null);
  const [addChildOpen, setAddChildOpen] = useState(false);
  const [studentCode, setStudentCode] = useState("");
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [linkedChildren, setLinkedChildren] = useState<LinkedChild[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [parentUserId, setParentUserId] = useState<string | null>(null);
  const [childrenAnalytics, setChildrenAnalytics] = useState<Map<string, ChildAnalytics>>(new Map());
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPaymentChild, setSelectedPaymentChild] = useState<{ id: string; name: string } | null>(null);

  const logo = theme === "dark" ? logoLight : logoDark;

  useEffect(() => {
    const fetchParentData = async () => {
      if (!user) return;

      try {
        const { data: parentData } = await supabase
          .from("parents")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (parentData) {
          setParentUserId(parentData.id);
          await fetchLinkedChildren(parentData.id);
        }
      } catch (error) {
        console.error("Error fetching parent data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchParentData();
  }, [user]);

  const fetchLinkedChildren = async (parentId: string) => {
    try {
      const { data, error } = await supabase
        .from("students")
        .select(`
          id,
          user_id,
          class_year,
          is_premium,
          profile:profiles(full_name, unique_id, username)
        `)
        .eq("parent_id", parentId);

      if (error) throw error;

      if (data) {
        setLinkedChildren(data as unknown as LinkedChild[]);
        // Fetch analytics for each child
        data.forEach((child) => {
          fetchChildAnalytics(child.id);
        });
      }
    } catch (error) {
      console.error("Error fetching linked children:", error);
      toast.error("Failed to load linked children");
    }
  };

  const fetchChildAnalytics = async (studentId: string) => {
    try {
      const { data: quizResults, error } = await supabase
        .from("quiz_results")
        .select("*")
        .eq("student_id", studentId)
        .order("completed_at", { ascending: false });

      if (error) throw error;

      if (quizResults && quizResults.length > 0) {
        // Calculate average score
        const averageScore = quizResults.reduce((acc, result) => acc + result.score, 0) / quizResults.length;

        // Calculate subject performance
        const subjectMap = new Map<string, { totalScore: number; count: number }>();
        quizResults.forEach((result) => {
          const existing = subjectMap.get(result.subject) || { totalScore: 0, count: 0 };
          subjectMap.set(result.subject, {
            totalScore: existing.totalScore + result.score,
            count: existing.count + 1,
          });
        });

        const subjectPerformance = Array.from(subjectMap.entries()).map(([subject, data]) => ({
          subject: subject.charAt(0).toUpperCase() + subject.slice(1),
          avgScore: Math.round(data.totalScore / data.count),
          count: data.count,
        }));

        const analytics: ChildAnalytics = {
          studentId,
          averageScore: Math.round(averageScore),
          totalQuizzes: quizResults.length,
          subjectPerformance,
          recentQuizzes: quizResults.slice(0, 5) as QuizResult[],
        };

        setChildrenAnalytics((prev) => new Map(prev).set(studentId, analytics));
      }
    } catch (error) {
      console.error("Error fetching child analytics:", error);
    }
  };

  const [newChildData, setNewChildData] = useState({
    fullName: "",
    classYear: "",
    username: "",
    password: "",
  });
  const [createdChildCredentials, setCreatedChildCredentials] = useState<{ username: string; password: string } | null>(null);

  const handleCreateChild = async () => {
    if (!newChildData.fullName || !newChildData.classYear || !newChildData.username || !newChildData.password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (newChildData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (!parentUserId) {
      toast.error("Parent profile not found");
      return;
    }

    setIsAddingChild(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("No session found");

      const response = await supabase.functions.invoke("create-student-account", {
        body: newChildData,
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) {
        toast.error(response.error.message || "Failed to create student account");
        throw new Error(response.error.message);
      }

      toast.success("Student account created successfully!");
      setCreatedChildCredentials({ username: newChildData.username, password: newChildData.password });

      // Refresh linked children list
      await fetchLinkedChildren(parentUserId);
    } catch (error) {
      console.error("Error creating student account:", error);
    } finally {
      setIsAddingChild(false);
    }
  };

  const handleCloseAddChild = () => {
    setAddChildOpen(false);
    setNewChildData({ fullName: "", classYear: "", username: "", password: "" });
    setCreatedChildCredentials(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light/20 via-background to-accent-light/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <img
            src={logo}
            alt="Éclat Logo"
            className="h-16 w-auto cursor-pointer"
            onClick={() => navigate("/")}
          />
          <div className="flex items-center gap-4">
            <NotificationBell />
            <Button variant="ghost" size="icon">
              <Settings size={20} />
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut size={20} />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h2 className="text-3xl font-bold text-foreground mb-2">Welcome back! 👋</h2>
          <p className="text-muted-foreground">Track your children's exam prep progress and support their educational journey</p>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3 mb-8 animate-slide-up">
          <Button variant="hero" onClick={() => setAddChildOpen(true)}>
            <Plus size={18} />
            Add Child
          </Button>
          <Button variant="outline">
            <FileText size={18} />
            View All Reports
          </Button>
        </div>

        {/* Children Overview */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading your children...</p>
          </div>
        ) : linkedChildren.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Children Linked Yet</h3>
              <p className="text-muted-foreground mb-4">
                Add your first child by clicking the "Add Child" button above
              </p>
              <Button variant="hero" onClick={() => setAddChildOpen(true)}>
                <Plus size={18} />
                Add Child
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {linkedChildren.map((child, index) => (
              <Card
                key={child.id}
                className="border-2 hover:shadow-hover transition-all animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-gradient-hero flex items-center justify-center text-2xl font-bold text-white">
                        {child.profile.full_name?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div>
                        <CardTitle className="text-2xl">{child.profile.full_name || "Unknown"}</CardTitle>
                        <CardDescription className="text-base">
                          {child.class_year === "year_6" ? "Year 6" : child.class_year === "year_9" ? "Year 9" : "No Class"}
                        </CardDescription>
                        <p className="text-xs text-muted-foreground mt-1">Code: {child.profile.unique_id}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedChild({
                            name: child.profile.full_name || "Unknown",
                            class: child.class_year === "year_6" ? "Year 6" : "Year 9",
                            avatar: child.profile.full_name?.charAt(0).toUpperCase() || "?"
                          });
                          setReportOpen(true);
                        }}
                      >
                        View Report
                      </Button>
                      <Button
                        variant="hero"
                        size="sm"
                        onClick={() => {
                          setSelectedChild({
                            name: child.profile.full_name || "Unknown",
                            class: child.class_year === "year_6" ? "Year 6" : "Year 9",
                            avatar: child.profile.full_name?.charAt(0).toUpperCase() || "?"
                          });
                          setAssignOpen(true);
                        }}
                      >
                        Assign Practice
                      </Button>
                    </div>
                    {!child.is_premium && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:bg-primary/10 mt-2"
                        onClick={() => {
                          setSelectedPaymentChild({ id: child.id, name: child.profile.full_name || "Unknown" });
                          setPaymentModalOpen(true);
                        }}
                      >
                        Upgrade to Premium
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {childrenAnalytics.has(child.id) ? (
                    <div className="space-y-6">
                      {/* Key Stats */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 rounded-lg bg-primary-light border border-primary/20">
                          <div className="flex items-center gap-2 mb-1">
                            <Award className="h-4 w-4 text-primary" />
                            <p className="text-xs font-medium text-muted-foreground">Avg Score</p>
                          </div>
                          <p className="text-2xl font-bold text-foreground">
                            {childrenAnalytics.get(child.id)!.averageScore}%
                          </p>
                        </div>
                        <div className="p-4 rounded-lg bg-accent-light border border-accent/20">
                          <div className="flex items-center gap-2 mb-1">
                            <Target className="h-4 w-4 text-accent" />
                            <p className="text-xs font-medium text-muted-foreground">Total Quizzes</p>
                          </div>
                          <p className="text-2xl font-bold text-foreground">
                            {childrenAnalytics.get(child.id)!.totalQuizzes}
                          </p>
                        </div>
                        <div className="p-4 rounded-lg bg-secondary border border-border">
                          <div className="flex items-center gap-2 mb-1">
                            <BookOpen className="h-4 w-4 text-primary" />
                            <p className="text-xs font-medium text-muted-foreground">Subjects</p>
                          </div>
                          <p className="text-2xl font-bold text-foreground">
                            {childrenAnalytics.get(child.id)!.subjectPerformance.length}
                          </p>
                        </div>
                      </div>

                      {/* Subject Performance Chart */}
                      {childrenAnalytics.get(child.id)!.subjectPerformance.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm text-foreground">Subject Performance</h4>
                          <div className="h-64 w-full">
                            <ChartContainer
                              config={{
                                avgScore: {
                                  label: "Average Score",
                                  color: "hsl(var(--primary))",
                                },
                              }}
                            >
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={childrenAnalytics.get(child.id)!.subjectPerformance}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                  <XAxis
                                    dataKey="subject"
                                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                                  />
                                  <YAxis
                                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                                    domain={[0, 100]}
                                  />
                                  <ChartTooltip content={<ChartTooltipContent />} />
                                  <Bar
                                    dataKey="avgScore"
                                    fill="hsl(var(--primary))"
                                    radius={[8, 8, 0, 0]}
                                  />
                                </BarChart>
                              </ResponsiveContainer>
                            </ChartContainer>
                          </div>
                        </div>
                      )}

                      {/* Recent Activity */}
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-foreground">Recent Quizzes</h4>
                        <div className="space-y-2">
                          {childrenAnalytics.get(child.id)!.recentQuizzes.slice(0, 3).map((quiz) => (
                            <div
                              key={quiz.id}
                              className="flex items-center justify-between p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary-light flex items-center justify-center">
                                  <BookOpen className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm text-foreground">
                                    {quiz.subject.charAt(0).toUpperCase() + quiz.subject.slice(1)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(quiz.completed_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-lg text-foreground">{Math.round(quiz.score)}%</p>
                                <p className="text-xs text-muted-foreground">
                                  {quiz.correct_answers}/{quiz.total_questions}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="mb-2">No quiz data yet</p>
                      <p className="text-sm">Analytics will appear once your child completes their first quiz</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Support Section */}
        <Card className="mt-8 border-2 border-primary animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">💪</span>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Supporting Your Child's Success</h3>
                <p className="text-muted-foreground mb-4">
                  Every question completed brings them closer to exam excellence. Encourage regular practice and celebrate progress!
                </p>
                <Button variant="outline" size="sm">
                  📚 View Parent Resources
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <StudentReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        studentName={selectedChild?.name || ""}
        studentClass={selectedChild?.class || ""}
        avatar={selectedChild?.avatar}
      />
      <AssignPracticeDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        childName={selectedChild?.name}
      />

      {/* Add Child Dialog */}
      <Dialog open={addChildOpen} onOpenChange={handleCloseAddChild}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{createdChildCredentials ? "Student Account Created" : "Create Student Account"}</DialogTitle>
            <DialogDescription>
              {createdChildCredentials
                ? "Please save these login credentials. Your child will need them to log in."
                : "Create a new student account for your child."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {createdChildCredentials ? (
              <div className="space-y-4 p-4 bg-muted rounded-lg border border-border">
                <div>
                  <Label className="text-muted-foreground text-xs">Username</Label>
                  <p className="font-mono text-lg font-medium">{createdChildCredentials.username}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Password</Label>
                  <p className="font-mono text-lg font-medium">{createdChildCredentials.password}</p>
                </div>
                <Button
                  className="w-full mt-4"
                  variant="hero"
                  onClick={handleCloseAddChild}
                >
                  Done
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    placeholder="e.g. Ada Okafor"
                    value={newChildData.fullName}
                    onChange={(e) => setNewChildData({ ...newChildData, fullName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="classYear">Class Year</Label>
                  <select
                    id="classYear"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={newChildData.classYear}
                    onChange={(e) => setNewChildData({ ...newChildData, classYear: e.target.value })}
                  >
                    <option value="" disabled>Select Class Year</option>
                    <option value="year_6">Year 6 (Primary 6)</option>
                    <option value="year_9">Year 9 (JSS 3)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Student Username</Label>
                  <Input
                    id="username"
                    placeholder="e.g. ada.okafor"
                    value={newChildData.username}
                    onChange={(e) => setNewChildData({ ...newChildData, username: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Student Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={newChildData.password}
                    onChange={(e) => setNewChildData({ ...newChildData, password: e.target.value })}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={handleCloseAddChild}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="hero"
                    onClick={handleCreateChild}
                    disabled={isAddingChild || !newChildData.fullName || !newChildData.classYear || !newChildData.username || !newChildData.password.trim()}
                    className="flex-1"
                  >
                    {isAddingChild ? "Creating..." : "Create Account"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {selectedPaymentChild && (
        <DummyPaymentModal
          open={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
          studentId={selectedPaymentChild.id}
          studentName={selectedPaymentChild.name}
          onSuccess={() => {
            if (parentUserId) fetchLinkedChildren(parentUserId);
          }}
        />
      )}
    </div>
  );
}


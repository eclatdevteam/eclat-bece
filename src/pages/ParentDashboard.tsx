import { useState, useEffect } from "react";
import { Users, TrendingUp, Plus, Award, Target, HelpCircle, Settings } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { StudentReportDialog } from "@/components/StudentReportDialog";
import { AssignPracticeDialog } from "@/components/AssignPracticeDialog";
import { ChildOverviewCard } from "@/components/parent/ChildOverviewCard";
import { DummyPaymentModal } from "@/components/parent/DummyPaymentModal";
import { ParentActivityFeed } from "@/components/parent/ParentActivityFeed";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LinkedChild, ChildAnalytics, QuizResult } from "@/types/parent";

export default function ParentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reportOpen, setReportOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedChild, setSelectedChild] = useState<{ name: string; class: string; avatar: string } | null>(null);
  const [addChildOpen, setAddChildOpen] = useState(false);
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [linkedChildren, setLinkedChildren] = useState<LinkedChild[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [parentUserId, setParentUserId] = useState<string | null>(null);
  const [childrenAnalytics, setChildrenAnalytics] = useState<Map<string, ChildAnalytics>>(new Map());
  const [globalActivities, setGlobalActivities] = useState<QuizResult[]>([]);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPaymentChild, setSelectedPaymentChild] = useState<{ id: string; name: string } | null>(null);

  // Derived Top-Level Metrics
  const totalChildren = linkedChildren.length;
  const premiumChildrenCount = linkedChildren.filter(c => c.is_premium).length;

  let totalQuizzesGlobal = 0;
  let totalScoreGlobal = 0;

  childrenAnalytics.forEach(analytics => {
    totalQuizzesGlobal += analytics.totalQuizzes;
    totalScoreGlobal += (analytics.averageScore * analytics.totalQuizzes); // Weighted sum
  });

  const overallAverage = totalQuizzesGlobal > 0 ? Math.round(totalScoreGlobal / totalQuizzesGlobal) : 0;


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

        // Add to global activities
        const studentName = linkedChildren.find(c => c.id === studentId)?.profile.full_name || "Unknown";
        const activitiesWithName = quizResults.map(q => ({ ...q, student_name: studentName })) as QuizResult[];

        setGlobalActivities(prev => {
          const combined = [...prev, ...activitiesWithName];
          // Sort by completed_at descending
          return combined.sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()).slice(0, 20); // Keep top 20
        });
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
    <div className="animate-fade-in pb-12 px-2 sm:px-4">
      {/* Welcome Section */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
        <div className="space-y-1">
          <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">Parent Portal <span className="text-primary">.</span></h2>
          <p className="text-muted-foreground font-medium text-sm sm:text-base">Empowering your children's educational success with data-driven insights.</p>
        </div>
        <Button size="lg" variant="hero" onClick={() => setAddChildOpen(true)} className="rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/30 h-14">
          <Plus size={20} className="mr-2 stroke-[3px]" />
          Add New Child
        </Button>
      </div>

      {/* Top-Level Overview Metrics */}
      {!isLoading && linkedChildren.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-12 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <Card className="border-border/50 shadow-sm bg-background/50 backdrop-blur-sm rounded-[2rem] overflow-hidden group hover:border-primary/30 transition-all duration-300">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-primary/10 rounded-2xl shrink-0 group-hover:scale-110 transition-transform duration-300">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total</p>
                <p className="text-2xl font-black text-foreground">{totalChildren}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 shadow-sm bg-background/50 backdrop-blur-sm rounded-[2rem] overflow-hidden group hover:border-green-500/30 transition-all duration-300">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-green-500/10 rounded-2xl shrink-0 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Performance</p>
                <p className="text-2xl font-black text-foreground">{overallAverage}%</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 shadow-sm bg-background/50 backdrop-blur-sm rounded-[2rem] overflow-hidden group hover:border-blue-500/30 transition-all duration-300">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-blue-500/10 rounded-2xl shrink-0 group-hover:scale-110 transition-transform duration-300">
                <Target className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Completed</p>
                <p className="text-2xl font-black text-foreground">{totalQuizzesGlobal}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 shadow-sm bg-background/50 backdrop-blur-sm rounded-[2rem] overflow-hidden group hover:border-amber-500/30 transition-all duration-300">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-amber-500/10 rounded-2xl shrink-0 group-hover:scale-110 transition-transform duration-300">
                <Award className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Status</p>
                <p className="text-xl font-black text-foreground leading-tight">
                  {premiumChildrenCount} <span className="text-xs font-bold text-muted-foreground opacity-60">PREMIUM</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Children Overview */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading your children...</p>
        </div>
      ) : linkedChildren.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="py-20 text-center flex flex-col items-center justify-center bg-gradient-to-b from-card to-muted/20">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <Users className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Welcome to your Parent Portal!</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto text-lg">
              Let's get started by creating an account for your child. Once connected, you can track their progress and assign practice.
            </p>
            <Button size="lg" variant="hero" onClick={() => setAddChildOpen(true)} className="text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
              <Plus className="mr-2" size={24} />
              Create First Child Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Left Column: Children Cards */}
          <div id="children" className="lg:col-span-8 space-y-8 scroll-mt-24">
            <div className="flex items-center gap-3 mb-2 px-1">
              <div className="h-8 w-1.5 bg-primary rounded-full" />
              <h3 className="text-2xl font-black text-foreground tracking-tight uppercase">My Students</h3>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {linkedChildren.map((child, index) => (
                <ChildOverviewCard
                  key={child.id}
                  child={child}
                  index={index}
                  analytics={childrenAnalytics.get(child.id)}
                  onViewReport={(c) => {
                    setSelectedChild({
                      name: c.profile.full_name || "Unknown",
                      class: c.class_year === "year_6" ? "Year 6" : "Year 9",
                      avatar: c.profile.full_name?.charAt(0).toUpperCase() || "?"
                    });
                    setReportOpen(true);
                  }}
                  onAssignPractice={(c) => {
                    setSelectedChild({
                      name: c.profile.full_name || "Unknown",
                      class: c.class_year === "year_6" ? "Year 6" : "Year 9",
                      avatar: c.profile.full_name?.charAt(0).toUpperCase() || "?"
                    });
                    setAssignOpen(true);
                  }}
                  onUpgradePremium={(c) => {
                    setSelectedPaymentChild({ id: c.id, name: c.profile.full_name || "Unknown" });
                    setPaymentModalOpen(true);
                  }}
                />
              ))}
            </div>
          </div>

          {/* Right Column: Activity Feed & Sidebar */}
          <div className="lg:col-span-4 space-y-10">
            <ParentActivityFeed activities={globalActivities} isLoading={isLoading} />

            <div id="resources" className="scroll-mt-24 space-y-6">
              <Card className="border-none shadow-2xl bg-gradient-hero text-white rounded-[2.5rem] overflow-hidden relative">
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl opacity-50" />
                <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-black/10 rounded-full blur-3xl opacity-50" />
                <CardContent className="p-8 relative z-10 flex flex-col gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                    <Award className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-2xl mb-3 tracking-tight italic">Success Resources</h3>
                    <p className="text-white/80 font-medium mb-6 leading-relaxed">
                      Discover the best strategies to guide your child through their exam preparation with expert tips and materials.
                    </p>
                    <Button variant="secondary" className="w-full h-12 rounded-[1.25rem] font-bold text-primary hover:shadow-xl transition-all duration-300">
                      Explore Learning Hub
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="px-1 space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Quick Help</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="h-20 rounded-3xl border-border/50 bg-background/50 flex flex-col items-center justify-center gap-1 hover:border-primary/50 hover:bg-primary/5 transition-all">
                    <Settings className="h-5 w-5 opacity-40" />
                    <span className="text-[10px] font-black tracking-widest uppercase">Settings</span>
                  </Button>
                  <Button variant="outline" className="h-20 rounded-3xl border-border/50 bg-background/50 flex flex-col items-center justify-center gap-1 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all">
                    <HelpCircle className="h-5 w-5 opacity-40" />
                    <span className="text-[10px] font-black tracking-widest uppercase">Support</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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

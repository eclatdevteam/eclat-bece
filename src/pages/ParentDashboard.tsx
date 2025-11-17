import { useState, useEffect } from "react";
import { Users, TrendingUp, BookOpen, Plus, FileText, LogOut, Settings } from "lucide-react";
import { CompetitionLeaderboards } from "@/components/CompetitionLeaderboards";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { StudentReportDialog } from "@/components/StudentReportDialog";
import { AssignPracticeDialog } from "@/components/AssignPracticeDialog";
import { useTheme } from "next-themes";
import logoDark from "@/assets/logo-dark.png";
import logoLight from "@/assets/logo-light.png";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LinkedChild {
  id: string;
  user_id: string;
  class_year: string | null;
  profile: {
    full_name: string | null;
    unique_id: string;
  };
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
          profile:profiles!students_user_id_fkey(full_name, unique_id)
        `)
        .eq("parent_id", parentId);

      if (error) throw error;

      if (data) {
        setLinkedChildren(data as unknown as LinkedChild[]);
      }
    } catch (error) {
      console.error("Error fetching linked children:", error);
      toast.error("Failed to load linked children");
    }
  };

  const handleAddChild = async () => {
    if (!studentCode.trim()) {
      toast.error("Please enter a student code");
      return;
    }

    if (studentCode.length !== 8) {
      toast.error("Student code must be 8 characters");
      return;
    }

    if (!parentUserId) {
      toast.error("Parent profile not found");
      return;
    }

    setIsAddingChild(true);

    try {
      // Find the student by their unique_id
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("unique_id", studentCode.toUpperCase())
        .single();

      if (profileError || !profileData) {
        toast.error("Invalid student code. Please check and try again.");
        setIsAddingChild(false);
        return;
      }

      // Check if this user is actually a student
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select("id, parent_id")
        .eq("user_id", profileData.id)
        .single();

      if (studentError || !studentData) {
        toast.error("This code does not belong to a student account");
        setIsAddingChild(false);
        return;
      }

      // Check if already linked to this parent
      if (studentData.parent_id === parentUserId) {
        toast.error("This child is already linked to your account");
        setIsAddingChild(false);
        return;
      }

      // Check if already linked to another parent
      if (studentData.parent_id && studentData.parent_id !== parentUserId) {
        toast.error("This student is already linked to another parent account");
        setIsAddingChild(false);
        return;
      }

      // Link the student to this parent
      const { error: updateError } = await supabase
        .from("students")
        .update({ parent_id: parentUserId })
        .eq("id", studentData.id);

      if (updateError) throw updateError;

      toast.success("Child successfully linked to your account!");
      setStudentCode("");
      setAddChildOpen(false);
      
      // Refresh the linked children list
      await fetchLinkedChildren(parentUserId);
    } catch (error) {
      console.error("Error linking child:", error);
      toast.error("Failed to link child. Please try again.");
    } finally {
      setIsAddingChild(false);
    }
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
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="mb-2">Detailed analytics coming soon!</p>
                    <p className="text-sm">We're working on bringing you comprehensive performance insights.</p>
                  </div>
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
      <Dialog open={addChildOpen} onOpenChange={setAddChildOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Child</DialogTitle>
            <DialogDescription>
              Enter your child's 8-character student code to link their account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="studentCode">Student Code</Label>
              <Input
                id="studentCode"
                placeholder="Enter 8-character code"
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value.toUpperCase())}
                maxLength={8}
                className="uppercase font-mono text-lg tracking-widest"
              />
              <p className="text-sm text-muted-foreground">
                Ask your child for their unique student code from their dashboard
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setAddChildOpen(false);
                  setStudentCode("");
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="hero"
                onClick={handleAddChild}
                disabled={isAddingChild || studentCode.length !== 8}
                className="flex-1"
              >
                {isAddingChild ? "Linking..." : "Link Child"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


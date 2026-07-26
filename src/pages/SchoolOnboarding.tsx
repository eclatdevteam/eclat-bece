import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, Loader2, School, ChevronRight, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getSafeErrorMessage } from "@/lib/errorUtils";

export default function SchoolOnboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [address, setAddress] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "User not found. Please sign in again.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      // Update school record - just mark as onboarding completed
      // Additional fields can be added to schools table if needed
      const { error: updateError } = await supabase
        .from("schools")
        .update({
          // Add any school-specific fields here if needed in future
        })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      toast({
        title: "Welcome to Éclat!",
        description: "Your school account has been set up successfully.",
      });

      navigate("/dashboard/school");
    } catch (error: any) {
      toast({
        title: "Setup Failed",
        description: getSafeErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light/20 via-background to-accent-light/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 mb-2">
            <BookOpen className="text-primary" size={32} />
            <h1 className="text-3xl font-bold text-foreground">Éclat</h1>
          </div>
          <p className="text-muted-foreground">Complete your profile</p>
        </div>

        <Card className="border-2 animate-scale-in">
          <CardHeader>
            <CardTitle className="text-2xl text-center">School Profile Setup</CardTitle>
            <CardDescription className="text-center">
              Your school account is ready! Click continue to access your dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <School className="h-4 w-4" />
                  School Address (Optional)
                </Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="123 Education Street, Lagos"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  maxLength={200}
                  className="min-h-[44px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-email">Contact Email (Optional)</Label>
                <Input
                  id="contact-email"
                  type="email"
                  placeholder="admin@school.edu"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  maxLength={255}
                  className="min-h-[44px]"
                />
                <p className="text-xs text-muted-foreground">
                  Alternative email for school communications
                </p>
              </div>

              <div className="bg-primary/10 p-4 rounded-lg border border-primary/20 animate-pulse-soft">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                  <p className="text-sm">
                    <strong>Your School Code:</strong> You'll find your unique school code on your dashboard. 
                    Share it with students to allow them to join your school.
                  </p>
                </div>
              </div>

              <Button
                type="submit"
                variant="hero"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    Continue to Dashboard
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

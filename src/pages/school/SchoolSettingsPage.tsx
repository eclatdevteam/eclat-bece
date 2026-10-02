import { useState } from "react";
import { Settings, Copy, Check, Building2, Mail, MapPin, Shield, Sun, Moon, Laptop, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SchoolLayout } from "@/components/school/SchoolLayout";
import { SchoolSettingsDialog } from "@/components/school/SchoolSettingsDialog";
import { useSchoolData } from "@/hooks/useSchoolData";
import { toast } from "sonner";
import { useTheme } from "next-themes";

export function SchoolSettingsPage() {
  const { school, refresh } = useSchoolData();
  const { theme, setTheme } = useTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    if (!school?.school_code) return;
    try {
      await navigator.clipboard.writeText(school.school_code);
      setCopied(true);
      toast.success("School code copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy school code");
    }
  };

  return (
    <SchoolLayout
      title="Settings"
      subtitle="Manage school registration details, enrollment codes, and administrative preferences."
      actions={
        <Button
          onClick={() => setSettingsOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-xs sm:text-sm shadow-sm"
        >
          <Settings className="mr-1.5 h-4 w-4" />
          Update profile
        </Button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* School Profile Card */}
        <Card className="border-border bg-card text-card-foreground min-w-0 shadow-sm">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-base font-semibold text-foreground dark:text-[#71c9ed] flex items-center gap-2">
              <Building2 className="h-4 w-4 text-sky-600 dark:text-[#58c4e8]" />
              School Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5 text-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl border border-border bg-muted/40 p-3.5">
              <div>
                <p className="text-xs text-muted-foreground">School Enrollment Code</p>
                <p className="text-[11px] text-muted-foreground">Share with students to link them automatically</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-black text-sky-600 dark:text-[#7dd3fc]">
                  {school?.school_code || "PENDING"}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyCode}
                  className="h-8 px-2 text-muted-foreground hover:text-foreground"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 p-3.5 text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-4 w-4 text-muted-foreground/70" />
                <span>Institution Name</span>
              </div>
              <span className="font-semibold text-foreground">{school?.school_name || "Lighthouse Academy"}</span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 p-3.5 text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4 text-muted-foreground/70" />
                <span>Contact Email</span>
              </div>
              <span className="text-foreground">{school?.contact_email || "admin@school.edu"}</span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 p-3.5 text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 text-muted-foreground/70" />
                <span>Campus Location</span>
              </div>
              <span className="text-foreground">{school?.address || "Lagos, Nigeria"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Operational Preferences Card */}
        <Card className="border-border bg-card text-card-foreground min-w-0 shadow-sm">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-base font-semibold text-foreground dark:text-[#71c9ed] flex items-center gap-2">
              <Shield className="h-4 w-4 text-sky-600 dark:text-[#58c4e8]" />
              Institutional Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-5 text-xs sm:text-sm">
            {[
              { title: "Enable automated practice reminders", desc: "Notify students when new assignments are due" },
              { title: "Allow student self-enrollment", desc: "Permit learners to join using the school referral code" },
              { title: "Publish monthly leaderboard standing", desc: "Display school ranking on public and national leaderboards" },
              { title: "Parent performance notifications", desc: "Allow linked parents to view ward mock evaluation grades" },
            ].map((pref) => (
              <label
                key={pref.title}
                className="flex items-start justify-between gap-3 rounded-xl border border-border bg-muted/30 p-3.5 cursor-pointer hover:border-primary/40 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground">{pref.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{pref.desc}</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 mt-0.5 accent-primary rounded cursor-pointer"
                />
              </label>
            ))}
          </CardContent>
        </Card>

        {/* Appearance & Theme Card */}
        <Card className="border-border bg-card text-card-foreground min-w-0 lg:col-span-2 shadow-sm">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-base font-semibold text-foreground dark:text-[#71c9ed] flex items-center gap-2">
              <Palette className="h-4 w-4 text-sky-600 dark:text-[#58c4e8]" />
              Appearance & Theme
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <p className="text-xs sm:text-sm text-muted-foreground mb-4">
              Select your visual preference for the school administrative console.
            </p>
            <div className="grid grid-cols-3 gap-3 max-w-md">
              <Button
                type="button"
                variant={theme === "light" ? "default" : "outline"}
                className={`flex flex-col items-center justify-center gap-1.5 h-20 rounded-xl transition-all ${
                  theme === "light"
                    ? "bg-primary text-primary-foreground font-bold shadow-sm"
                    : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                onClick={() => setTheme("light")}
              >
                <Sun className="h-5 w-5 text-amber-500" />
                <span className="text-xs font-semibold">Light</span>
              </Button>
              <Button
                type="button"
                variant={theme === "dark" ? "default" : "outline"}
                className={`flex flex-col items-center justify-center gap-1.5 h-20 rounded-xl transition-all ${
                  theme === "dark"
                    ? "bg-primary text-primary-foreground font-bold shadow-sm"
                    : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                onClick={() => setTheme("dark")}
              >
                <Moon className="h-5 w-5 text-sky-400" />
                <span className="text-xs font-semibold">Dark</span>
              </Button>
              <Button
                type="button"
                variant={theme === "system" ? "default" : "outline"}
                className={`flex flex-col items-center justify-center gap-1.5 h-20 rounded-xl transition-all ${
                  theme === "system"
                    ? "bg-primary text-primary-foreground font-bold shadow-sm"
                    : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                onClick={() => setTheme("system")}
              >
                <Laptop className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs font-semibold">System</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <SchoolSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        school={school}
        onSuccess={() => refresh()}
      />
    </SchoolLayout>
  );
}

export default SchoolSettingsPage;

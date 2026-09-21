import { AlertTriangle, CalendarClock, CheckCircle2, Clock3, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const needsAttention = [
  {
    title: "Advanced Algebra Worksheet",
    child: "Ore Alle",
    subject: "Mathematics",
    status: "Overdue",
    statusTone: "red",
    due: "2 days ago",
    action: "Remind Child",
  },
  {
    title: "Physics Lab Report",
    child: "Ore Alle",
    subject: "Science",
    status: "Overdue",
    statusTone: "red",
    due: "Yesterday",
    action: "Remind Child",
  },
];

const upcoming = [
  {
    title: "English Literature Essay",
    child: "Weird Ore",
    subject: "English",
    status: "Pending",
    statusTone: "blue",
    due: "Due tomorrow, 11:59 PM",
    action: "View Details",
  },
  {
    title: "World History Quiz Prep",
    child: "Ore Alle",
    subject: "History",
    status: "Pending",
    statusTone: "blue",
    due: "Due in 3 days",
    action: "View Details",
  },
];

const recent = [
  {
    title: "Biology Cell Structure Project",
    child: "Weird Ore",
    subject: "Science",
    status: "Completed",
    statusTone: "green",
    due: "Submitted today",
    action: "Review Submission",
  },
  {
    title: "French Vocabulary Test",
    child: "Ore Alle",
    subject: "Languages",
    status: "Completed",
    statusTone: "green",
    due: "Submitted yesterday",
    action: "Review Grade",
  },
];

export default function ParentAssignmentsPage() {
  return (
    <div className="w-full px-3 pb-20 pt-6 md:px-6">
      <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="parent-section-chip">Academic Service</div>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-foreground md:text-5xl">Assignments Manager</h1>
          <p className="mt-2 text-base text-muted-foreground">Track and manage upcoming and overdue tasks for your children.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search assignments..." className="parent-search h-12 bg-background/40 pl-10" />
          </div>
          <Button variant="outline" className="h-12 rounded-xl border border-border/60 bg-background/30 px-4 text-sm font-semibold">All Students</Button>
          <Button variant="outline" className="h-12 rounded-xl border border-border/60 bg-background/30 px-4 text-sm font-semibold">All Subjects</Button>
          <Button variant="outline" className="h-12 rounded-xl border border-border/60 bg-background/30 px-4 text-sm font-semibold">Status: Any</Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-[#ff5d67]" />
            <h2 className="text-2xl font-black tracking-tight text-foreground">Needs Attention</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {needsAttention.map((item) => (
              <Card key={item.title} className="parent-panel rounded-[1.5rem] border border-[#ff5d67]/40 bg-[#ff5d67]/5 p-0">
                <CardContent className="p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="rounded-full bg-[#ff5d67]/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#ff6a70]">{item.status}</span>
                    <span className="text-xs font-semibold text-muted-foreground">{item.due}</span>
                  </div>

                  <h3 className="text-2xl font-black leading-tight text-foreground">{item.title}</h3>

                  <div className="mt-2 text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{item.child}</span> · {item.subject}
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <Button variant="outline" className="rounded-xl border-[#ff5d67]/30 bg-[#ff5d67]/10 font-black text-[#ff6a70] hover:bg-[#ff5d67]/20">{item.action}</Button>
                    <Button variant="ghost" className="rounded-xl border border-border/60 bg-background/30 font-semibold text-foreground">Details</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <CalendarClock className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-black tracking-tight text-foreground">Upcoming &amp; Recent</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {upcoming.map((item) => (
              <Card key={item.title} className="parent-panel rounded-[1.5rem] border border-border/60 bg-card/60 p-0">
                <CardContent className="p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary">{item.status}</span>
                    <span className="text-xs font-semibold text-muted-foreground">{item.due}</span>
                  </div>

                  <h3 className="text-2xl font-black leading-tight text-foreground">{item.title}</h3>
                  <div className="mt-2 text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{item.child}</span> · {item.subject}
                  </div>

                  <Button variant="outline" className="mt-6 w-full rounded-xl border-border/60 bg-background/30 font-semibold text-foreground">{item.action}</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[1.8rem] border border-border/60 bg-card/60 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-2xl font-black text-foreground">Recent</h3>
              <Sparkles className="h-5 w-5 text-primary" />
            </div>

            <div className="space-y-4">
              {recent.map((item) => (
                <div key={item.title} className="rounded-[1.3rem] border border-border/60 bg-background/40 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">{item.status}</span>
                    <span className="text-[11px] font-semibold text-muted-foreground">{item.due}</span>
                  </div>

                  <h4 className="text-xl font-black text-foreground">{item.title}</h4>
                  <div className="mt-2 text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{item.child}</span> · {item.subject}
                  </div>

                  <Button variant="ghost" className="mt-4 w-full justify-center rounded-xl border border-border/60 bg-background/30 font-semibold text-foreground">{item.action}</Button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.8rem] border border-border/60 bg-card/60 p-5">
            <div className="mb-3 flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              <h3 className="text-2xl font-black text-foreground">Completed Tasks</h3>
            </div>

            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/40 p-3">
                <span>Reading comprehension</span>
                <span className="font-black text-foreground">89%</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/40 p-3">
                <span>Science quiz</span>
                <span className="font-black text-foreground">92%</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/40 p-3">
                <span>Short essays</span>
                <span className="font-black text-foreground">87%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

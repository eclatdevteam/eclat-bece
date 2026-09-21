import { ArrowDownToLine, BarChart3, CheckCircle2, ChevronDown, CircleAlert, Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const subjectScores = [
  { subject: "Mathematics", value: 92, delta: "Class Avg: 78%" },
  { subject: "English Lit", value: 85, delta: "Class Avg: 81%" },
  { subject: "Science (Basic)", value: 76, delta: "Class Avg: 82%" },
  { subject: "History", value: 88, delta: "Class Avg: 75%" },
];

const sparkLine = [68, 72, 76, 80, 79, 83, 86, 90, 88, 92];

export default function ParentReportsPage() {
  return (
    <div className="w-full px-3 pb-20 pt-6 md:px-6">
      <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="parent-section-chip">Academic Service</div>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-foreground md:text-5xl">Performance Reports</h1>
          <p className="mt-2 text-base text-muted-foreground">Detailed insights and progress tracking for Ore Alle (Year 9).</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search reports..." className="parent-search h-12 bg-background/40 pl-10" />
          </div>
          <Button variant="outline" className="h-12 rounded-xl border border-border/60 bg-background/30 px-4 text-sm font-semibold">This Term</Button>
          <Button className="h-12 rounded-xl bg-primary px-4 text-sm font-black text-primary-foreground">Export PDF</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="parent-panel rounded-[1.5rem] border border-border/60 bg-card/60 p-4">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Overall score</div>
          <div className="mt-3 flex items-end gap-2">
            <div className="text-4xl font-black text-foreground">84%</div>
            <div className="mb-1 text-sm font-bold text-emerald-400">+3%</div>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">Top 15% of class</div>
        </Card>

        <Card className="parent-panel rounded-[1.5rem] border border-border/60 bg-card/60 p-4">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Assignments done</div>
          <div className="mt-3 flex items-end gap-2">
            <div className="text-4xl font-black text-foreground">42</div>
            <div className="mb-1 text-sm font-bold text-emerald-400">/45</div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: "93%" }} />
          </div>
        </Card>

        <Card className="parent-panel rounded-[1.5rem] border border-border/60 bg-card/60 p-4">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Current streak</div>
          <div className="mt-3 flex items-end gap-2">
            <div className="text-4xl font-black text-foreground">12</div>
            <div className="mb-1 text-sm font-bold text-amber-400">Days</div>
          </div>
          <div className="mt-2 text-sm text-amber-400">★ Personal best!</div>
        </Card>

        <Card className="parent-panel rounded-[1.5rem] border border-border/60 bg-card/60 p-4">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Areas of concern</div>
          <div className="mt-3 flex items-end gap-2">
            <div className="text-4xl font-black text-foreground">2</div>
            <div className="mb-1 text-sm font-bold text-[#ff9d5c]">Topics</div>
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm text-[#ff9d5c]">
            <CircleAlert className="h-4 w-4" />
            Action recommended
          </div>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
        <div className="rounded-[1.8rem] border border-border/60 bg-card/60 p-5">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tight text-foreground">Score Trend Over Time</h2>
            <div className="flex gap-2">
              <Button variant="outline" className="rounded-xl border-border/60 bg-background/30 px-3 text-sm font-medium">Week</Button>
              <Button variant="outline" className="rounded-xl border-border/60 bg-background/30 px-3 text-sm font-medium">Month</Button>
              <Button variant="outline" className="rounded-xl border-border/60 bg-background/30 px-3 text-sm font-medium">Term</Button>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-border/60 bg-background/30 p-4">
            <div className="mb-3 flex h-56 items-end gap-2">
              {sparkLine.map((item, index) => (
                <div key={index} className="flex flex-1 flex-col items-center justify-end gap-2">
                  <div className="w-full rounded-t-xl bg-gradient-to-t from-primary/30 via-primary/60 to-primary" style={{ height: `${item}%` }} />
                  <span className="text-[10px] font-medium text-muted-foreground">{index + 1}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-2"><span className="inline-block h-2.5 w-2.5 rounded-full bg-primary" /> Ore&apos;s Score</span>
              <span className="flex items-center gap-2"><span className="inline-block h-2.5 w-2.5 rounded-full border border-primary/60 bg-transparent" /> Class Average</span>
            </div>
          </div>
        </div>

        <div className="rounded-[1.8rem] border border-border/60 bg-card/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tight text-foreground">Subject Mastery</h2>
            <button className="rounded-full border border-border/60 bg-background/40 p-2 text-muted-foreground"><ChevronDown className="h-4 w-4" /></button>
          </div>

          <div className="space-y-4">
            {subjectScores.map((item) => (
              <div key={item.subject} className="space-y-2">
                <div className="flex items-center justify-between text-base font-black text-foreground">
                  <span>{item.subject}</span>
                  <span>{item.value}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${item.value}%` }} />
                </div>
                <div className="text-xs text-muted-foreground">{item.delta}</div>
              </div>
            ))}
          </div>

          <Button variant="outline" className="mt-6 w-full rounded-xl border-border/60 bg-background/30 font-semibold text-foreground">View Detailed Breakdown</Button>
        </div>
      </div>

      <div className="mt-8 rounded-[1.8rem] border border-border/60 bg-card/60 p-5">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tight text-foreground">Recent Assessments</h2>
          <Button variant="ghost" className="text-sm font-semibold text-primary">Download all reports</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            { title: "Algebra Diagnostic", status: "Strong", score: "91%", tag: "Mastered" },
            { title: "Reading Comprehension", status: "Improving", score: "83%", tag: "Needs practice" },
            { title: "Physics Quiz", status: "Steady", score: "79%", tag: "Watch carefully" },
          ].map((item) => (
            <div key={item.title} className="rounded-[1.4rem] border border-border/60 bg-background/40 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary">{item.status}</span>
                <span className="text-xs font-bold text-muted-foreground">{item.tag}</span>
              </div>
              <div className="text-xl font-black text-foreground">{item.title}</div>
              <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                <span>Score</span>
                <span className="text-xl font-black text-foreground">{item.score}</span>
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm font-medium text-emerald-400"><CheckCircle2 className="h-4 w-4" /> Completed successfully</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

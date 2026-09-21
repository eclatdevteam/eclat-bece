import { useState } from "react";
import { HelpCircle, BookOpen, FileText, Mail, Phone, MessageSquare, Loader2, ChevronRight, Search, ShieldCheck, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export default function ParentResourcesPage() {
  const { user } = useAuth();
  const [supportMessage, setSupportMessage] = useState("");
  const [sendingSupport, setSendingSupport] = useState(false);

  const handleSendSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;
    if (!user) {
      toast.error("You must be logged in to send a support request.");
      return;
    }
    setSendingSupport(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-support-email", {
        body: {
          user_id: user.id,
          message: supportMessage.trim(),
        },
      });

      if (error) throw error;

      toast.success("Support request sent! We will contact you via email shortly.");
      setSupportMessage("");
    } catch (error: any) {
      console.error("Error sending support email:", error);
      toast.error(error.message || "Failed to send support request. Please try again.");
    } finally {
      setSendingSupport(false);
    }
  };

  const guideCards = [
    { icon: BookOpen, title: "Standard Exams", subtitle: "Common Entrance & BECE Guide", description: "Scoring rubrics, reliable practice resources, and revision timelines for all core subjects." },
    { icon: FileText, title: "Family Accounts", subtitle: "Managing children & codes", description: "Generate or update a child account, link a student profile, and monitor activity quickly." },
    { icon: ShieldCheck, title: "Targeted Mastery", subtitle: "Parent tasks & custom quizzes", description: "Create custom tasks and focus on weak areas with guided, targeted practice drill sets." },
    { icon: HelpCircle, title: "Invoicing & Cards", subtitle: "Billing & family subscriptions", description: "Manage multiple children, update billing info, and download invoices with confidence." },
  ];

  return (
    <div className="w-full px-3 pb-20 pt-6 md:px-6">
      <div className="rounded-[2rem] border border-border/60 bg-card/60 p-6 shadow-[0_12px_30px_rgba(4,12,20,0.12)] md:p-8">
        <div className="parent-section-chip mb-4">Academic Service</div>
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground md:text-5xl">Help & Support Hub</h1>
            <p className="mt-2 text-base text-muted-foreground">Find structured curriculum breakdowns, step-by-step parent guides, or connect directly with an Éclat education specialist.</p>
          </div>
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search topics, Common Entrance FAQ, BECE syllabus, or billing..." className="parent-search h-12 bg-background/40 pr-4" />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
          <span className="rounded-full border border-border/60 bg-background/30 px-2.5 py-1">Trending:</span>
          <span className="rounded-full border border-border/60 bg-background/30 px-2.5 py-1">Parent Guidance</span>
          <span className="rounded-full border border-border/60 bg-background/30 px-2.5 py-1">Link Child</span>
          <span className="rounded-full border border-border/60 bg-background/30 px-2.5 py-1">Common Entrance</span>
          <span className="rounded-full border border-border/60 bg-background/30 px-2.5 py-1">Billing</span>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tight text-foreground">Curated Knowledge Categories</h2>
            <span className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">48 comprehensive guides</span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {guideCards.map(({ icon: Icon, title, subtitle, description }, index) => (
              <Card key={title} className="parent-panel rounded-[1.5rem] border border-border/60 bg-card/60 p-4">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-border/60 bg-background/40 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">{subtitle}</div>
                <h3 className="text-xl font-black text-foreground">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
                <div className="mt-4 flex items-center justify-between text-xs font-bold uppercase tracking-[0.18em] text-primary">
                  <span>{index === 0 ? '14 parent articles' : index === 1 ? '9 tutorials' : index === 2 ? '15 walkthroughs' : '10 articles'}</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Card>
            ))}
          </div>

          <div className="rounded-[1.8rem] border border-border/60 bg-card/60 p-4 md:p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-2xl font-black text-foreground">Frequently Asked Inquiries</h3>
              <Button variant="ghost" className="text-xs font-black uppercase tracking-[0.18em] text-primary">Expand all</Button>
            </div>

            <Accordion type="single" collapsible className="w-full space-y-3">
              {[
                "How do I link my child’s school account to my parent portal?",
                "Can I assign specific topics that my child is struggling with?",
                "How are the national leaderboard and percentile ranks calculated?",
                "What should I do if my child misses an assignment deadline?",
                "How does Éclat ensure questions align with the Nigerian curriculum?",
              ].map((item, idx) => (
                <AccordionItem key={item} value={`item-${idx + 1}`} className="rounded-2xl border border-border/60 bg-background/40 px-4">
                  <AccordionTrigger className="py-4 text-left text-base font-bold text-foreground hover:no-underline">{item}</AccordionTrigger>
                  <AccordionContent className="pb-4 text-sm leading-6 text-muted-foreground">
                    Each parent dashboard includes a unique connection code and a secure link flow that allows your child to connect to your portal without needing to re-enter details. Assignment tracking, quiz statuses, and report visibility then sync automatically.
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>

        <div className="space-y-5">
          <Card className="parent-panel rounded-[1.75rem] border border-border/60 bg-card/60 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">Direct Assistance</div>
                <h3 className="mt-2 text-2xl font-black text-foreground">Contact Support Desk</h3>
              </div>
              <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-400">Advisors online</div>
            </div>

            <div className="mt-5 rounded-2xl border border-border/60 bg-background/40 p-4">
              <div className="mb-2 text-lg font-black text-foreground">Chat with Academic Advisor</div>
              <p className="text-sm leading-6 text-muted-foreground">Need personalised help interpreting one of your child&apos;s scores and performance trends? Speak with a dedicated advisor today.</p>
              <Button className="mt-4 w-full rounded-xl bg-primary text-primary-foreground">Start Instant Live Chat</Button>
            </div>

            <div className="mt-4 space-y-3">
              {[
                { title: "WhatsApp Parent", value: "+234 904-218-...", action: "Message" },
                { title: "1-on-1 Academic Audit", value: "Schedule a consultation", action: "Schedule" },
                { title: "Submit Support Ticket", value: "Open or track requests", action: "Open" },
              ].map((item) => (
                <div key={item.title} className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/40 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Phone className="h-4 w-4" /></div>
                    <div>
                      <div className="text-sm font-black text-foreground">{item.title}</div>
                      <div className="text-xs text-muted-foreground">{item.value}</div>
                    </div>
                  </div>
                  <Button variant="ghost" className="text-xs font-black uppercase tracking-[0.18em] text-primary">{item.action}</Button>
                </div>
              ))}
            </div>
          </Card>

          <Card className="parent-panel rounded-[1.75rem] border border-border/60 bg-card/60 p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-foreground">Send a message</h3>
              <div className="rounded-full border border-border/60 bg-background/40 px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Email us</div>
            </div>
            <form onSubmit={handleSendSupport} className="mt-4 space-y-4">
              <Textarea value={supportMessage} onChange={(e) => setSupportMessage(e.target.value)} placeholder="Describe your issue or question..." className="min-h-[110px] rounded-2xl border-border/60 bg-background/40" />
              <Button type="submit" disabled={sendingSupport || !supportMessage.trim()} className="w-full rounded-xl bg-primary text-primary-foreground">
                {sendingSupport ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : 'Send Message'}
              </Button>
            </form>
            <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> support@eclatapp.xyz</span>
              <span className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> +2348130202112</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

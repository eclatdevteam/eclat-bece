import { useState, useMemo } from "react";
import { 
  HelpCircle, 
  BookOpen, 
  FileText, 
  Mail, 
  Phone, 
  MessageSquare, 
  Loader2, 
  ChevronRight, 
  Search, 
  ShieldCheck, 
  ArrowRight,
  ExternalLink,
  X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const FAQ_ITEMS = [
  {
    question: "How do I link my child’s school account to my parent portal?",
    answer: "Go to 'My Children' and click 'Add Child'. Select the 'Link Existing' tab and enter your child's student unique ID (e.g. STU-12345) or username. Once submitted, your child will receive an instant link notification in their student dashboard to confirm connection.",
    category: "Link Child"
  },
  {
    question: "Can I assign specific topics that my child is struggling with?",
    answer: "Yes! Navigate to Assignments Manager or click 'Assign Task' on any child overview card. You can select the curriculum subject, pick specific weak topics (e.g. Fractions, Cell Biology), choose question volume, and set a custom time limit.",
    category: "Parent Guidance"
  },
  {
    question: "How are the national leaderboard and percentile ranks calculated?",
    answer: "The national ranking algorithm evaluates quiz accuracy, difficulty tier, speed, and continuous daily streaks. Students who practice daily and master higher difficulty questions rank higher on the national BECE / Common Entrance leaderboard.",
    category: "Common Entrance"
  },
  {
    question: "What should I do if my child misses an assignment deadline or falls behind?",
    answer: "You can click 'Remind Child' directly from the Assignments Manager page. This triggers an urgent in-app notification to your child's dashboard encouraging them to complete the task before the weekend.",
    category: "Parent Guidance"
  },
  {
    question: "How does Éclat ensure questions align with the Nigerian curriculum?",
    answer: "All questions in our question bank are designed and vetted by seasoned Nigerian junior secondary and primary education examiners in strict compliance with the NERDC, WAEC BECE, and National Common Entrance syllabus.",
    category: "BECE Syllabus"
  },
  {
    question: "How do subscriptions work for families with multiple children?",
    answer: "Each child can have an individual Standard or Premium tier subscription. You can manage or upgrade each child independently from the Subscriptions & Billing tab with zero hidden fees.",
    category: "Billing"
  }
];

export default function ParentResourcesPage() {
  const { user } = useAuth();
  const [supportMessage, setSupportMessage] = useState("");
  const [sendingSupport, setSendingSupport] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [accordionValues, setAccordionValues] = useState<string[]>([]);

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

  const handleOpenWhatsApp = () => {
    window.open("https://wa.me/2348130202112?text=Hello%20%C3%89clat%20Support%2C%20I%20am%20a%20parent%20and%20need%20assistance%20with%20my%20parent%20portal.", "_blank");
  };

  const guideCards = [
    { 
      icon: BookOpen, 
      title: "Standard Exams", 
      subtitle: "Common Entrance & BECE Guide", 
      description: "Scoring rubrics, reliable practice resources, and revision timelines for all core subjects.",
      actionQuery: "Common Entrance"
    },
    { 
      icon: FileText, 
      title: "Family Accounts", 
      subtitle: "Managing children & codes", 
      description: "Generate or update a child account, link a student profile, and monitor activity quickly.",
      actionQuery: "Link Child"
    },
    { 
      icon: ShieldCheck, 
      title: "Targeted Mastery", 
      subtitle: "Parent tasks & custom quizzes", 
      description: "Create custom tasks and focus on weak areas with guided, targeted practice drill sets.",
      actionQuery: "Parent Guidance"
    },
    { 
      icon: HelpCircle, 
      title: "Invoicing & Cards", 
      subtitle: "Billing & family subscriptions", 
      description: "Manage multiple children, update billing info, and download invoices with confidence.",
      actionQuery: "Billing"
    },
  ];

  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return FAQ_ITEMS;
    const q = searchQuery.toLowerCase();
    return FAQ_ITEMS.filter((item) => 
      item.question.toLowerCase().includes(q) || 
      item.answer.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const allFaqKeys = useMemo(() => filteredFaqs.map((_, idx) => `item-${idx + 1}`), [filteredFaqs]);
  const isAllExpanded = allFaqKeys.length > 0 && accordionValues.length === allFaqKeys.length;

  const toggleExpandAll = () => {
    if (isAllExpanded) {
      setAccordionValues([]);
    } else {
      setAccordionValues(allFaqKeys);
    }
  };

  return (
    <div className="w-full px-3 pb-20 pt-6 md:px-6">
      {/* Top Banner */}
      <div className="rounded-[2rem] border border-border/60 bg-card/60 p-6 shadow-[0_12px_30px_rgba(4,12,20,0.12)] md:p-8">
        <div className="parent-section-chip mb-4">Academic Service</div>
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground md:text-5xl">Help & Support Hub</h1>
            <p className="mt-2 text-base text-muted-foreground">Find structured curriculum breakdowns, step-by-step parent guides, or connect directly with an Éclat education specialist.</p>
          </div>
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search topics, Common Entrance FAQ, BECE syllabus, or billing..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="parent-search h-12 bg-background/40 pl-11 pr-10" 
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
          <span className="rounded-full border border-border/60 bg-background/30 px-2.5 py-1">Trending:</span>
          {["Parent Guidance", "Link Child", "Common Entrance", "Billing"].map((tag) => (
            <button
              key={tag}
              onClick={() => setSearchQuery(tag)}
              className={`rounded-full border px-2.5 py-1 transition-all ${searchQuery === tag ? 'border-primary bg-primary text-primary-foreground' : 'border-border/60 bg-background/30 hover:border-primary/50'}`}
            >
              {tag}
            </button>
          ))}
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="text-xs text-primary underline ml-2 font-bold normal-case"
            >
              Clear filter
            </button>
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tight text-foreground">Curated Knowledge Categories</h2>
            <span className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">Quick Knowledge Guides</span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {guideCards.map(({ icon: Icon, title, subtitle, description, actionQuery }) => (
              <Card 
                key={title} 
                onClick={() => setSearchQuery(actionQuery)}
                className="parent-panel rounded-[1.5rem] border border-border/60 bg-card/60 p-5 cursor-pointer transition-all hover:border-primary/50 group"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-border/60 bg-background/40 text-primary group-hover:scale-110 transition-transform">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">{subtitle}</div>
                <h3 className="text-xl font-black text-foreground group-hover:text-primary transition-colors">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
                <div className="mt-4 flex items-center justify-between text-xs font-bold uppercase tracking-[0.18em] text-primary">
                  <span>View FAQs</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            ))}
          </div>

          <div className="rounded-[1.8rem] border border-border/60 bg-card/60 p-5 md:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-2xl font-black text-foreground">Frequently Asked Inquiries</h3>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground">{filteredFaqs.length} answers</span>
                {filteredFaqs.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleExpandAll}
                    className="h-7 px-2.5 text-xs font-bold text-primary hover:text-primary/80 hover:bg-primary/10 rounded-lg"
                  >
                    {isAllExpanded ? "Collapse all" : "Expand all"}
                  </Button>
                )}
              </div>
            </div>

            {filteredFaqs.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No matching inquiries found for &quot;{searchQuery}&quot;. Try a different search term or send us a message below.
              </div>
            ) : (
              <Accordion 
                type="multiple" 
                value={accordionValues} 
                onValueChange={setAccordionValues} 
                className="w-full space-y-3"
              >
                {filteredFaqs.map((item, idx) => (
                  <AccordionItem key={item.question} value={`item-${idx + 1}`} className="rounded-2xl border border-border/60 bg-background/40 px-4">
                    <AccordionTrigger className="py-4 text-left text-base font-bold text-foreground hover:no-underline">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 text-sm leading-6 text-muted-foreground">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </div>

        {/* Right Column: Direct Support Desk */}
        <div className="space-y-5">
          <Card className="parent-panel rounded-[1.75rem] border border-border/60 bg-card/60 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">Direct Assistance</div>
                <h3 className="mt-2 text-2xl font-black text-foreground">Contact Support Desk</h3>
              </div>
              <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-400">Advisors online</div>
            </div>

            <div className="mt-5 rounded-2xl border border-border/60 bg-background/40 p-4">
              <div className="mb-2 text-lg font-black text-foreground">WhatsApp Parent Desk</div>
              <p className="text-sm leading-6 text-muted-foreground">Need quick help interpreting one of your child&apos;s scores or technical assistance? Speak directly with our support team on WhatsApp.</p>
              <Button 
                onClick={handleOpenWhatsApp} 
                className="mt-4 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm"
              >
                <Phone className="mr-2 h-4 w-4" />
                Message on WhatsApp
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/40 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-black text-foreground">Email Support</div>
                    <div className="text-xs text-muted-foreground">support@eclatapp.xyz</div>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    const el = document.getElementById("support-message-form");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }} 
                  className="text-xs font-black uppercase tracking-[0.18em] text-primary"
                >
                  Write
                </Button>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/40 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-black text-foreground">Direct Telephone</div>
                    <div className="text-xs text-muted-foreground">+234 813 020 2112</div>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  onClick={() => window.open("tel:+2348130202112")} 
                  className="text-xs font-black uppercase tracking-[0.18em] text-primary"
                >
                  Call
                </Button>
              </div>
            </div>
          </Card>

          <Card id="support-message-form" className="parent-panel rounded-[1.75rem] border border-border/60 bg-card/60 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-foreground">Send a Message</h3>
              <div className="rounded-full border border-border/60 bg-background/40 px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Priority Ticket</div>
            </div>
            <form onSubmit={handleSendSupport} className="mt-4 space-y-4">
              <Textarea 
                value={supportMessage} 
                onChange={(e) => setSupportMessage(e.target.value)} 
                placeholder="Describe your issue or question regarding your child's learning or account..." 
                className="min-h-[110px] rounded-2xl border-border/60 bg-background/40 text-sm" 
              />
              <Button type="submit" disabled={sendingSupport || !supportMessage.trim()} className="w-full rounded-xl bg-primary text-primary-foreground font-black text-sm h-11">
                {sendingSupport ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending Message...</> : 'Submit Support Message'}
              </Button>
            </form>
            <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> support@eclatapp.xyz</span>
              <span className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> +234 813 020 2112</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

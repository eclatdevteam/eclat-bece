import { Navigation } from "@/components/Navigation";
import { Pricing } from "@/components/Pricing";
import { Footer } from "@/components/Footer";
import { usePublicAuthAction } from "@/hooks/usePublicAuthAction";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, HelpCircle, Sparkles, Building } from "lucide-react";

export default function PricingPage() {
  const { handleLoginClick, handleGetStartedClick } = usePublicAuthAction();

  const faqs = [
    {
      q: "Can I try Éclat before paying?",
      a: "Yes! Every new account includes a free full practice quiz and access to national leaderboard previews without requiring payment details.",
    },
    {
      q: "How do monthly cash competitions work?",
      a: "Active monthly and annual subscribers compete on the nationwide leaderboard. Top-ranking students at the end of each calendar month receive verified cash awards and certificates.",
    },
    {
      q: "Can schools purchase bulk licenses for their students?",
      a: "Absolutely! Schools can register an administrative account to manage multiple cohorts (Primary 6 & JSS 3), assign custom practice tests, and access institutional volume pricing.",
    },
    {
      q: "Can parents manage multiple children on one account?",
      a: "Yes, parents can link multiple children to their parent portal, monitor each child's diagnostic analytics independently, and assign personalized practice quizzes.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation onLoginClick={handleLoginClick} onGetStartedClick={handleGetStartedClick} />
      
      {/* Page Header */}
      <section className="pt-16 pb-8 px-4 sm:px-6 lg:px-8 text-center bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="container mx-auto max-w-3xl animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/15 border border-accent/30 text-accent-foreground text-sm font-semibold mb-4">
            <Sparkles className="h-4 w-4 text-primary" />
            Simple & Transparent Plans
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-4">
            Invest in Academic Excellence
          </h1>
          <p className="text-lg text-muted-foreground">
            Affordable subscriptions designed for Nigerian students, parents, and schools.
          </p>
        </div>
      </section>

      {/* Main Pricing Cards */}
      <Pricing onGetStartedClick={handleGetStartedClick} />

      {/* School Enterprise Banner */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-5xl">
          <Card className="border-2 border-primary/40 bg-gradient-to-r from-primary/10 via-background to-accent/10 shadow-lg">
            <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 shadow-md">
                  <Building className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-1">Looking for a School Plan?</h3>
                  <p className="text-muted-foreground text-sm max-w-xl">
                    Get custom cohort management, automated class homework assignments, CSV grade book exports, and discounted institutional licensing.
                  </p>
                </div>
              </div>
              <Button size="lg" variant="hero" onClick={handleGetStartedClick} className="font-bold text-base px-8 h-12 flex-shrink-0 bg-gradient-to-r from-primary to-accent">
                Register Your School
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/20 border-t border-border/20">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 text-primary font-semibold text-sm mb-2">
              <HelpCircle className="h-4 w-4" /> Got Questions?
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Frequently Asked Questions</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {faqs.map((faq, i) => (
              <Card key={i} className="border border-border/70 bg-card">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-foreground">{faq.q}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

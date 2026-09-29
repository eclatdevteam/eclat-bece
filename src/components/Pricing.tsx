import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PricingProps {
  onGetStartedClick: () => void;
}

export const Pricing = ({ onGetStartedClick }: PricingProps) => {
  const plans = [
    {
      name: "Free Trial",
      price: "Free",
      period: "starter quiz",
      description: "Perfect for testing the waters and exploring the test environment.",
      features: [
        "One full CBT practice exam session",
        "Instant score & basic performance review",
        "Read-only national leaderboard access",
        "Mobile and desktop responsive access",
      ],
      cta: "Try Free",
      popular: false,
    },
    {
      name: "Monthly Plan",
      price: "₦1,500",
      period: "/month",
      description: "Ideal for month-by-month focused revision leading up to mocks.",
      features: [
        "Unlimited BECE & Common Entrance practice",
        "Live 1v1 Battle Duels with classmates",
        "Compete for ₦50,000 monthly scholarships",
        "Topic-by-topic analytics & weakness telemetry",
        "Parent custom practice builder access",
      ],
      cta: "Get Started",
      popular: false,
    },
    {
      name: "Annual Scholar",
      price: "₦15,000",
      period: "/year",
      description: "Comprehensive year-round coverage. Save ₦6,000 compared to monthly.",
      features: [
        "Everything included in the Monthly Plan",
        "Substantial 33% annual discount",
        "Eligibility for ₦1,500,000 annual grand prize",
        "Priority customer & tutor technical support",
        "Curriculum prediction mock test archives",
      ],
      cta: "Claim Best Value",
      popular: true,
    },
  ];

  return (
    <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-[#080f22] border-b border-slate-200 dark:border-[#202b43] relative overflow-hidden transition-colors duration-200">
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#3bc2f3]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-50 dark:bg-[#0c2438] border border-cyan-200 dark:border-[#2d4b68] text-cyan-800 dark:text-[#58c4e8] text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
            <Sparkles size={14} className="text-amber-500" />
            <span>Accessible Academic Excellence</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Choose the subscription that matches your child's goals. Instant activation, cancel anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 items-stretch gap-6 lg:gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative flex flex-col justify-between rounded-2xl p-7 sm:p-8 transition-all duration-300 ${plan.popular
                  ? "bg-cyan-50/20 dark:bg-[#0e1c33] border-2 border-[#3bc2f3] shadow-xl dark:shadow-2xl shadow-cyan-950/40 lg:-translate-y-2"
                  : "bg-white dark:bg-[#0c1628] border border-slate-200 dark:border-[#233148] hover:border-[#3bc2f3]/50 shadow-md dark:shadow-xl"
                }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#3bc2f3] text-slate-950 text-xs font-black uppercase tracking-wider rounded-full shadow-lg shadow-cyan-500/30">
                  Most Popular
                </div>
              )}

              <div>
                {/* Header */}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{plan.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 min-h-[32px]">{plan.description}</p>
                </div>

                {/* Price Display */}
                <div className="mb-6 pb-6 border-b border-slate-200 dark:border-[#202b43]">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">{plan.price}</span>
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{plan.period}</span>
                  </div>
                </div>

                {/* Features List */}
                <ul className="space-y-3.5 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-200">
                      <div className="mt-0.5 rounded-full p-0.5 bg-cyan-50 dark:bg-[#0c2438] text-[#0c9dcc] dark:text-[#3bc2f3] shrink-0 border border-cyan-200 dark:border-[#2d4b68]">
                        <Check size={14} />
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action CTA */}
              <Button
                size="lg"
                onClick={onGetStartedClick}
                className={`w-full h-12 rounded-xl text-sm font-extrabold transition-all duration-200 ${plan.popular
                    ? "bg-[#3bc2f3] text-slate-950 hover:bg-[#32ade0] shadow-lg shadow-cyan-500/25 hover:scale-[1.02]"
                    : "bg-slate-100 dark:bg-[#080f22] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#233148] hover:bg-slate-200 dark:hover:bg-[#15273f] hover:border-[#3bc2f3] hover:text-slate-950 dark:hover:text-white"
                  }`}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

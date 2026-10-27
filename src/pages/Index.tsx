import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { About } from "@/components/About";
import { LeaderboardSection } from "@/components/LeaderboardSection";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { CtaBanner } from "@/components/CtaBanner";
import { Footer } from "@/components/Footer";
import { usePublicAuthAction } from "@/hooks/usePublicAuthAction";

const Index = () => {
  const { handleLoginClick, handleGetStartedClick } = usePublicAuthAction();

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#060e20] text-slate-900 dark:text-slate-100 selection:bg-cyan-500 selection:text-slate-950 font-sans transition-colors duration-200">
      <Navigation onLoginClick={handleLoginClick} onGetStartedClick={handleGetStartedClick} />
      <main>
        <Hero onGetStartedClick={handleGetStartedClick} />
        <Features />
        <About />
        <LeaderboardSection onJoinArenaClick={handleGetStartedClick} />
        <TestimonialsSection />
        <CtaBanner onGetStartedClick={handleGetStartedClick} />
      </main>
      <Footer />
    </div>
  );
};

export default Index;

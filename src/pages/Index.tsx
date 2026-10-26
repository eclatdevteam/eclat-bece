import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { About } from "@/components/About";
import { Footer } from "@/components/Footer";
import { usePublicAuthAction } from "@/hooks/usePublicAuthAction";
import heroStudyBg from "@/assets/hero-study.jpg";

const Index = () => {
  const { handleLoginClick, handleGetStartedClick } = usePublicAuthAction();

  return (
    <div className="min-h-screen bg-white dark:bg-[#080f22] text-slate-900 dark:text-slate-100 selection:bg-[#3bc2f3] selection:text-slate-950 font-sans transition-colors duration-200">
      <Navigation onLoginClick={handleLoginClick} onGetStartedClick={handleGetStartedClick} />
      <Hero onGetStartedClick={handleGetStartedClick} />
      <Features />
      <About />
      <Footer />
    </div>
  );
};

export default Index;

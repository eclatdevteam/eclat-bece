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
    <div className="min-h-screen text-slate-900 dark:text-slate-100 selection:bg-[#3bc2f3] selection:text-slate-950 font-sans transition-colors duration-200 relative">
      {/* Fixed full-screen background image */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <img
          src={heroStudyBg}
          alt="Students studying together"
          className="w-full h-full object-cover object-center brightness-[1.02] contrast-[1.05] saturate-[1.08]"
        />
        {/* Crisp overlay wash: vibrant image visibility in light mode without milky wash-out, elegant deep backdrop in dark mode */}
        <div className="absolute inset-0 bg-white/25 dark:bg-[#080f22]/85 transition-colors duration-200" />
      </div>

      {/* Page content */}
      <div className="relative z-10">
        <Navigation onLoginClick={handleLoginClick} onGetStartedClick={handleGetStartedClick} />
        <Hero onGetStartedClick={handleGetStartedClick} />
        <Features />
        <About />
        <Footer />
      </div>
    </div>
  );
};

export default Index;

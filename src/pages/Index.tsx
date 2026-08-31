import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { About } from "@/components/About";
import { Pricing } from "@/components/Pricing";
import { Footer } from "@/components/Footer";
import { usePublicAuthAction } from "@/hooks/usePublicAuthAction";

const Index = () => {
  const { handleLoginClick, handleGetStartedClick } = usePublicAuthAction();

  return (
    <div className="min-h-screen bg-background">
      <Navigation onLoginClick={handleLoginClick} onGetStartedClick={handleGetStartedClick} />
      <Hero onGetStartedClick={handleGetStartedClick} />
      <Features />
      <About />
      <Pricing onGetStartedClick={handleGetStartedClick} />
      <Footer />
    </div>
  );
};

export default Index;

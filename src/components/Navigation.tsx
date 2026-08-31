import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import logo from "@/assets/logo.png";
import logoLight from "@/assets/logo-light.png";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "next-themes";

interface NavigationProps {
  onLoginClick: () => void;
  onGetStartedClick: () => void;
}

export const Navigation = ({ onLoginClick, onGetStartedClick }: NavigationProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();

  const handleNavClick = (path: string, sectionId: string) => {
    setMobileMenuOpen(false);
    if (location.pathname === "/") {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }
    navigate(path);
  };

  return (
    <nav className="relative z-50 bg-background border-b border-border/30 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:bg-[rgb(1,28,58)] dark:border-white/10 dark:shadow-[0_8px_32px_rgba(0,0,0,0.18)]">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="flex items-center justify-between gap-6 h-14 sm:h-16 md:h-20">
          {/* Logo */}
          <div 
            className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:scale-105 transition-all duration-300 hover:drop-shadow-2xl" 
            onClick={() => {
              navigate("/");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <img src={theme === 'dark' ? logoLight : logo} alt="Éclat Logo" className="h-8 sm:h-10 md:h-12 w-auto filter drop-shadow-lg" />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex flex-1 items-center justify-center gap-6 xl:gap-8">
            <button
              onClick={() => handleNavClick("/about", "about")}
              className="relative text-[#40D3F2] hover:text-[#40D3F2] transition-all duration-300 font-bold text-sm xl:text-base tracking-tight hover:scale-110 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-gradient-to-r after:from-primary after:to-accent after:transition-all after:duration-300 hover:after:w-full pb-1"
            >
              About
            </button>
            <button
              onClick={() => handleNavClick("/features", "features")}
              className="relative text-[#40D3F2] hover:text-[#40D3F2] transition-all duration-300 font-bold text-sm xl:text-base tracking-tight hover:scale-110 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-gradient-to-r after:from-primary after:to-accent after:transition-all after:duration-300 hover:after:w-full pb-1"
            >
              Features
            </button>
            <button
              onClick={() => handleNavClick("/pricing", "pricing")}
              className="relative text-[#40D3F2] hover:text-[#40D3F2] transition-all duration-300 font-bold text-sm xl:text-base tracking-tight hover:scale-110 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-gradient-to-r after:from-primary after:to-accent after:transition-all after:duration-300 hover:after:w-full pb-1"
            >
              Pricing
            </button>
            <button
              onClick={() => handleNavClick("/leaderboard", "leaderboard")}
              className="relative text-[#40D3F2] hover:text-[#40D3F2] transition-all duration-300 font-bold text-sm xl:text-base tracking-tight hover:scale-110 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-gradient-to-r after:from-primary after:to-accent after:transition-all after:duration-300 hover:after:w-full pb-1"
            >
              Leaderboard
            </button>
          </div>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center justify-center gap-3 xl:gap-3">
            <ThemeToggle />
            <Button 
              variant="outline" 
              onClick={onLoginClick} 
              className="font-bold text-sm xl:text-base px-4 xl:px-6 h-9 xl:h-10 border-2 hover:border-primary hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              Login
            </Button>
            <Button 
              variant="hero" 
              onClick={onGetStartedClick} 
              className="font-bold text-sm xl:text-base px-4 xl:px-6 h-9 xl:h-10 shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)] transition-all duration-300 hover:scale-105 bg-gradient-to-r from-primary to-accent"
            >
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-1.5 sm:p-2 text-foreground hover:text-primary transition-colors rounded-lg hover:bg-accent/50"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={22} className="sm:w-6 sm:h-6" /> : <Menu size={22} className="sm:w-6 sm:h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 sm:py-6 space-y-1 sm:space-y-2 border-t border-border/50 animate-fade-in bg-background">
            <button
              onClick={() => handleNavClick("/about", "about")}
              className="block w-full text-left px-4 sm:px-5 py-3 sm:py-3.5 text-[#40D3F2] hover:text-[#40D3F2] hover:bg-accent/50 rounded-lg transition-all duration-200 font-semibold text-sm sm:text-[15px]"
            >
              About
            </button>
            <button
              onClick={() => handleNavClick("/features", "features")}
              className="block w-full text-left px-4 sm:px-5 py-3 sm:py-3.5 text-[#40D3F2] hover:text-[#40D3F2] hover:bg-accent/50 rounded-lg transition-all duration-200 font-semibold text-sm sm:text-[15px]"
            >
              Features
            </button>
            <button
              onClick={() => handleNavClick("/pricing", "pricing")}
              className="block w-full text-left px-4 sm:px-5 py-3 sm:py-3.5 text-[#40D3F2] hover:text-[#40D3F2] hover:bg-accent/50 rounded-lg transition-all duration-200 font-semibold text-sm sm:text-[15px]"
            >
              Pricing
            </button>
            <button
              onClick={() => handleNavClick("/leaderboard", "leaderboard")}
              className="block w-full text-left px-4 sm:px-5 py-3 sm:py-3.5 text-[#40D3F2] hover:text-[#40D3F2] hover:bg-accent/50 rounded-lg transition-all duration-200 font-semibold text-sm sm:text-[15px]"
            >
              Leaderboard
            </button>
            
            {/* Mobile CTA Buttons */}
            <div className="pt-4 space-y-2 px-4 sm:px-5">
              <Button 
                variant="outline" 
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLoginClick();
                }} 
                className="w-full font-bold text-sm h-10 border-2"
              >
                Login
              </Button>
              <Button 
                variant="hero" 
                onClick={() => {
                  setMobileMenuOpen(false);
                  onGetStartedClick();
                }} 
                className="w-full font-bold text-sm h-10 bg-gradient-to-r from-primary to-accent"
              >
                Get Started
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

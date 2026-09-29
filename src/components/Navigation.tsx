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
    <nav className="sticky top-0 z-50 bg-[#071023]/95 backdrop-blur-md border-b border-[#202b43] text-slate-100 shadow-xl shadow-black/20">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="flex items-center justify-between gap-6 h-16 md:h-20">
          {/* Logo */}
          <div
            className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:scale-105 transition-all duration-300 hover:drop-shadow-2xl"
            onClick={() => {
              navigate("/");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <img src={logoLight || logo} alt="Éclat Logo" className="h-8 sm:h-10 md:h-11 w-auto filter drop-shadow-lg" />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex flex-1 items-center justify-center gap-6 xl:gap-8">
            <button
              onClick={() => handleNavClick("/about", "about")}
              className="text-slate-300 hover:text-[#3bc2f3] transition-all duration-200 font-semibold text-sm xl:text-base tracking-tight hover:scale-105"
            >
              About Us
            </button>
            <button
              onClick={() => handleNavClick("/features", "features")}
              className="text-slate-300 hover:text-[#3bc2f3] transition-all duration-200 font-semibold text-sm xl:text-base tracking-tight hover:scale-105"
            >
              Features
            </button>
            <button
              onClick={() => handleNavClick("/pricing", "pricing")}
              className="text-slate-300 hover:text-[#3bc2f3] transition-all duration-200 font-semibold text-sm xl:text-base tracking-tight hover:scale-105"
            >
              Pricing
            </button>
            <button
              onClick={() => handleNavClick("/leaderboard", "leaderboard")}
              className="text-slate-300 hover:text-[#3bc2f3] transition-all duration-200 font-semibold text-sm xl:text-base tracking-tight hover:scale-105"
            >
              Leaderboard
            </button>
          </div>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center justify-center gap-3">
            <ThemeToggle className="text-slate-200 hover:text-white hover:bg-[#15273f]" />
            <Button
              variant="outline"
              onClick={onLoginClick}
              className="font-bold text-sm px-5 h-10 rounded-xl border border-[#233148] bg-[#0c1628] text-slate-200 hover:bg-[#15273f] hover:border-[#3bc2f3] hover:text-white transition-all hover:scale-105"
            >
              Login
            </Button>
            <Button
              onClick={onGetStartedClick}
              className="font-bold text-sm px-6 h-10 rounded-xl bg-[#3bc2f3] text-slate-950 hover:bg-[#32ade0] shadow-lg shadow-cyan-500/20 transition-all hover:scale-105"
            >
              Get Started
            </Button>
          </div>

          {/* Mobile Menu & Theme Button */}
          <div className="lg:hidden flex items-center gap-1.5">
            <ThemeToggle className="text-slate-200 hover:text-white hover:bg-[#15273f]" />
            <button
              className="p-2 text-slate-200 hover:text-[#3bc2f3] transition-colors rounded-xl hover:bg-[#15273f]"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-5 space-y-2 border-t border-[#202b43] animate-fade-in bg-[#0c1628] rounded-b-2xl px-2">
            <button
              onClick={() => handleNavClick("/about", "about")}
              className="block w-full text-left px-4 py-3 text-slate-200 hover:text-[#3bc2f3] hover:bg-[#15273f] rounded-xl transition-all duration-200 font-semibold text-sm"
            >
              About
            </button>
            <button
              onClick={() => handleNavClick("/features", "features")}
              className="block w-full text-left px-4 py-3 text-slate-200 hover:text-[#3bc2f3] hover:bg-[#15273f] rounded-xl transition-all duration-200 font-semibold text-sm"
            >
              Features
            </button>
            <button
              onClick={() => handleNavClick("/pricing", "pricing")}
              className="block w-full text-left px-4 py-3 text-slate-200 hover:text-[#3bc2f3] hover:bg-[#15273f] rounded-xl transition-all duration-200 font-semibold text-sm"
            >
              Pricing
            </button>
            <button
              onClick={() => handleNavClick("/leaderboard", "leaderboard")}
              className="block w-full text-left px-4 py-3 text-slate-200 hover:text-[#3bc2f3] hover:bg-[#15273f] rounded-xl transition-all duration-200 font-semibold text-sm"
            >
              Leaderboard
            </button>

            {/* Mobile CTA Buttons */}
            <div className="pt-3 space-y-2 px-2">
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#080f22] border border-[#233148] text-xs font-semibold text-slate-300">
                <span>Theme</span>
                <ThemeToggle className="text-slate-200 hover:text-white" />
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLoginClick();
                }}
                className="w-full font-bold text-sm h-11 rounded-xl border border-[#233148] bg-[#080f22] text-slate-200 hover:bg-[#15273f] hover:border-[#3bc2f3] hover:text-white"
              >
                Login
              </Button>
              <Button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onGetStartedClick();
                }}
                className="w-full font-bold text-sm h-11 rounded-xl bg-[#3bc2f3] text-slate-950 hover:bg-[#32ade0] shadow-md shadow-cyan-500/20"
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

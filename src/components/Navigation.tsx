import { useState, useEffect } from "react";
import { Menu, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import logo from "@/assets/logo.png";
import logoDark from "@/assets/logo-dark.png";
import logoLight from "@/assets/logo-light.png";
import { useNavigate, useLocation } from "react-router-dom";

interface NavigationProps {
  onLoginClick: () => void;
  onGetStartedClick: () => void;
}

export const Navigation = ({ onLoginClick, onGetStartedClick }: NavigationProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState<string>("");
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { name: "About", path: "/about", sectionId: "about" },
    { name: "Features", path: "/features", sectionId: "features" },
    { name: "Leaderboard", path: "/leaderboard", sectionId: "leaderboard" },
  ];

  // Sync active link with location path on direct page loads
  useEffect(() => {
    if (location.pathname === "/about") {
      setActiveLink("about");
    } else if (location.pathname === "/features") {
      setActiveLink("features");
    } else if (location.pathname === "/leaderboard") {
      setActiveLink("leaderboard");
    } else {
      setActiveLink("");
    }
  }, [location.pathname]);

  const handleNavClick = (path: string, sectionId: string) => {
    setMobileMenuOpen(false);
    setActiveLink(sectionId);

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
    <nav className="sticky top-0 z-50 bg-white/90 dark:bg-[#060e20]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-[#1a2844] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer transition-transform hover:scale-[1.02]"
            onClick={() => {
              setActiveLink("");
              navigate("/");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            {/* Dark mode logo */}
            <img
              src={logoLight}
              alt="Éclat Logo"
              className="hidden dark:block h-8 sm:h-9 w-auto object-contain"
            />
            {/* Light mode logo */}
            <img
              src={logoDark || logo}
              alt="Éclat Logo"
              className="block dark:hidden h-8 sm:h-9 w-auto object-contain"
            />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => {
              const isActive = activeLink === item.sectionId;
              return (
                <button
                  key={item.sectionId}
                  onClick={() => handleNavClick(item.path, item.sectionId)}
                  className={`text-sm py-1 transition-all ${
                    isActive
                      ? "font-semibold text-cyan-600 dark:text-[#38bdf8] relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-cyan-500 after:rounded-full"
                      : "font-medium text-slate-600 hover:text-cyan-600 dark:text-slate-300 dark:hover:text-[#38bdf8]"
                  }`}
                >
                  {item.name}
                </button>
              );
            })}
          </div>

          {/* Desktop CTA Buttons & Theme Toggle */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white" />
            
            <button
              onClick={onLoginClick}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white border border-slate-200 dark:border-[#223555] bg-slate-50/80 dark:bg-[#0c1830] hover:bg-slate-100 dark:hover:bg-[#142444] transition-all"
            >
              <User size={15} className="text-slate-500 dark:text-slate-400" />
              <span>Login</span>
            </button>

            <button
              onClick={onGetStartedClick}
              className="inline-flex items-center justify-center px-5 py-2 rounded-full text-sm font-bold bg-[#00a8e8] hover:bg-[#0096d1] text-slate-950 shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all hover:scale-[1.02]"
            >
              Get Started
            </button>
          </div>

          {/* Mobile Actions */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle className="text-slate-600 dark:text-slate-300" />
            <button
              className="p-2 text-slate-700 dark:text-slate-200 hover:text-cyan-600 dark:hover:text-cyan-400 rounded-lg"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 px-2 space-y-2 border-t border-slate-200 dark:border-[#1a2844] bg-white/95 dark:bg-[#060e20]/95 backdrop-blur-md rounded-b-2xl animate-fade-in shadow-xl">
            {navItems.map((item) => {
              const isActive = activeLink === item.sectionId;
              return (
                <button
                  key={item.sectionId}
                  onClick={() => handleNavClick(item.path, item.sectionId)}
                  className={`block w-full text-left px-4 py-2.5 rounded-xl text-sm transition-colors ${
                    isActive
                      ? "font-semibold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10"
                      : "font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#0e1c36]"
                  }`}
                >
                  {item.name}
                </button>
              );
            })}

            <div className="pt-3 border-t border-slate-200 dark:border-[#1a2844] space-y-2">
              <Button
                variant="outline"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLoginClick();
                }}
                className="w-full rounded-full border-slate-300 dark:border-[#223555] bg-transparent text-slate-800 dark:text-slate-200 font-semibold text-sm h-10"
              >
                <User size={15} className="mr-2" />
                Login
              </Button>
              <Button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onGetStartedClick();
                }}
                className="w-full rounded-full bg-[#00a8e8] hover:bg-[#0096d1] text-slate-950 font-bold text-sm h-10 shadow-md shadow-cyan-500/20"
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

import { Mail, Phone, MapPin } from "lucide-react";
import { LinkedInIcon } from "@/components/icons/LinkedInIcon";
import { Link } from "react-router-dom";
import logoLight from "@/assets/logo-light.png";
import logoDark from "@/assets/logo-dark.png";
import logo from "@/assets/logo.png";

export const Footer = () => {
  return (
    <footer id="contact" className="bg-white dark:bg-[#050c1e] text-slate-600 dark:text-slate-400 py-10 sm:py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-200 dark:border-[#16233a] transition-colors duration-200">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-12 text-left">
          
          {/* Logo & Description */}
          <div className="md:col-span-5 space-y-4">
            <Link to="/" className="inline-block">
              <img
                src={logoLight}
                alt="Éclat Logo"
                className="hidden dark:block h-8 w-auto object-contain"
              />
              <img
                src={logoDark || logo}
                alt="Éclat Logo"
                className="block dark:hidden h-8 w-auto object-contain"
              />
            </Link>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed font-normal">
              Nigeria's premier gamified CBT prep and scholarship platform for Junior Secondary students (WAEC, NECO & BECE).
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>NATIONAL CBT NETWORK LIVE</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link to="/about" className="hover:text-cyan-600 dark:hover:text-[#38bdf8] transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link to="/features" className="hover:text-cyan-600 dark:hover:text-[#38bdf8] transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/leaderboard" className="hover:text-cyan-600 dark:hover:text-[#38bdf8] transition-colors">
                  Leaderboard
                </Link>
              </li>
              <li>
                <Link to="/parent-login" className="hover:text-cyan-600 dark:hover:text-[#38bdf8] transition-colors">
                  Parent Portal
                </Link>
              </li>
              <li>
                <Link to="/school-login" className="hover:text-cyan-600 dark:hover:text-[#38bdf8] transition-colors">
                  School Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact / Inquiries */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Support & Inquiries
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <a
                  href="mailto:hello@eclatapp.xyz"
                  className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-[#38bdf8] transition-colors"
                >
                  <Mail size={15} className="text-cyan-500 shrink-0" />
                  <span>hello@eclatapp.xyz</span>
                </a>
              </li>
              <li>
                <a
                  href="tel:+2348130202112"
                  className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-[#38bdf8] transition-colors"
                >
                  <Phone size={15} className="text-cyan-500 shrink-0" />
                  <span>+234 813 020 2112</span>
                </a>
              </li>
              <li className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <MapPin size={15} className="text-cyan-500 shrink-0" />
                <span>Lagos, Nigeria</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Links */}
        <div className="pt-8 border-t border-slate-200 dark:border-[#162338] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p>© 2026 Éclat EdTech. All rights reserved.</p>

          <div className="flex items-center gap-4">
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-cyan-500 transition-colors"
              aria-label="LinkedIn"
            >
              <LinkedInIcon size={16} />
            </a>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/privacy-policy" className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link to="/terms-of-service" className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
};

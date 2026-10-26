import { Mail, Phone, ArrowUpRight } from "lucide-react";
import { LinkedInIcon } from "@/components/icons/LinkedInIcon";
import { Link } from "react-router-dom";
import logoLight from "@/assets/logo-light.png";
import logo from "@/assets/logo.png";

export const Footer = () => {
  return (
    <footer id="contact" className="bg-[#050b18]/90 backdrop-blur-sm text-slate-400 py-16 px-4 sm:px-6 lg:px-8 border-t border-[#1d2a40]/50">
      <div className="container mx-auto max-w-6xl">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          {/* Logo & Description */}
          <div className="md:col-span-2">
            <Link to="/" className="inline-block mb-4">
              <img src={logoLight || logo} alt="Éclat Logo" className="h-9 w-auto filter drop-shadow-md" />
            </Link>
            <p className="text-slate-400 max-w-md text-sm leading-relaxed mb-6 font-normal">
              Éclat transforms junior secondary exam preparation into an engaging, gamified national competition. Master past questions, conquer weak subjects, and win academic scholarships.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#091426] border border-[#233148] text-xs font-semibold text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>National CBT Network Live</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-white mb-4">
              Navigation
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/about" className="hover:text-[#3bc2f3] transition-colors flex items-center gap-1 group">
                  <span>About Us</span>
                  <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#3bc2f3]" />
                </Link>
              </li>
              <li>
                <Link to="/features" className="hover:text-[#3bc2f3] transition-colors flex items-center gap-1 group">
                  <span>Features</span>
                  <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#3bc2f3]" />
                </Link>
              </li>
              <li>
                <Link to="/leaderboard" className="hover:text-[#3bc2f3] transition-colors flex items-center gap-1 group">
                  <span>National Standings</span>
                  <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#3bc2f3]" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-white mb-4">
              Support & Inquiries
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="mailto:hello@eclatapp.xyz"
                  className="flex items-center gap-2.5 text-slate-300 hover:text-[#3bc2f3] transition-colors"
                >
                  <Mail size={16} className="text-[#3bc2f3] shrink-0" />
                  <span>hello@eclatapp.xyz</span>
                </a>
              </li>
              <li>
                <a
                  href="tel:+2348130202112"
                  className="flex items-center gap-2.5 text-slate-300 hover:text-[#3bc2f3] transition-colors"
                >
                  <Phone size={16} className="text-[#3bc2f3] shrink-0" />
                  <span>+234 813 020 2112</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Social Links & Copyright */}
        <div className="pt-8 border-t border-[#162338] flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 Éclat EdTech. All rights reserved.</p>

          <div className="flex items-center gap-4">
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-[#3bc2f3] transition-colors p-1"
              aria-label="LinkedIn"
            >
              <LinkedInIcon size={18} />
            </a>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/privacy-policy" className="hover:text-slate-300 transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link to="/terms-of-service" className="hover:text-slate-300 transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

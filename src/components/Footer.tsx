import { Mail, Phone } from "lucide-react";
import { LinkedInIcon } from "@/components/icons/LinkedInIcon";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

export const Footer = () => {
  return (
    <footer id="contact" className="bg-foreground text-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Logo & Description */}
          <div className="md:col-span-2">
            <Link to="/">
              <img src={logo} alt="Éclat Logo" className="h-12 w-auto mb-4 brightness-0 invert" />
            </Link>
            <p className="text-background/80 max-w-md leading-relaxed">
              Éclat transforms exam preparation into an exciting competition. Join thousands of students learning smarter and winning rewards.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-background/80 hover:text-background transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/features" className="text-background/80 hover:text-background transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-background/80 hover:text-background transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/leaderboard" className="text-background/80 hover:text-background transition-colors">
                  Leaderboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-lg mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <Mail size={16} className="text-background/80" />
                <a href="mailto:hello@eclatapp.xyz" className="text-background/80 hover:text-background transition-colors">
                  hello@eclatapp.xyz
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={16} className="text-background/80" />
                <a href="tel:+2348130202112" className="text-background/80 hover:text-background transition-colors">
                  +234 813 020 2112
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Social Links & Copyright */}
        <div className="pt-8 border-t border-background/20 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-background/60 text-sm">
            © 2026 Éclat. All rights reserved.
          </p>
          
          <div className="flex items-center gap-6">
            <LinkedInIcon size={20} className="text-background/80 hover:text-background transition-colors" />
          </div>

          <div className="flex items-center gap-4 text-sm">
            <Link to="/privacy-policy" className="text-background/80 hover:text-background transition-colors">
              Privacy Policy
            </Link>
            <span className="text-background/40">•</span>
            <Link to="/terms-of-service" className="text-background/80 hover:text-background transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

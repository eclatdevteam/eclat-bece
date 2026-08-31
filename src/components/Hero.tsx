import { useNavigate } from "react-router-dom";
import { Sparkles, Trophy, ArrowRight, BookOpen, Flame, ShieldCheck, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroStudy from "@/assets/Hero.jpg";

interface HeroProps {
  onGetStartedClick: () => void;
}

export const Hero = ({ onGetStartedClick }: HeroProps) => {
  const navigate = useNavigate();

  return (
    <section id="hero" className="relative min-h-[90vh] lg:min-h-[92vh] flex items-center justify-center pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#011C3A] via-[#022852] to-[#0A3D73] text-white overflow-hidden">
      {/* Background Glows & Ambient Mesh */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-32 w-96 h-96 bg-[#40D3F2]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-[#FF9E1B]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Subtle Background Graphic Overlay */}
      <div className="absolute inset-0 z-0 opacity-15 pointer-events-none mix-blend-overlay">
        <img 
          src={heroStudy} 
          alt="Students studying" 
          className="w-full h-full object-cover object-center scale-105"
        />
      </div>

      <div className="container mx-auto relative z-10 max-w-5xl text-center">
        {/* Top Floating Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#40D3F2] text-xs sm:text-sm font-extrabold uppercase tracking-wider mb-8 shadow-lg animate-fade-in">
          <Sparkles size={15} className="text-[#FF9E1B]" />
          <span>Nigeria's Premier BECE & Common Entrance CBT Arena</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-6 animate-slide-up text-white">
          Ace Your Exams. <br className="hidden sm:inline" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#40D3F2] via-cyan-200 to-[#FF9E1B]">
            Win National Scholarships.
          </span>
        </h1>

        {/* Concise High-Impact Subtitle */}
        <p className="text-base sm:text-xl text-white/85 max-w-2xl mx-auto leading-relaxed mb-10 animate-slide-up font-normal" style={{ animationDelay: "0.1s" }}>
          Gamified CBT prep with authentic past questions, live duel challenges, and monthly cash prizes for top Nigerian scholars.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <Button
            size="lg"
            onClick={onGetStartedClick}
            className="w-full sm:w-auto h-13 px-8 text-base font-extrabold shadow-xl shadow-cyan-500/20 rounded-2xl bg-gradient-to-r from-primary to-accent hover:opacity-95 text-white gap-2 transition-all transform hover:-translate-y-0.5"
          >
            <span>Get Started Free</span>
            <ArrowRight size={18} />
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate("/leaderboard")}
            className="w-full sm:w-auto h-13 px-7 text-base font-bold rounded-2xl bg-white/10 hover:bg-white/20 text-white border-2 border-white/20 backdrop-blur-md gap-2 transition-all"
          >
            <Trophy size={18} className="text-[#FF9E1B]" />
            <span>National Standings</span>
          </Button>
        </div>

        {/* Metric Badges Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto pt-6 border-t border-white/15 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <div className="p-3.5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 text-left">
            <div className="flex items-center gap-2 text-[#40D3F2] font-bold text-xs mb-1">
              <BookOpen size={14} />
              <span>Authentic Bank</span>
            </div>
            <p className="text-sm sm:text-base font-black text-white">10,000+ Questions</p>
            <p className="text-[11px] text-white/60">WAEC & NECO Aligned</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 text-left">
            <div className="flex items-center gap-2 text-[#FF9E1B] font-bold text-xs mb-1">
              <Trophy size={14} />
              <span>Scholarships</span>
            </div>
            <p className="text-sm sm:text-base font-black text-white">₦50,000 Monthly</p>
            <p className="text-[11px] text-white/60">Top Performer Prizes</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 text-left">
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs mb-1">
              <Flame size={14} />
              <span>Duel Mode</span>
            </div>
            <p className="text-sm sm:text-base font-black text-white">Live 1-on-1 Battles</p>
            <p className="text-[11px] text-white/60">Challenge Classmates</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 text-left">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-1">
              <Award size={14} />
              <span>Diagnostics</span>
            </div>
            <p className="text-sm sm:text-base font-black text-white">Curriculum Mastery</p>
            <p className="text-[11px] text-white/60">Instant Weakness Alerts</p>
          </div>
        </div>
      </div>
    </section>
  );
};

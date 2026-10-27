import { Star } from "lucide-react";
import pic1 from "@/assets/pic1.jpg";
import pic3 from "@/assets/pic3.jpg";
import pic4 from "@/assets/pic4.jpg";

export const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="py-10 lg:py-14 transition-colors duration-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
            Big Wins Start with Small Daily Habits.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            Read how students, parents, and schools across Nigeria use Éclat to transform exam performance.
          </p>
        </div>

        {/* 3 Testimonial Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          
          {/* Card 1 */}
          <div className="rounded-3xl border border-slate-200 dark:border-[#1e2f50] bg-white dark:bg-[#0c1830] p-6 lg:p-7 flex flex-col justify-between shadow-sm text-left">
            <div>
              {/* Stars */}
              <div className="flex items-center gap-1 text-amber-400 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={15} className="fill-amber-400" />
                ))}
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal mb-6">
                "My daughter was terrified of BECE Mathematics. After three weeks of daily 15-minute drills on Éclat, her confidence skyrocketed and she scored an A in her mock exam."
              </p>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-[#1a2b48]">
              <img
                src={pic3}
                alt="Mrs. Folashade Adeyemi"
                className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
              />
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  Mrs. Folashade Adeyemi
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Parent, Lagos
                </p>
              </div>
            </div>
          </div>

          {/* Card 2 (Center - Highlighted) */}
          <div className="rounded-3xl border-2 border-cyan-500 dark:border-cyan-400/60 bg-white dark:bg-[#0c1830] p-6 lg:p-7 flex flex-col justify-between shadow-lg shadow-cyan-500/10 text-left relative transform md:-translate-y-2">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={15} className="fill-amber-400" />
                  ))}
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  SCHOLARSHIP WINNER
                </span>
              </div>

              <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed font-medium mb-6">
                "Winning the ₦50,000 monthly scholarship was life-changing! It didn't just help pay for my school books, it made me realise that studying hard really pays off."
              </p>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-[#1a2b48]">
              <img
                src={pic1}
                alt="Chiamaka Odunayo"
                className="w-11 h-11 rounded-full object-cover ring-2 ring-cyan-500"
              />
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  Chiamaka Odunayo
                </p>
                <p className="text-[11px] text-cyan-600 dark:text-cyan-400 font-semibold">
                  JSS 3 Student, Port Harcourt
                </p>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="rounded-3xl border border-slate-200 dark:border-[#1e2f50] bg-white dark:bg-[#0c1830] p-6 lg:p-7 flex flex-col justify-between shadow-sm text-left">
            <div>
              <div className="flex items-center gap-1 text-amber-400 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={15} className="fill-amber-400" />
                ))}
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal mb-6">
                "As a school administrator, tracking 120 BECE candidates used to be a nightmare. Éclat gives our teachers instant visibility into curriculum gaps across all arms."
              </p>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-[#1a2b48]">
              <img
                src={pic4}
                alt="Mr. Babatunde Alabi"
                className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
              />
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  Mr. Babatunde Alabi
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Principal, Apex Academy, Ibadan
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

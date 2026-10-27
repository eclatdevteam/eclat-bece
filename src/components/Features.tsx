import { BookOpen, Swords, Users, BarChart3 } from "lucide-react";
import pic6 from "@/assets/pic6.png";
import pic7 from "@/assets/pic7.png";
import pic8 from "@/assets/pic8.png";
import pic9 from "@/assets/pic9.png";

export const Features = () => {
  return (
    <section id="features" className="py-10 lg:py-14 transition-colors duration-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 text-xs font-semibold tracking-wide mb-4">
            <span>COMPREHENSIVE LEARNING ECOSYSTEM</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-4">
            Built for Students, Empowered by <br className="hidden sm:inline" />
            Parents & Schools
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            A unified platform designed to make exam preparation structured, collaborative, and deeply engaging for everyone involved.
          </p>
        </div>

        {/* Feature 1: Large Wide Top Card */}
        <div className="mb-6 rounded-3xl border border-slate-200 dark:border-[#1e2f50] bg-white dark:bg-[#0c1830] p-6 lg:p-8 shadow-sm">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Image: pic7 */}
            <div className="lg:col-span-7 rounded-2xl overflow-hidden aspect-[16/10] bg-slate-100 dark:bg-slate-900 shadow-sm">
              <img
                src={pic7}
                alt="Students studying collaboratively around laptop"
                className="w-full h-full object-cover object-center"
              />
            </div>

            {/* Right Content */}
            <div className="lg:col-span-5 space-y-4 text-left">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20">
                FOR STUDENTS
              </span>

              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
                We turn exam revision into a daily win.
              </h3>

              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                Ditch boring textbooks for an addictive, gamified learning experience. Practice past questions, earn XP, climb leaderboards, challenge friends in live duels, and qualify for real monthly cash scholarships that reward your academic hard work.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-[#1a2b48]">
                <div>
                  <p className="text-xl sm:text-2xl font-black text-cyan-600 dark:text-[#38bdf8]">10,000+</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Authentic Questions Bank</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-black text-cyan-600 dark:text-[#38bdf8]">1v1</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Live Duel Mode Arena</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* 2x2 Grid of Feature Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* Card 1: For Parents & Guardians (pic6) */}
          <div className="rounded-3xl border border-slate-200 dark:border-[#1e2f50] bg-white dark:bg-[#0c1830] p-6 lg:p-7 flex flex-col justify-between shadow-sm text-left">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  FOR PARENTS & GUARDIANS
                </span>
                <BookOpen size={18} className="text-blue-500" />
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Personalized Practice Builder
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6 font-normal">
                Create custom drills tailored to your child's needs. Pick subjects, topics, adjust question volume, and track their preparation directly from your dashboard.
              </p>
            </div>

            <div className="relative rounded-2xl overflow-hidden aspect-[16/10] bg-slate-100 dark:bg-slate-900">
              <img
                src={pic6}
                alt="Parent and child studying together"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-slate-950/75 backdrop-blur-md text-[11px] font-semibold text-white border border-white/10">
                Custom Drills & Target Weaknesses
              </div>
            </div>
          </div>

          {/* Card 2: For Competitive Students (pic8) */}
          <div className="rounded-3xl border border-slate-200 dark:border-[#1e2f50] bg-white dark:bg-[#0c1830] p-6 lg:p-7 flex flex-col justify-between shadow-sm text-left">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  FOR COMPETITIVE STUDENTS
                </span>
                <Swords size={18} className="text-purple-500" />
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Real-Time 1v1 Battle Duels
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6 font-normal">
                Step into the national arena to challenge classmates or match with students across Nigeria in timed head-to-head showdowns. Sharpen reflexes and conquer exam anxiety.
              </p>
            </div>

            <div className="relative rounded-2xl overflow-hidden aspect-[16/10] bg-slate-100 dark:bg-slate-900">
              <img
                src={pic8}
                alt="Two students competing in live battle duel"
                className="w-full h-full object-cover object-center"
              />
            </div>
          </div>

          {/* Card 3: For Schools & Tutors (pic9) */}
          <div className="rounded-3xl border border-slate-200 dark:border-[#1e2f50] bg-white dark:bg-[#0c1830] p-6 lg:p-7 flex flex-col justify-between shadow-sm text-left">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  FOR SCHOOLS & TUTORS
                </span>
                <Users size={18} className="text-amber-500" />
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Classroom & Cohort Management
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6 font-normal">
                Enroll entire classrooms, generate instant student link codes, assign past question homework sets, and compare cohort scores with comprehensive downloadable reports.
              </p>
            </div>

            <div className="relative rounded-2xl overflow-hidden aspect-[16/10] bg-slate-100 dark:bg-slate-900">
              <img
                src={pic9}
                alt="Instructor in school computer lab"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-slate-950/75 backdrop-blur-md text-[11px] font-semibold text-white border border-white/10">
                Class-wide analytics • Auto-graded
              </div>
            </div>
          </div>

          {/* Card 4: Smart Diagnostics (Interactive Progress Bars) */}
          <div className="rounded-3xl border border-slate-200 dark:border-[#1e2f50] bg-white dark:bg-[#0c1830] p-6 lg:p-7 flex flex-col justify-between shadow-sm text-left">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  SMART DIAGNOSTICS
                </span>
                <BarChart3 size={18} className="text-emerald-500" />
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Curriculum Weakness Alerts
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6 font-normal">
                Track speed, accuracy, and topic-level mastery in real time. Visual progress charts pinpoint exact curriculum gaps so you never waste hours reviewing topics already mastered.
              </p>
            </div>

            {/* Diagnostic Progress Simulation Box */}
            <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-[#1a2b48] bg-slate-50 dark:bg-[#071124] space-y-4">
              
              {/* Subject 1 */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-800 dark:text-slate-200">Mathematics: Algebraic Expressions</span>
                  <span className="text-cyan-600 dark:text-cyan-400">78% Mastery (Strong)</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full bg-cyan-500" style={{ width: "78%" }} />
                </div>
              </div>

              {/* Subject 2 */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-800 dark:text-slate-200">English: Lexis & Structure</span>
                  <span className="text-amber-500">92% Mastery (Mastered)</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full bg-amber-400" style={{ width: "92%" }} />
                </div>
              </div>

              {/* Subject 3 */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-800 dark:text-slate-200">Basic Science: Living Things & Energy</span>
                  <span className="text-purple-500">45% Review Needed</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full bg-purple-500" style={{ width: "45%" }} />
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

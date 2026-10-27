import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, Crown, ArrowRight, Clock } from "lucide-react";
import pic1 from "@/assets/pic1.jpg";
import pic2 from "@/assets/pic2.jpg";
import pic3 from "@/assets/pic3.jpg";
import pic4 from "@/assets/pic4.jpg";

interface LeaderboardSectionProps {
  onJoinArenaClick: () => void;
}

export const LeaderboardSection = ({ onJoinArenaClick }: LeaderboardSectionProps) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("National");

  const tabs = ["National", "Mathematics", "English Lang", "Science", "BECE General", "Schools"];

  const contenders = [
    { rank: 4, name: "Blessing Okon", school: "Federal Science College", xp: "4,490 XP", avatar: pic4 },
    { rank: 5, name: "Emmanuel Eze", school: "Kings College, Lagos", xp: "4,320 XP", avatar: pic1 },
    { rank: 6, name: "Amina Bello", school: "Queen's College, Lagos", xp: "4,180 XP", avatar: pic2 },
    { rank: 7, name: "Tunde Bakare", school: "Grace High School, Ibadan", xp: "4,050 XP", avatar: pic3 },
    { rank: 8, name: "Zainab Usman", school: "Loyola Jesuit College, Abuja", xp: "3,940 XP", avatar: pic4 },
  ];

  return (
    <section id="leaderboard" className="py-10 lg:py-14 transition-colors duration-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 text-xs font-semibold tracking-wide mb-4">
            <span>MONTHLY LEADERBOARD</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
            Climb the Board. Win the Scholarship.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            Top-performing students across Nigeria earn real cash rewards and national recognition at the end of every monthly season.
          </p>
        </div>

        {/* Grand Prize Banner Card */}
        <div className="mb-10 rounded-2xl border border-slate-200 dark:border-[#1e2f50] bg-white dark:bg-[#0c1830] p-4 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0 font-black text-lg">
              <Trophy size={22} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                MONTHLY PRIZE
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                ₦50,000 Monthly Scholarship
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Direct academic grant to the top-scoring student of each season.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="px-3.5 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-1.5 shrink-0">
              <Clock size={13} />
              <span>SEASON ENDS IN: 04d 18h 32m</span>
            </div>

            <button
              onClick={onJoinArenaClick}
              className="w-full sm:w-auto px-6 py-2.5 rounded-full text-sm font-bold bg-[#00a8e8] hover:bg-[#0096d1] text-slate-950 shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.02]"
            >
              Join the Arena
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center justify-center gap-2 mb-10 overflow-x-auto pb-2 scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab
                  ? "bg-[#00a8e8] text-slate-950 shadow-sm"
                  : "bg-slate-100 dark:bg-[#0c1830] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#1e2f50]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* 2-Column Leaderboard Showcase */}
        <div className="grid lg:grid-cols-12 gap-6">
          
          {/* Left Column: Top 3 National Contenders Podium */}
          <div className="lg:col-span-5 rounded-3xl border border-slate-200 dark:border-[#1e2f50] bg-white dark:bg-[#0c1830] p-6 flex flex-col justify-between shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white text-center mb-6">
              Top 3 National Contenders
            </h3>

            {/* Podium Graphics */}
            <div className="grid grid-cols-3 gap-2 items-end pt-4 pb-2">
              
              {/* Rank 2 (Silver) */}
              <div className="flex flex-col items-center">
                <div className="relative mb-2">
                  <img
                    src={pic2}
                    alt="David K."
                    className="w-14 h-14 rounded-full object-cover ring-2 ring-slate-400"
                  />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-300 text-slate-800 text-[10px] font-black flex items-center justify-center ring-2 ring-white dark:ring-[#0c1830]">
                    2
                  </div>
                </div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">David K.</p>
                <p className="text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold mb-2">4,850 XP</p>
                
                {/* Podium Bar 2 */}
                <div className="w-full h-24 rounded-t-xl bg-slate-100 dark:bg-[#122240] border-t-2 border-slate-300 flex items-center justify-center font-black text-slate-400">
                  2
                </div>
              </div>

              {/* Rank 1 (Gold - Center) */}
              <div className="flex flex-col items-center">
                <div className="relative mb-2">
                  <Crown size={20} className="text-amber-400 mb-1 mx-auto" />
                  <img
                    src={pic1}
                    alt="Chiamaka O."
                    className="w-16 h-16 rounded-full object-cover ring-4 ring-amber-400"
                  />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black flex items-center justify-center ring-2 ring-white dark:ring-[#0c1830]">
                    1
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-500 mb-0.5">
                  Leader
                </span>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Chiamaka O.</p>
                <p className="text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold mb-2">5,420 XP</p>

                {/* Podium Bar 1 */}
                <div className="w-full h-32 rounded-t-xl bg-cyan-50 dark:bg-[#16335a] border-t-2 border-amber-400 flex items-center justify-center font-black text-cyan-700 dark:text-cyan-300">
                  1
                </div>
              </div>

              {/* Rank 3 (Bronze) */}
              <div className="flex flex-col items-center">
                <div className="relative mb-2">
                  <img
                    src={pic3}
                    alt="Farouq A."
                    className="w-14 h-14 rounded-full object-cover ring-2 ring-amber-700"
                  />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-700 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white dark:ring-[#0c1830]">
                    3
                  </div>
                </div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Farouq A.</p>
                <p className="text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold mb-2">4,610 XP</p>

                {/* Podium Bar 3 */}
                <div className="w-full h-20 rounded-t-xl bg-emerald-50/60 dark:bg-[#0f2a24] border-t-2 border-emerald-500 flex items-center justify-center font-black text-emerald-600 dark:text-emerald-400">
                  3
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Live Season Rankings Table */}
          <div className="lg:col-span-7 rounded-3xl border border-slate-200 dark:border-[#1e2f50] bg-white dark:bg-[#0c1830] p-6 shadow-sm text-left">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-[#1a2b48]">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                LIVE SEASON RANKINGS
              </span>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Season 8 • Real-time
              </span>
            </div>

            <div className="space-y-2">
              {contenders.map((c) => (
                <div
                  key={c.rank}
                  className="p-3 rounded-xl border border-slate-100 dark:border-[#182642] bg-slate-50/70 dark:bg-[#071124] flex items-center justify-between hover:border-cyan-500/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 text-center text-xs font-black text-slate-400">
                      {c.rank}
                    </span>
                    <img
                      src={c.avatar}
                      alt={c.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
                        {c.name}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {c.school}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">
                    {c.xp}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1a2b48] text-center">
              <button
                onClick={() => navigate("/leaderboard")}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-300 transition-colors"
              >
                <span>View full national leaderboard</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

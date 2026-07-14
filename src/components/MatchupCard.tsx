import { motion } from "motion/react";
import { ShieldCheck } from "lucide-react";

interface TeamDetail {
  name: string;
  flag: string;
  color: string;
  secondary: string;
}

const TEAMS: Record<string, TeamDetail> = {
  France: { name: "France", flag: "https://flagcdn.com/w40/fr.png", color: "from-blue-600/20 to-blue-900/40", secondary: "text-blue-400" },
  Spain: { name: "Spain", flag: "https://flagcdn.com/w40/es.png", color: "from-red-600/20 to-yellow-600/30", secondary: "text-red-400" },
  England: { name: "England", flag: "https://flagcdn.com/w40/gb-eng.png", color: "from-slate-100/10 to-slate-400/20", secondary: "text-slate-300" },
  Argentina: { name: "Argentina", flag: "https://flagcdn.com/w40/ar.png", color: "from-sky-400/20 to-blue-500/25", secondary: "text-sky-300" },
};

interface MatchupCardProps {
  team1: string;
  team2: string;
  winner?: string;
  onClick?: () => void;
  statusText?: string;
}

export default function MatchupCard({ team1, team2, winner, onClick, statusText = "SEMI-FINAL" }: MatchupCardProps) {
  const t1 = TEAMS[team1] || { name: team1, flag: "", color: "from-white/5", secondary: "text-white" };
  const t2 = TEAMS[team2] || { name: team2, flag: "", color: "from-white/5", secondary: "text-white" };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={`relative w-full overflow-hidden bg-white/5 border border-white/10 rounded-3xl p-5  ${
        onClick ? "cursor-pointer hover:border-amber-400/30" : ""
      }`}
    >
      {/* Background radial highlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-amber-500/5 blur-[80px] rounded-full pointer-events-none" />

      <div className="flex items-center justify-between text-[10px] font-bold tracking-widest text-amber-400/80 uppercase mb-4">
        <span>{statusText}</span>
        {winner && (
          <div className="flex items-center gap-1 text-emerald-400">
            <ShieldCheck className="w-3 h-3" />
            <span>Winner: {winner}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-7 items-center gap-2">
        {/* Team 1 */}
        <div className="col-span-3 flex flex-col items-center gap-2 text-center">
          <div className="w-14 h-14 rounded-full overflow-hidden border border-white/20 shadow-lg shadow-black/30 flex items-center justify-center bg-white/5 shrink-0">
            {t1.flag ? (
              <img
                src={t1.flag}
                alt={t1.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : null}
          </div>
          <span className="text-sm font-bold text-white tracking-wide">{t1.name}</span>
          {winner === team1 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold uppercase tracking-wider border border-emerald-500/10">
              Qualified
            </span>
          )}
        </div>

        {/* VS Divider */}
        <div className="col-span-1 flex flex-col items-center justify-center">
          <div className="relative w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <span className="text-xs font-bold text-gray-400 tracking-tighter">VS</span>
          </div>
          <div className="w-px h-8 bg-gradient-to-b from-white/10 to-transparent mt-1" />
        </div>

        {/* Team 2 */}
        <div className="col-span-3 flex flex-col items-center gap-2 text-center">
          <div className="w-14 h-14 rounded-full overflow-hidden border border-white/20 shadow-lg shadow-black/30 flex items-center justify-center bg-white/5 shrink-0">
            {t2.flag ? (
              <img
                src={t2.flag}
                alt={t2.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : null}
          </div>
          <span className="text-sm font-bold text-white tracking-wide">{t2.name}</span>
          {winner === team2 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold uppercase tracking-wider border border-emerald-500/10">
              Qualified
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

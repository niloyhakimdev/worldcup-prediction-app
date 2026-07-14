import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Trophy, 
  RefreshCw, 
  Search, 
  Medal, 
  Clock, 
  Crown,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { Prediction, AdminResults, LeaderboardEntry } from "../types";
import { getAllPredictions, getResults } from "../lib/db";

interface LeaderboardProps {
  onViewPrediction: (id: string) => void;
  results: AdminResults;
}

const TEAMS: Record<string, { name: string; flag: string }> = {
  France: { name: "France", flag: "https://flagcdn.com/w40/fr.png" },
  Spain: { name: "Spain", flag: "https://flagcdn.com/w40/es.png" },
  England: { name: "England", flag: "https://flagcdn.com/w40/gb-eng.png" },
  Argentina: { name: "Argentina", flag: "https://flagcdn.com/w40/ar.png" },
};

export default function Leaderboard({ onViewPrediction, results }: LeaderboardProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLeaderboardData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAllPredictions();
      const sanitizedData = data.map(p => {
        if (p.avatar) p.avatar = p.avatar.replace("/adventurer/svg", "/adventurer/png");
        return p;
      });
      setPredictions(sanitizedData);
    } catch (err: any) {
      console.error(err);
      setError("Could not load leaderboard. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboardData();
  }, [results]);

  // Sort calculations:
  // 1. Higher score wins
  // 2. Tiebreaker: earlier submission wins (created_at ascending)
  const sortedLeaderboard: LeaderboardEntry[] = predictions
    .map((p) => {
      // Calculate scores dynamically to match state in case database sync lag or for local precision
      let score = 0;
      let match1Correct = false;
      let match2Correct = false;
      let match1ScoreCorrect = false;
      let match2ScoreCorrect = false;
      let championCorrect = false;

      if (results.published) {
        match1Correct = results.match1 ? p.match1 === results.match1 : false;
        match2Correct = results.match2 ? p.match2 === results.match2 : false;
        championCorrect = results.champion ? p.champion === results.champion : false;

        if (match1Correct) score += 1;
        if (match2Correct) score += 1;
        if (championCorrect) score += 2;

        // Exact score bonuses: +2 points per match
        if (
          results.match1ScoreFrance !== undefined && results.match1ScoreFrance !== null &&
          results.match1ScoreSpain !== undefined && results.match1ScoreSpain !== null &&
          p.match1ScoreFrance !== undefined && p.match1ScoreFrance !== null &&
          p.match1ScoreSpain !== undefined && p.match1ScoreSpain !== null &&
          Number(p.match1ScoreFrance) === Number(results.match1ScoreFrance) &&
          Number(p.match1ScoreSpain) === Number(results.match1ScoreSpain)
        ) {
          match1ScoreCorrect = true;
          score += 2;
        }

        if (
          results.match2ScoreEngland !== undefined && results.match2ScoreEngland !== null &&
          results.match2ScoreArgentina !== undefined && results.match2ScoreArgentina !== null &&
          p.match2ScoreEngland !== undefined && p.match2ScoreEngland !== null &&
          p.match2ScoreArgentina !== undefined && p.match2ScoreArgentina !== null &&
          Number(p.match2ScoreEngland) === Number(results.match2ScoreEngland) &&
          Number(p.match2ScoreArgentina) === Number(results.match2ScoreArgentina)
        ) {
          match2ScoreCorrect = true;
          score += 2;
        }
      }

      return {
        id: p.id,
        name: p.name,
        score: results.published ? (p.score ?? score) : 0, // 0 if not published yet
        match1Correct,
        match2Correct,
        match1ScoreCorrect,
        match2ScoreCorrect,
        championCorrect,
        created_at: p.created_at,
        p, // store original prediction
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.created_at - b.created_at; // Earlier timestamp wins ties
    });

  const filteredLeaderboard = sortedLeaderboard.filter((entry) =>
    (entry.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Top predictor details
  const topPredictor = sortedLeaderboard.length > 0 ? sortedLeaderboard[0] : null;

  const getMedalBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-black font-extrabold shadow-md shadow-amber-400/20">
          1
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-black font-extrabold shadow-md shadow-slate-300/20">
          2
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-700 text-white font-extrabold shadow-md shadow-amber-700/20">
          3
        </div>
      );
    }
    return <span className="text-xs text-gray-500 font-bold">{rank}</span>;
  };

  return (
    <div className="space-y-6 w-full max-w-md mx-auto">
      {/* ANIMATED PODIUM FOR TOP 3 STANDINGS */}
      {!loading && sortedLeaderboard.length >= 3 && (
        <div id="podium-section" className="relative bg-white/5 border border-white/10 rounded-[2.5rem] p-5  shadow-2xl overflow-hidden">
          {/* Subtle gold lights background */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-amber-500/10 rounded-full blur-[60px] pointer-events-none" />
          
          <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-400 text-center border-b border-white/5 pb-2.5 mb-5 flex items-center justify-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            Top Predictors Podium
          </h4>

          <div className="flex items-end justify-center gap-2.5 pt-4">
            {/* SILVER (2ND PLACE) - LEFT */}
            {sortedLeaderboard[1] && (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                onClick={() => onViewPrediction(sortedLeaderboard[1].id)}
                className="flex-1 flex flex-col items-center cursor-pointer group"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-slate-300 rounded-full blur-sm opacity-20 group-hover:opacity-40 transition-opacity" />
                  <img 
                    src={`https://api.dicebear.com/7.x/adventurer/png?seed=${encodeURIComponent(sortedLeaderboard[1].name)}`} 
                    alt="" 
                    className="relative w-12 h-12 rounded-full border-2 border-slate-300 bg-zinc-900" 
                  />
                  <span className="absolute -bottom-1.5 -right-1 w-5 h-5 rounded-full bg-slate-300 text-black font-extrabold text-[10px] flex items-center justify-center border border-zinc-900 shadow-md">
                    2
                  </span>
                </div>
                <span className="text-[10px] font-black text-slate-300 mt-3 truncate max-w-[80px] text-center">
                  {sortedLeaderboard[1].name}
                </span>
                
                {/* Podium pedestal bar */}
                <div className="w-full h-16 bg-gradient-to-t from-slate-500/20 to-slate-400/10 border-t border-slate-300/30 rounded-t-xl mt-2 flex flex-col items-center justify-center">
                  <span className="text-xs font-black text-slate-300 font-mono">
                    {sortedLeaderboard[1].score}
                  </span>
                  <span className="text-[7px] text-slate-400 font-black uppercase tracking-wider">
                    PTS
                  </span>
                </div>
              </motion.div>
            )}

            {/* GOLD (1ST PLACE) - CENTER */}
            {sortedLeaderboard[0] && (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                onClick={() => onViewPrediction(sortedLeaderboard[0].id)}
                className="flex-1 flex flex-col items-center cursor-pointer group z-10 scale-105"
              >
                <div className="relative -mt-6">
                  <Crown className="w-5 h-5 text-amber-400 absolute -top-4.5 left-1/2 -translate-x-1/2 filter drop-shadow-md animate-bounce" />
                  <div className="absolute inset-0 bg-amber-400 rounded-full blur-sm opacity-30 group-hover:opacity-50 transition-opacity" />
                  <img 
                    src={`https://api.dicebear.com/7.x/adventurer/png?seed=${encodeURIComponent(sortedLeaderboard[0].name)}`} 
                    alt="" 
                    className="relative w-15 h-15 rounded-full border-2 border-amber-400 bg-zinc-900" 
                  />
                  <span className="absolute -bottom-1.5 -right-1 w-6 h-6 rounded-full bg-amber-400 text-black font-black text-xs flex items-center justify-center border-2 border-zinc-900 shadow-lg">
                    1
                  </span>
                </div>
                <span className="text-xs font-black text-amber-300 mt-3 truncate max-w-[90px] text-center">
                  {sortedLeaderboard[0].name}
                </span>

                {/* Podium pedestal bar */}
                <div className="w-full h-24 bg-gradient-to-t from-amber-500/20 to-amber-400/10 border-t border-amber-400/40 rounded-t-2xl mt-2 flex flex-col items-center justify-center shadow-lg shadow-amber-500/5">
                  <span className="text-sm font-black text-amber-400 font-mono">
                    {sortedLeaderboard[0].score}
                  </span>
                  <span className="text-[7px] text-amber-400/80 font-black uppercase tracking-wider">
                    PTS
                  </span>
                </div>
              </motion.div>
            )}

            {/* BRONZE (3RD PLACE) - RIGHT */}
            {sortedLeaderboard[2] && (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                onClick={() => onViewPrediction(sortedLeaderboard[2].id)}
                className="flex-1 flex flex-col items-center cursor-pointer group"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-amber-700 rounded-full blur-sm opacity-20 group-hover:opacity-40 transition-opacity" />
                  <img 
                    src={`https://api.dicebear.com/7.x/adventurer/png?seed=${encodeURIComponent(sortedLeaderboard[2].name)}`} 
                    alt="" 
                    className="relative w-11 h-11 rounded-full border-2 border-amber-700 bg-zinc-900" 
                  />
                  <span className="absolute -bottom-1.5 -right-1 w-5 h-5 rounded-full bg-amber-700 text-white font-extrabold text-[10px] flex items-center justify-center border border-zinc-900 shadow-md">
                    3
                  </span>
                </div>
                <span className="text-[10px] font-black text-amber-700 mt-3 truncate max-w-[80px] text-center">
                  {sortedLeaderboard[2].name}
                </span>

                {/* Podium pedestal bar */}
                <div className="w-full h-12 bg-gradient-to-t from-amber-700/20 to-amber-800/10 border-t border-amber-700/30 rounded-t-xl mt-2 flex flex-col items-center justify-center">
                  <span className="text-xs font-black text-amber-600 font-mono">
                    {sortedLeaderboard[2].score}
                  </span>
                  <span className="text-[7px] text-amber-700 font-black uppercase tracking-wider">
                    PTS
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* Top Predictor Dashboard (Only if published and we have entries) */}
      {results.published && topPredictor && topPredictor.score > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden bg-gradient-to-r from-amber-400/10 via-amber-400/5 to-transparent border border-amber-400/20 rounded-3xl p-5  shadow-xl"
        >
          <div className="absolute top-2 right-2 opacity-15">
            <Crown className="w-16 h-16 text-amber-400 animate-pulse" />
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Crown className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-amber-400">Current Leader</span>
              <h4 className="text-base font-extrabold text-white tracking-wide">{topPredictor.name}</h4>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/5 text-center">
            <div className="bg-white/5 border border-white/5 rounded-2xl p-2.5">
              <span className="block text-[9px] font-bold text-gray-400 uppercase">Correct Score</span>
              <span className="text-sm font-extrabold text-amber-400 mt-0.5">{topPredictor.score} pts</span>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-2xl p-2.5">
              <span className="block text-[9px] font-bold text-gray-400 uppercase">Picks Correct</span>
              <span className="text-sm font-extrabold text-white mt-0.5">
                {(topPredictor.match1Correct ? 1 : 0) + (topPredictor.match2Correct ? 1 : 0)} / 2
              </span>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-2xl p-2.5">
              <span className="block text-[9px] font-bold text-gray-400 uppercase">Champion Pick</span>
              <span className="text-xs font-bold text-amber-400/90 mt-1 truncate flex items-center justify-center gap-1.5">
                {TEAMS[topPredictor.p.champion]?.flag && (
                  <img
                    src={TEAMS[topPredictor.p.champion].flag}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-4 h-4 rounded-full border border-white/20 shrink-0"
                  />
                )}
                <span>{topPredictor.p.champion}</span>
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Leaderboard Controls */}
      <div className="flex items-center justify-between gap-3 bg-white/5 border border-white/10 p-3.5 rounded-2xl ">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search predictor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/5 rounded-xl py-2 pl-9 pr-3 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-amber-400/40 transition-all"
          />
        </div>
        <button
          onClick={loadLeaderboardData}
          disabled={loading}
          className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white transition-all disabled:opacity-50 cursor-pointer"
          title="Refresh Leaderboard"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-amber-400" : ""}`} />
        </button>
      </div>

      {/* Leaderboard Entries */}
      <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden ">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-1 px-4 py-3 bg-white/5 border-b border-white/10 text-[9px] font-bold uppercase tracking-wider text-gray-400">
          <span className="col-span-2 text-center">Rank</span>
          <span className="col-span-5 pl-1">Predictor Name</span>
          <span className="col-span-3 text-center">Selections</span>
          <span className="col-span-2 text-center">Score</span>
        </div>

        {/* Entries */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <span className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-gray-400">Updating live standings...</span>
          </div>
        ) : error ? (
          <div className="py-10 px-4 text-center">
            <AlertCircle className="w-5 h-5 text-red-400 mx-auto mb-2" />
            <p className="text-xs text-red-400 font-medium">{error}</p>
          </div>
        ) : filteredLeaderboard.length === 0 ? (
          <div className="py-12 text-center">
            <Trophy className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-xs text-gray-400 font-medium">
              {searchQuery ? "No matches found" : "No predictions submitted yet!"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5 max-h-[380px] overflow-y-auto">
            <AnimatePresence initial={false}>
              {filteredLeaderboard.map((entry, index) => {
                const rank = sortedLeaderboard.findIndex((e) => e.id === entry.id) + 1;
                const formattedTime = new Date(entry.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                });

                const userAvatarUrl = `https://api.dicebear.com/7.x/adventurer/png?seed=${encodeURIComponent(entry.name)}`;

                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => onViewPrediction(entry.id)}
                    className="grid grid-cols-12 gap-1 items-center px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    {/* Rank */}
                    <div className="col-span-2 flex justify-center">
                      {getMedalBadge(rank)}
                    </div>

                    {/* Name & Avatar */}
                    <div className="col-span-5 min-w-0 pr-1 flex items-center gap-2">
                      <img 
                        src={userAvatarUrl} 
                        alt="" 
                        referrerPolicy="no-referrer"
                        className="w-6.5 h-6.5 rounded-full bg-white/10 border border-white/10 shrink-0" 
                      />
                      <div className="min-w-0 flex flex-col">
                        <span className="text-xs font-bold text-white truncate tracking-wide">
                          {entry.name}
                        </span>
                        <span className="text-[8px] text-gray-500 font-mono mt-0.5 flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5 shrink-0" />
                          {formattedTime}
                        </span>
                      </div>
                    </div>

                    {/* Selections */}
                    <div className="col-span-3 flex items-center justify-center gap-1">
                      <div 
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-1.5 ${
                          results.published
                            ? entry.match1Correct
                              ? entry.match1ScoreCorrect
                                ? "bg-emerald-500 text-black border border-emerald-500 font-extrabold shadow-sm"
                                : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/10"
                              : "bg-red-500/10 text-red-400 border border-red-500/10"
                            : "bg-white/5 text-gray-300 border border-white/5"
                        }`}
                        title={`Semi 1 choice: France ${entry.p.match1ScoreFrance ?? 0}-${entry.p.match1ScoreSpain ?? 0} Spain (Picked: ${entry.p.match1})`}
                      >
                        {TEAMS[entry.p.match1]?.flag && (
                          <img
                            src={TEAMS[entry.p.match1].flag}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                          />
                        )}
                        {entry.p.match1ScoreFrance !== undefined && entry.p.match1ScoreSpain !== undefined && (
                          <span className="font-mono text-[8px] opacity-90 font-medium">
                            {entry.p.match1ScoreFrance}-{entry.p.match1ScoreSpain}
                          </span>
                        )}
                      </div>
                      <div 
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-1.5 ${
                          results.published
                            ? entry.match2Correct
                              ? entry.match2ScoreCorrect
                                ? "bg-emerald-500 text-black border border-emerald-500 font-extrabold shadow-sm"
                                : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/10"
                              : "bg-red-500/10 text-red-400 border border-red-500/10"
                            : "bg-white/5 text-gray-300 border border-white/5"
                        }`}
                        title={`Semi 2 choice: England ${entry.p.match2ScoreEngland ?? 0}-${entry.p.match2ScoreArgentina ?? 0} Argentina (Picked: ${entry.p.match2})`}
                      >
                        {TEAMS[entry.p.match2]?.flag && (
                          <img
                            src={TEAMS[entry.p.match2].flag}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                          />
                        )}
                        {entry.p.match2ScoreEngland !== undefined && entry.p.match2ScoreArgentina !== undefined && (
                          <span className="font-mono text-[8px] opacity-90 font-medium">
                            {entry.p.match2ScoreEngland}-{entry.p.match2ScoreArgentina}
                          </span>
                        )}
                      </div>
                      <div 
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          results.published
                            ? entry.championCorrect
                              ? "bg-emerald-500/20 text-amber-400 border border-amber-400/20 shadow-sm"
                              : "bg-red-500/10 text-red-400 border border-red-500/10"
                            : "bg-amber-400/10 text-amber-400 border border-amber-400/20"
                        }`}
                        title={`Champion choice: ${entry.p.champion}`}
                      >
                        🏆
                      </div>
                    </div>

                    {/* Score */}
                    <div className="col-span-2 text-center">
                      <span className={`text-xs font-extrabold ${results.published ? "text-amber-400" : "text-gray-400"}`}>
                        {entry.score}
                      </span>
                      <span className="text-[8px] text-gray-500 block">pts</span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Leaderboard Scoring breakdown indicator */}
      <div className="text-[10px] text-gray-500 font-medium text-center bg-white/2 p-2.5 rounded-xl border border-white/5">
        ℹ️ <span className="font-bold text-gray-400">Scoring:</span> Match Winner = 1 pt | Exact Match Score = +2 pts bonus | Champion = 2 pts. Max 8 pts. Ties broken by submission time (earlier is higher rank).
      </div>
    </div>
  );
}

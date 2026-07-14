import { useState, useEffect, FormEvent } from "react";
import { motion } from "motion/react";
import { 
  Lock, 
  Unlock, 
  Settings, 
  CheckCircle, 
  RotateCcw, 
  ShieldAlert, 
  Info,
  CheckCircle2
} from "lucide-react";
import { AdminResults, Team } from "../types";
import { getResults, publishResultsAndCalculateScores, seedMockPredictions } from "../lib/db";

interface AdminPanelProps {
  onResultsUpdated: (newResults: AdminResults) => void;
  onClose: () => void;
}

const TEAMS: Record<string, { name: string; code: string; flag: string }> = {
  France: { name: "France", code: "FRA", flag: "/flags/france.svg" },
  Spain: { name: "Spain", code: "ESP", flag: "/flags/spain.svg" },
  England: { name: "England", code: "ENG", flag: "/flags/england.svg" },
  Argentina: { name: "Argentina", code: "ARG", flag: "/flags/argentina.svg" },
};

export default function AdminPanel({ onResultsUpdated, onClose }: AdminPanelProps) {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [match1, setMatch1] = useState<"France" | "Spain" | "">("");
  const [match2, setMatch2] = useState<"England" | "Argentina" | "">("");
  const [champion, setChampion] = useState<Team | "">("");
  const [published, setPublished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [authError, setAuthError] = useState("");

  const [match1ScoreFrance, setMatch1ScoreFrance] = useState<number | "">("");
  const [match1ScoreSpain, setMatch1ScoreSpain] = useState<number | "">("");
  const [match2ScoreEngland, setMatch2ScoreEngland] = useState<number | "">("");
  const [match2ScoreArgentina, setMatch2ScoreArgentina] = useState<number | "">("");

  const ADMIN_PASSWORD = "wc2026"; // Simple, easy password for evaluation

  const handleAdminMatch1FranceScoreChange = (val: string) => {
    const num = val === "" ? "" : Math.max(0, parseInt(val));
    setMatch1ScoreFrance(num);
    
    // Auto-update winner if scores are unequal
    if (typeof num === "number" && typeof match1ScoreSpain === "number") {
      if (num > match1ScoreSpain) {
        setMatch1("France");
      } else if (num < match1ScoreSpain) {
        setMatch1("Spain");
      }
    }
  };

  const handleAdminMatch1SpainScoreChange = (val: string) => {
    const num = val === "" ? "" : Math.max(0, parseInt(val));
    setMatch1ScoreSpain(num);
    
    // Auto-update winner if scores are unequal
    if (typeof num === "number" && typeof match1ScoreFrance === "number") {
      if (match1ScoreFrance > num) {
        setMatch1("France");
      } else if (match1ScoreFrance < num) {
        setMatch1("Spain");
      }
    }
  };

  const handleAdminMatch2EnglandScoreChange = (val: string) => {
    const num = val === "" ? "" : Math.max(0, parseInt(val));
    setMatch2ScoreEngland(num);
    
    // Auto-update winner if scores are unequal
    if (typeof num === "number" && typeof match2ScoreArgentina === "number") {
      if (num > match2ScoreArgentina) {
        setMatch2("England");
      } else if (num < match2ScoreArgentina) {
        setMatch2("Argentina");
      }
    }
  };

  const handleAdminMatch2ArgentinaScoreChange = (val: string) => {
    const num = val === "" ? "" : Math.max(0, parseInt(val));
    setMatch2ScoreArgentina(num);
    
    // Auto-update winner if scores are unequal
    if (typeof num === "number" && typeof match2ScoreEngland === "number") {
      if (match2ScoreEngland > num) {
        setMatch2("England");
      } else if (match2ScoreEngland < num) {
        setMatch2("Argentina");
      }
    }
  };

  useEffect(() => {
    // Load existing results
    const fetchExistingResults = async () => {
      try {
        const res = await getResults();
        setMatch1(res.match1);
        setMatch2(res.match2);
        setChampion(res.champion);
        setPublished(res.published);
        setMatch1ScoreFrance(res.match1ScoreFrance !== undefined && res.match1ScoreFrance !== null ? res.match1ScoreFrance : "");
        setMatch1ScoreSpain(res.match1ScoreSpain !== undefined && res.match1ScoreSpain !== null ? res.match1ScoreSpain : "");
        setMatch2ScoreEngland(res.match2ScoreEngland !== undefined && res.match2ScoreEngland !== null ? res.match2ScoreEngland : "");
        setMatch2ScoreArgentina(res.match2ScoreArgentina !== undefined && res.match2ScoreArgentina !== null ? res.match2ScoreArgentina : "");
      } catch (err) {
        console.error("Failed to load existing admin results:", err);
      }
    };
    fetchExistingResults();
  }, []);

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    setAuthError("");

    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
    } else {
      setAuthError("Incorrect admin password. Try 'wc2026'");
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsSaving(true);

    try {
      const updatedConfig: AdminResults = {
        match1,
        match2,
        champion,
        published,
        match1ScoreFrance: match1ScoreFrance !== "" ? Number(match1ScoreFrance) : undefined,
        match1ScoreSpain: match1ScoreSpain !== "" ? Number(match1ScoreSpain) : undefined,
        match2ScoreEngland: match2ScoreEngland !== "" ? Number(match2ScoreEngland) : undefined,
        match2ScoreArgentina: match2ScoreArgentina !== "" ? Number(match2ScoreArgentina) : undefined,
      };

      await publishResultsAndCalculateScores(updatedConfig);
      onResultsUpdated(updatedConfig);

      setMessage({
        text: published 
          ? "✅ Standings successfully scored & published!" 
          : "✅ Results saved as draft (scoring paused)",
        type: "success"
      });
    } catch (err: any) {
      console.error(err);
      setMessage({
        text: "Error saving results. Check your connections.",
        type: "error"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm("Are you sure you want to clear results? This resets all prediction scores to 0.")) {
      return;
    }
    
    setIsSaving(true);
    try {
      const resetConfig: AdminResults = {
        match1: "",
        match2: "",
        champion: "",
        published: false,
        match1ScoreFrance: undefined,
        match1ScoreSpain: undefined,
        match2ScoreEngland: undefined,
        match2ScoreArgentina: undefined,
      };

      await publishResultsAndCalculateScores(resetConfig);
      setMatch1("");
      setMatch2("");
      setChampion("");
      setPublished(false);
      setMatch1ScoreFrance("");
      setMatch1ScoreSpain("");
      setMatch2ScoreEngland("");
      setMatch2ScoreArgentina("");
      onResultsUpdated(resetConfig);

      setMessage({
        text: "✅ Results cleared and predictions reset to unscored.",
        type: "success"
      });
    } catch (err) {
      console.error(err);
      setMessage({
        text: "Reset failed. Try again.",
        type: "error"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSeedMockData = async () => {
    setIsSeeding(true);
    setMessage(null);
    try {
      await seedMockPredictions();
      setMessage({
        text: "🚀 Famous figures and Bangladeshi fan mock predictions successfully seeded!",
        type: "success"
      });
    } catch (err) {
      console.error(err);
      setMessage({
        text: "Failed to seed mock predictions. Check your connection.",
        type: "error"
      });
    } finally {
      setIsSeeding(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="w-full max-w-md mx-auto bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col items-center text-center gap-2 mb-6 border-b border-white/5 pb-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-base font-black uppercase italic text-white tracking-wide mt-2">Admin Control Panel</h3>
          <p className="text-xs text-gray-400">Password required to publish tournament results</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
              Admin Password
            </label>
            <input
              type="password"
              placeholder="e.g. wc2026"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:border-amber-400/50 transition-all text-center font-mono"
            />
          </div>

          {authError && (
            <p className="text-xs text-red-400 font-medium text-center">{authError}</p>
          )}

          <div className="bg-amber-400/5 border border-amber-400/10 rounded-2xl p-3.5 flex gap-2 items-start">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-gray-400 leading-normal">
              <span className="font-bold text-amber-400">Hint:</span> Use password <code className="font-mono bg-white/5 px-1 py-0.5 rounded text-amber-300">wc2026</code> to evaluate results scoring, auto-calculation, and dashboard leaderboard changes.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/5 border border-white/10 text-gray-400 font-bold py-3.5 px-4 rounded-2xl text-xs tracking-wider uppercase hover:bg-white/10 hover:text-white transition-all cursor-pointer"
            >
              Back
            </button>
            <button
              type="submit"
              className="flex-1 bg-amber-400 text-black font-black py-3.5 px-4 rounded-2xl text-xs tracking-wider uppercase hover:bg-amber-300 transition-all cursor-pointer shadow-md shadow-amber-400/10"
            >
              Unlock Panel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-2xl space-y-6">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-black uppercase italic text-white tracking-wide">Admin Controls</h3>
        </div>
        <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/10 text-[9px] font-bold uppercase">
          <Unlock className="w-2.5 h-2.5" />
          <span>Unlocked</span>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Semi Final 1 */}
        <div className="space-y-2">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Winner: France vs Spain
          </label>
          <div className="grid grid-cols-2 gap-2">
            {["France", "Spain"].map((id) => {
              const team = TEAMS[id];
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMatch1(id as any)}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    match1 === id
                      ? "bg-amber-400 text-black border-amber-400 shadow-md shadow-amber-400/15"
                      : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                  }`}
                >
                  <img src={team.flag} alt="" referrerPolicy="no-referrer" className="w-5 h-5 rounded-full border border-white/10" />
                  <span>{team.name}</span>
                </button>
              );
            })}
          </div>

          {/* Actual Match 1 Score */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-2 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400">Actual Match Score</span>
              {match1ScoreFrance === match1ScoreSpain && match1ScoreFrance !== "" && (
                <span className="text-[8px] text-amber-300 font-semibold bg-amber-400/10 px-2 py-0.5 rounded-full">Draw / Shootout needed</span>
              )}
            </div>
            <div className="grid grid-cols-7 gap-1 items-center">
              <div className="col-span-3 flex items-center gap-2">
                <img src="/flags/france.svg" alt="France" referrerPolicy="no-referrer" className="w-6 h-6 rounded-full border border-white/20 shadow shrink-0" />
                <span className="text-xs font-bold text-white">FRA</span>
              </div>
              <div className="col-span-1 flex justify-center">
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={match1ScoreFrance}
                  onChange={(e) => handleAdminMatch1FranceScoreChange(e.target.value)}
                  className="w-10 bg-white/10 border border-white/10 rounded-xl text-center py-1 text-sm font-bold text-white focus:outline-none focus:border-amber-400"
                />
              </div>
              <div className="col-span-1 text-center text-xs font-bold text-gray-500">:</div>
              <div className="col-span-1 flex justify-center">
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={match1ScoreSpain}
                  onChange={(e) => handleAdminMatch1SpainScoreChange(e.target.value)}
                  className="w-10 bg-white/10 border border-white/10 rounded-xl text-center py-1 text-sm font-bold text-white focus:outline-none focus:border-amber-400"
                />
              </div>
              <div className="col-span-1 flex items-center justify-end gap-2">
                <span className="text-xs font-bold text-white">ESP</span>
                <img src="/flags/spain.svg" alt="Spain" referrerPolicy="no-referrer" className="w-6 h-6 rounded-full border border-white/20 shadow shrink-0" />
              </div>
            </div>
          </div>
        </div>

        {/* Semi Final 2 */}
        <div className="space-y-2">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Winner: England vs Argentina
          </label>
          <div className="grid grid-cols-2 gap-2">
            {["England", "Argentina"].map((id) => {
              const team = TEAMS[id];
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMatch2(id as any)}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    match2 === id
                      ? "bg-amber-400 text-black border-amber-400 shadow-md shadow-amber-400/15"
                      : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                  }`}
                >
                  <img src={team.flag} alt="" referrerPolicy="no-referrer" className="w-5 h-5 rounded-full border border-white/10" />
                  <span>{team.name}</span>
                </button>
              );
            })}
          </div>

          {/* Actual Match 2 Score */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-2 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400">Actual Match Score</span>
              {match2ScoreEngland === match2ScoreArgentina && match2ScoreEngland !== "" && (
                <span className="text-[8px] text-amber-300 font-semibold bg-amber-400/10 px-2 py-0.5 rounded-full">Draw / Shootout needed</span>
              )}
            </div>
            <div className="grid grid-cols-7 gap-1 items-center">
              <div className="col-span-3 flex items-center gap-2">
                <img src="/flags/england.svg" alt="England" referrerPolicy="no-referrer" className="w-6 h-6 rounded-full border border-white/20 shadow shrink-0" />
                <span className="text-xs font-bold text-white">ENG</span>
              </div>
              <div className="col-span-1 flex justify-center">
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={match2ScoreEngland}
                  onChange={(e) => handleAdminMatch2EnglandScoreChange(e.target.value)}
                  className="w-10 bg-white/10 border border-white/10 rounded-xl text-center py-1 text-sm font-bold text-white focus:outline-none focus:border-amber-400"
                />
              </div>
              <div className="col-span-1 text-center text-xs font-bold text-gray-500">:</div>
              <div className="col-span-1 flex justify-center">
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={match2ScoreArgentina}
                  onChange={(e) => handleAdminMatch2ArgentinaScoreChange(e.target.value)}
                  className="w-10 bg-white/10 border border-white/10 rounded-xl text-center py-1 text-sm font-bold text-white focus:outline-none focus:border-amber-400"
                />
              </div>
              <div className="col-span-1 flex items-center justify-end gap-2">
                <span className="text-xs font-bold text-white">ARG</span>
                <img src="/flags/argentina.svg" alt="Argentina" referrerPolicy="no-referrer" className="w-6 h-6 rounded-full border border-white/20 shadow shrink-0" />
              </div>
            </div>
          </div>
        </div>

        {/* Champion */}
        <div className="space-y-2">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Tournament Champion
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {["France", "Spain", "England", "Argentina"].map((id) => {
              const team = TEAMS[id];
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setChampion(id as Team)}
                  className={`flex flex-col items-center gap-1.5 py-2 px-1 rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${
                    champion === id
                      ? "bg-amber-400 text-black border-amber-400 shadow-md shadow-amber-400/15"
                      : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                  }`}
                >
                  <img src={team.flag} alt="" referrerPolicy="no-referrer" className="w-6 h-6 rounded-full border border-white/10" />
                  <span>{team.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Publishing Status Toggle */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Publish Results</span>
            <span className="text-[9px] text-gray-400">Enable automatic leaderboard points calculation</span>
          </div>
          <button
            type="button"
            onClick={() => setPublished(!published)}
            className={`w-12 h-6 rounded-full p-1 transition-all cursor-pointer ${
              published ? "bg-amber-400" : "bg-white/10"
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-black transition-transform ${
                published ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {message && (
          <div className={`p-3.5 rounded-2xl text-xs font-semibold ${
            message.type === "success" 
              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" 
              : "bg-red-500/10 border border-red-500/20 text-red-400"
          }`}>
            {message.text}
          </div>
        )}

        <div className="flex flex-col gap-2 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-amber-400 text-black font-black py-3 rounded-2xl text-xs tracking-wider uppercase flex items-center justify-center gap-2 hover:bg-amber-300 disabled:opacity-50 cursor-pointer shadow-[0_0_20px_rgba(251,191,36,0.15)]"
          >
            {isSaving ? (
              <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Publish & Score Standings</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSeedMockData}
            disabled={isSaving || isSeeding}
            className="w-full bg-blue-500/15 border border-blue-500/30 text-blue-400 font-black py-3 rounded-2xl text-xs tracking-wider uppercase flex items-center justify-center gap-2 hover:bg-blue-500/25 disabled:opacity-50 cursor-pointer transition-all active:scale-[0.99]"
          >
            {isSeeding ? (
              <span className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>🚀 Seed Famous & Fan Mock Predictions</span>
              </>
            )}
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleReset}
              disabled={isSaving}
              className="flex-1 bg-red-500/10 border border-red-500/20 text-red-400 font-bold py-2.5 px-3 rounded-xl text-[10px] tracking-wider uppercase flex items-center justify-center gap-1.5 hover:bg-red-500/20 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear Results</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/5 border border-white/10 text-gray-400 font-bold py-2.5 px-3 rounded-xl text-[10px] tracking-wider uppercase flex items-center justify-center hover:bg-white/10 hover:text-white transition-all cursor-pointer"
            >
              Close Editor
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

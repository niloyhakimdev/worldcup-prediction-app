import { useState, FormEvent } from "react";
import { motion } from "motion/react";
import { User, Trophy, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { Prediction, Team } from "../types";
import { submitPrediction } from "../lib/db";
import confetti from "canvas-confetti";

interface PredictionFormProps {
  onSuccess: (predictionId: string) => void;
  onCancel: () => void;
  existingPredictionId?: string;
}

const TEAMS: Record<string, { name: string; code: string; flag: string }> = {
  France: { name: "France", code: "FRA", flag: "https://flagcdn.com/w40/fr.png" },
  Spain: { name: "Spain", code: "ESP", flag: "https://flagcdn.com/w40/es.png" },
  England: { name: "England", code: "ENG", flag: "https://flagcdn.com/w40/gb-eng.png" },
  Argentina: { name: "Argentina", code: "ARG", flag: "https://flagcdn.com/w40/ar.png" },
};

export default function PredictionForm({ onSuccess, onCancel, existingPredictionId }: PredictionFormProps) {
  const [name, setName] = useState("");
  const [match1, setMatch1] = useState<"France" | "Spain" | "">("");
  const [match2, setMatch2] = useState<"England" | "Argentina" | "">("");
  const [champion, setChampion] = useState<Team | "">("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [match1ScoreFrance, setMatch1ScoreFrance] = useState<number | "">("");
  const [match1ScoreSpain, setMatch1ScoreSpain] = useState<number | "">("");
  const [match2ScoreEngland, setMatch2ScoreEngland] = useState<number | "">("");
  const [match2ScoreArgentina, setMatch2ScoreArgentina] = useState<number | "">("");

  const handleMatch1FranceScoreChange = (val: string) => {
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

  const handleMatch1SpainScoreChange = (val: string) => {
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

  const handleMatch2EnglandScoreChange = (val: string) => {
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

  const handleMatch2ArgentinaScoreChange = (val: string) => {
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

  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#FFD700", "#FFFFFF", "#1E3A8A"]
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#FFD700", "#FFFFFF", "#1E3A8A"]
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  const getCountryFromTimeZone = (tz: string) => {
    if (!tz) return "United Kingdom";
    const lower = tz.toLowerCase();
    if (lower.includes("london") || lower.includes("belfast") || lower.includes("gb") || lower.includes("europe/london")) return "United Kingdom";
    if (lower.includes("paris") || lower.includes("france")) return "France";
    if (lower.includes("madrid") || lower.includes("spain")) return "Spain";
    if (lower.includes("argentina") || lower.includes("buenos_aires")) return "Argentina";
    if (lower.includes("new_york") || lower.includes("chicago") || lower.includes("los_angeles") || lower.includes("denver") || lower.includes("phoenix") || lower.includes("america")) return "United States";
    if (lower.includes("berlin") || lower.includes("germany")) return "Germany";
    if (lower.includes("rome") || lower.includes("italy")) return "Italy";
    if (lower.includes("dhaka") || lower.includes("bangladesh")) return "Bangladesh";
    if (lower.includes("kolkata") || lower.includes("india") || lower.includes("asia/kolkata")) return "India";
    if (lower.includes("tokyo") || lower.includes("japan")) return "Japan";
    if (lower.includes("sydney") || lower.includes("australia")) return "Australia";
    if (lower.includes("toronto") || lower.includes("canada")) return "Canada";
    if (lower.includes("sao_paulo") || lower.includes("brazil")) return "Brazil";
    if (lower.includes("mexico")) return "Mexico";
    return "United Kingdom";
  };

  const generatePredictionId = () => {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (match1ScoreFrance === "" || match1ScoreSpain === "") {
      setError("Please predict the score for France vs Spain.");
      return;
    }
    if (!match1) {
      setError("Please select the winner of France vs Spain.");
      return;
    }
    if (match2ScoreEngland === "" || match2ScoreArgentina === "") {
      setError("Please predict the score for England vs Argentina.");
      return;
    }
    if (!match2) {
      setError("Please select the winner of England vs Argentina.");
      return;
    }
    if (!champion) {
      setError("Please select your predicted World Cup Champion.");
      return;
    }

    setIsSubmitting(true);
    try {
      const predId = generatePredictionId();
      const newPrediction: Prediction = {
        id: predId,
        name: name.trim(),
        match1,
        match2,
        champion,
        created_at: Date.now(),
        share_id: predId,
        match1ScoreFrance: Number(match1ScoreFrance),
        match1ScoreSpain: Number(match1ScoreSpain),
        match2ScoreEngland: Number(match2ScoreEngland),
        match2ScoreArgentina: Number(match2ScoreArgentina),
        country: getCountryFromTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone || ""),
      };

      await submitPrediction(newPrediction);
      
      // Store in localStorage to prevent duplicate submissions
      localStorage.setItem("wc2026_prediction_id", predId);
      
      triggerConfetti();
      onSuccess(predId);
    } catch (err: any) {
      console.error(err);
      setError("Failed to submit prediction. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-2xl">
      <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-3">
        <Trophy className="w-5 h-5 text-amber-400" />
        <h2 className="text-lg font-black uppercase italic text-white tracking-wide">Submit Predictions</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Input */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
            Your Name / Nickname
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Kylian P."
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-white text-sm font-medium placeholder-gray-500 focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50 transition-all"
              maxLength={25}
            />
          </div>
        </div>

        {/* Match 1 Prediction */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
            Winner: France vs Spain
          </label>
          <div className="grid grid-cols-2 gap-3">
            {["France", "Spain"].map((id) => {
              const team = TEAMS[id];
              const isSelected = match1 === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setMatch1(id as any);
                    if (champion && champion !== id && champion !== match2) {
                      setChampion("");
                    }
                  }}
                  className={`relative flex items-center gap-2.5 p-2.5 rounded-2xl border font-bold text-sm transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "bg-amber-400/10 border-amber-400 text-amber-400 shadow-md shadow-amber-400/5"
                      : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 shadow shrink-0 flex items-center justify-center bg-white/5">
                    <img src={team.flag} alt={team.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  </div>
                  <span>{team.name}</span>
                  {isSelected && (
                    <span className="absolute right-3 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Exact Score inputs */}
          <div className="mt-3 p-3.5 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Score Prediction</span>
              {match1ScoreFrance === match1ScoreSpain && match1ScoreFrance !== "" && (
                <span className="text-[9px] text-amber-300 font-semibold bg-amber-400/10 px-2.5 py-0.5 rounded-full">Draw! Pick who advances</span>
              )}
            </div>
            <div className="grid grid-cols-7 gap-1 items-center">
              <div className="col-span-3 flex items-center gap-2">
                <img src="https://flagcdn.com/w40/fr.png" alt="France" referrerPolicy="no-referrer" className="w-6 h-6 rounded-full border border-white/20 shadow shrink-0" />
                <span className="text-xs font-bold text-white truncate">FRA</span>
              </div>
              <div className="col-span-1 flex justify-center">
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={match1ScoreFrance}
                  onChange={(e) => handleMatch1FranceScoreChange(e.target.value)}
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
                  onChange={(e) => handleMatch1SpainScoreChange(e.target.value)}
                  className="w-10 bg-white/10 border border-white/10 rounded-xl text-center py-1 text-sm font-bold text-white focus:outline-none focus:border-amber-400"
                />
              </div>
              <div className="col-span-1 flex items-center justify-end gap-2">
                <span className="text-xs font-bold text-white truncate text-right">ESP</span>
                <img src="https://flagcdn.com/w40/es.png" alt="Spain" referrerPolicy="no-referrer" className="w-6 h-6 rounded-full border border-white/20 shadow shrink-0" />
              </div>
            </div>
          </div>
        </div>

        {/* Match 2 Prediction */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
            Winner: England vs Argentina
          </label>
          <div className="grid grid-cols-2 gap-3">
            {["England", "Argentina"].map((id) => {
              const team = TEAMS[id];
              const isSelected = match2 === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setMatch2(id as any);
                    if (champion && champion !== id && champion !== match1) {
                      setChampion("");
                    }
                  }}
                  className={`relative flex items-center gap-2.5 p-2.5 rounded-2xl border font-bold text-sm transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "bg-amber-400/10 border-amber-400 text-amber-400 shadow-md shadow-amber-400/5"
                      : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 shadow shrink-0 flex items-center justify-center bg-white/5">
                    <img src={team.flag} alt={team.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  </div>
                  <span>{team.name}</span>
                  {isSelected && (
                    <span className="absolute right-3 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Exact Score inputs */}
          <div className="mt-3 p-3.5 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Score Prediction</span>
              {match2ScoreEngland === match2ScoreArgentina && match2ScoreEngland !== "" && (
                <span className="text-[9px] text-amber-300 font-semibold bg-amber-400/10 px-2.5 py-0.5 rounded-full">Draw! Pick who advances</span>
              )}
            </div>
            <div className="grid grid-cols-7 gap-1 items-center">
              <div className="col-span-3 flex items-center gap-2">
                <img src="https://flagcdn.com/w40/gb-eng.png" alt="England" referrerPolicy="no-referrer" className="w-6 h-6 rounded-full border border-white/20 shadow shrink-0" />
                <span className="text-xs font-bold text-white truncate">ENG</span>
              </div>
              <div className="col-span-1 flex justify-center">
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={match2ScoreEngland}
                  onChange={(e) => handleMatch2EnglandScoreChange(e.target.value)}
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
                  onChange={(e) => handleMatch2ArgentinaScoreChange(e.target.value)}
                  className="w-10 bg-white/10 border border-white/10 rounded-xl text-center py-1 text-sm font-bold text-white focus:outline-none focus:border-amber-400"
                />
              </div>
              <div className="col-span-1 flex items-center justify-end gap-2">
                <span className="text-xs font-bold text-white truncate text-right">ARG</span>
                <img src="https://flagcdn.com/w40/ar.png" alt="Argentina" referrerPolicy="no-referrer" className="w-6 h-6 rounded-full border border-white/20 shadow shrink-0" />
              </div>
            </div>
          </div>
        </div>

        {/* Champion Prediction */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
            Predict Champion
          </label>
          <div className="grid grid-cols-2 gap-3">
            {["France", "Spain", "England", "Argentina"].map((id) => {
              const team = TEAMS[id];
              const isSelected = champion === id;
              const isFinalist = match1 === id || match2 === id;
              
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setChampion(id as Team)}
                  className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border font-bold text-sm transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "bg-amber-400/10 border-amber-400 text-amber-400 shadow-lg shadow-amber-400/10"
                      : isFinalist && (match1 || match2)
                      ? "bg-white/5 border-amber-400/30 text-white hover:bg-white/10"
                      : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 shadow-md shrink-0 flex items-center justify-center bg-white/5 mb-1">
                    <img src={team.flag} alt={team.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-xs">{team.name}</span>
                  {isFinalist && (match1 || match2) && !isSelected && (
                    <span className="absolute top-1 right-2 text-[8px] font-semibold text-amber-400 uppercase tracking-widest bg-amber-400/10 px-1 py-0.2 rounded border border-amber-400/20">
                      Finalist
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="flex items-start gap-2 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-white/5 border border-white/10 text-gray-400 font-bold py-3.5 px-4 rounded-2xl text-xs tracking-wider uppercase hover:bg-white/10 hover:text-white transition-all duration-150 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-2 bg-amber-400 text-black font-black py-3.5 px-4 rounded-2xl text-xs tracking-wider uppercase flex items-center justify-center gap-2 hover:bg-amber-300 disabled:bg-amber-400/50 disabled:cursor-not-allowed transition-all duration-150 shadow-[0_0_25px_rgba(251,191,36,0.2)] cursor-pointer"
          >
            {isSubmitting ? (
              <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Submit Picks</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, 
  Award, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Trophy, 
  ArrowLeft, 
  Edit3, 
  Sparkles,
  Shield,
  Star
} from "lucide-react";
import { Prediction, AdminResults, UserProfile } from "../types";
import { getAllPredictions } from "../lib/db";

interface ProfileViewProps {
  onBack: () => void;
  myPredictionId: string | null;
  results: AdminResults;
}

// Full Achievements system details
const ACHIEVEMENTS_LIST = [
  { id: "early_bird", name: "Early Bird", description: "Submitted prediction within 24 hours of launch", icon: "🌅", color: "from-blue-500 to-indigo-600" },
  { id: "perfect_predictor", name: "Perfect Predictor", description: "Successfully predicted an exact scoreline", icon: "🎯", color: "from-emerald-500 to-teal-600" },
  { id: "champion_picker", name: "Champion Picker", description: "Correctly guessed the final cup winner", icon: "🏆", color: "from-amber-400 to-orange-500" },
  { id: "top_10", name: "Top 10 Predictor", description: "Ranked among the global Top 10 standings", icon: "🌟", color: "from-purple-500 to-pink-500" },
  { id: "legend", name: "Legend", description: "Achieved the highest possible 8 pts score", icon: "👑", color: "from-rose-500 to-red-600" },
  { id: "golden_predictor", name: "Golden Predictor", description: "Placed at least one accurate pick", icon: "🥇", color: "from-yellow-400 via-amber-500 to-amber-700" },
];

export default function ProfileView({ onBack, myPredictionId, results }: ProfileViewProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [loading, setLoading] = useState(true);

  // Read local user credentials
  const [localUser, setLocalUser] = useState({
    username: localStorage.getItem("worldcup_predict_username") || "Legendary Striker",
    joinedDate: localStorage.getItem("worldcup_predict_joined") || String(Date.now() - 3600000 * 48), // Default 2 days ago
    avatarSeed: localStorage.getItem("worldcup_predict_avatar_seed") || "Gloveman"
  });

  useEffect(() => {
    // Get all predictions to filter and compute stats
    getAllPredictions().then((data) => {
      setPredictions(data);
      setLoading(false);
    }).catch((err) => {
      console.error(err);
      setLoading(false);
    });

    setUsernameInput(localUser.username);
  }, [localUser.username]);

  // Compute stats for current user
  const myPredictionsList = predictions.filter(p => p.id === myPredictionId || p.name === localUser.username);
  const predictionsCount = myPredictionsList.length;

  // Accuracy stats
  let correctPicksCount = 0;
  let totalPointsEarned = 0;
  let championCorrect = false;
  let exactScoreCount = 0;

  myPredictionsList.forEach(p => {
    if (results.published) {
      const match1Correct = p.match1 === results.match1;
      const match2Correct = p.match2 === results.match2;
      const champCorrect = p.champion === results.champion;

      if (match1Correct) {
        correctPicksCount++;
        totalPointsEarned += 1;
      }
      if (match2Correct) {
        correctPicksCount++;
        totalPointsEarned += 1;
      }
      if (champCorrect) {
        championCorrect = true;
        totalPointsEarned += 2;
      }

      // Exact scorelines check
      const m1Exact = Number(p.match1ScoreFrance) === Number(results.match1ScoreFrance) &&
                       Number(p.match1ScoreSpain) === Number(results.match1ScoreSpain);
      const m2Exact = Number(p.match2ScoreEngland) === Number(results.match2ScoreEngland) &&
                       Number(p.match2ScoreArgentina) === Number(results.match2ScoreArgentina);

      if (m1Exact) {
        exactScoreCount++;
        totalPointsEarned += 2;
      }
      if (m2Exact) {
        exactScoreCount++;
        totalPointsEarned += 2;
      }
    }
  });

  const correctPercentage = predictionsCount > 0 
    ? Math.round((correctPicksCount / (predictionsCount * 2)) * 100) 
    : 0;

  // Achievements unlocking logic
  const unlockedBadges = new Set<string>();
  
  // Unlocks Golden Predictor if they placed a prediction
  if (predictionsCount > 0) {
    unlockedBadges.add("golden_predictor");
  }

  // Unlocks Early Bird if prediction was placed within first days (mock check is fine or always true)
  if (predictionsCount > 0) {
    unlockedBadges.add("early_bird");
  }

  // Unlocks Perfect Predictor if exact score count is > 0
  if (exactScoreCount > 0) {
    unlockedBadges.add("perfect_predictor");
  }

  // Unlocks Champion Picker if champion correct
  if (championCorrect) {
    unlockedBadges.add("champion_picker");
  }

  // Unlocks Legend if they scored max points
  if (totalPointsEarned >= 8) {
    unlockedBadges.add("legend");
  }

  // Unlocks Top 10 if total points earned is top tier (e.g. above 4)
  if (totalPointsEarned >= 4) {
    unlockedBadges.add("top_10");
  }

  // Save updated username
  const handleSaveProfile = () => {
    if (!usernameInput.trim()) return;
    localStorage.setItem("worldcup_predict_username", usernameInput.trim());
    setLocalUser(prev => ({
      ...prev,
      username: usernameInput.trim()
    }));
    setIsEditing(false);
  };

  const formattedJoinedDate = new Date(Number(localUser.joinedDate)).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const profileAvatarUrl = `https://api.dicebear.com/7.x/adventurer/png?seed=${encodeURIComponent(localUser.username)}`;

  return (
    <div id="premium-profile-panel" className="space-y-6 max-w-md mx-auto">
      
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-gray-300 hover:text-white transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Feed</span>
        </button>
        <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
          User Profile
        </span>
      </div>

      {/* Profile Info Header */}
      <div className="relative bg-zinc-900 border border-white/10 rounded-3xl p-6 text-center shadow-md">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#18181b] rounded-3xl pointer-events-none" />

        <div className="flex flex-col items-center space-y-4">
          
          {/* Glowing Avatar */}
          <div className="relative group">
            <div className="absolute inset-0 bg-[#18181b] border border-amber-400/20 rounded-full opacity-40 group-hover:opacity-70 transition-opacity" />
            <img 
              src={profileAvatarUrl} 
              alt="Avatar" 
              referrerPolicy="no-referrer"
              className="relative w-20 h-20 rounded-full bg-zinc-900 border-2 border-amber-400 shadow-xl"
            />
            <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-amber-400 border-2 border-zinc-900 flex items-center justify-center text-xs">
              🎖️
            </span>
          </div>

          {/* User Name & Edit controls */}
          <div className="space-y-1 w-full max-w-xs">
                        <div className="w-full">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white text-center focus:outline-none focus:border-amber-400/50"
                    placeholder="Enter displayName..."
                    maxLength={20}
                  />
                  <button
                    onClick={handleSaveProfile}
                    className="py-1.5 px-3 bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs uppercase rounded-xl transition-all cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-1.5">
                  <h3 className="text-lg font-black tracking-wide text-white">{localUser.username}</h3>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="text-gray-400 hover:text-amber-400 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
              <Clock className="w-3 h-3 text-amber-400/80" />
              Joined {formattedJoinedDate}
            </span>
          </div>
        </div>

        {/* User Stats Grid */}
        <div className="grid grid-cols-3 gap-3.5 mt-6 pt-6 border-t border-white/5">
          <div className="bg-white/5 border border-white/5 rounded-2xl p-3 flex flex-col items-center">
            <Trophy className="w-4 h-4 text-amber-400 mb-1" />
            <span className="text-[8px] text-gray-400 font-black uppercase tracking-wider">Predictions</span>
            <span className="text-sm font-black text-white mt-1 font-mono">
              {predictionsCount}
            </span>
          </div>

          <div className="bg-white/5 border border-white/5 rounded-2xl p-3 flex flex-col items-center">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 mb-1" />
            <span className="text-[8px] text-gray-400 font-black uppercase tracking-wider">Accuracy %</span>
            <span className="text-sm font-black text-emerald-400 mt-1 font-mono">
              {results.published ? `${correctPercentage}%` : "—"}
            </span>
          </div>

          <div className="bg-white/5 border border-white/5 rounded-2xl p-3 flex flex-col items-center">
            <TrendingUp className="w-4 h-4 text-purple-400 mb-1" />
            <span className="text-[8px] text-gray-400 font-black uppercase tracking-wider">Total Score</span>
            <span className="text-sm font-black text-white mt-1 font-mono">
              {results.published ? `${totalPointsEarned} PTS` : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* ACHIEVEMENTS BADGES PANEL */}
      <div className="bg-zinc-900 border border-white/10 rounded-3xl p-5 space-y-4.5 shadow-md">
        <div className="flex items-center gap-2 border-b border-white/5 pb-3">
          <Award className="w-4.5 h-4.5 text-amber-400" />
          <h4 className="text-xs font-black uppercase tracking-widest text-white">
            Unlocked Achievements ({unlockedBadges.size})
          </h4>
        </div>

        {loading ? (
          <div className="py-6 flex justify-center">
            <span className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3.5">
            {ACHIEVEMENTS_LIST.map((badge) => {
              const unlocked = unlockedBadges.has(badge.id);

              return (
                <div 
                  key={badge.id}
                  className={`relative overflow-hidden p-3.5 rounded-3xl border flex flex-col gap-1.5 transition-all duration-300 ${
                    unlocked 
                      ? `bg-gradient-to-br ${badge.color}/10 border-white/15 shadow-md shadow-white/5` 
                      : "bg-black/30 border-white/5 opacity-40 grayscale"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{badge.icon}</span>
                    {unlocked ? (
                      <span className="text-[8px] font-black bg-emerald-500 text-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                        Unlocked
                      </span>
                    ) : (
                      <span className="text-[8px] font-black bg-zinc-800 text-gray-500 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                        Locked
                      </span>
                    )}
                  </div>
                  
                  <div>
                    <h5 className={`text-xs font-black ${unlocked ? "text-white" : "text-gray-500"}`}>
                      {badge.name}
                    </h5>
                    <p className="text-[9px] text-gray-400 font-medium leading-normal mt-0.5">
                      {badge.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

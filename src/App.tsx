import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Trophy, 
  Calendar, 
  Users, 
  Lock, 
  Settings, 
  ArrowRight, 
  Sparkles,
  TrophyIcon,
  ShieldCheck,
  ChevronRight,
  Eye,
  TrendingUp,
  Activity,
  Flame,
  Globe,
  MessageSquare,
  User,
  Bell
} from "lucide-react";
import { Prediction, AdminResults } from "./types";
import { getResults, getPredictionById } from "./lib/db";
import { db } from "./lib/firebase";
import { onSnapshot, collection, query, orderBy } from "firebase/firestore";

// Shared components
import Countdown from "./components/Countdown";
import MatchupCard from "./components/MatchupCard";
import PredictionForm from "./components/PredictionForm";
import ShareView from "./components/ShareView";
import Leaderboard from "./components/Leaderboard";
import AdminPanel from "./components/AdminPanel";

// Premium Social components
import PremiumHero from "./components/PremiumHero";
import CommunityFeed from "./components/CommunityFeed";
import DiscussionView from "./components/DiscussionView";
import ProfileView from "./components/ProfileView";
import TrendingCarousel from "./components/TrendingCarousel";

const PREDICTION_CLOSING_TIME = "2026-07-15T18:30:00Z";

const TEAMS: Record<string, { name: string; code: string; flag: string; emoji: string }> = {
  France: { name: "France", code: "FRA", flag: "https://flagcdn.com/w40/fr.png", emoji: "🇫🇷" },
  Spain: { name: "Spain", code: "ESP", flag: "https://flagcdn.com/w40/es.png", emoji: "🇪🇸" },
  England: { name: "England", code: "ENG", flag: "https://flagcdn.com/w40/gb-eng.png", emoji: "🏴" },
  Argentina: { name: "Argentina", code: "ARG", flag: "https://flagcdn.com/w40/ar.png", emoji: "🇦🇷" },
};

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 60000) return "Just now";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Preset live community notification items
const NOTIFICATION_TEMPLATES = [
  "⚽ GoalMaster just predicted a bold France 3-2 Spain!",
  "🏆 Spain currently leads the global fan champion vote with 42%!",
  "🎯 88% of UK predictors selected England to reach the finals!",
  "🔥 User 'WembleyKing' scored a Perfect Prediction in testing!",
  "👑 Argentina vs England has 1,240 active predictions logged!",
  "🌅 Early Bird achievement unlocked by 312 community predictors!",
];

export default function App() {
  // Views: "home" | "feed" | "leaderboard" | "profile" | "predict" | "discussion" | "admin" | "share"
  const [view, setView] = useState<"home" | "feed" | "leaderboard" | "profile" | "predict" | "discussion" | "admin" | "share">("home");
  const [results, setResults] = useState<AdminResults>({
    match1: "",
    match2: "",
    champion: "",
    published: false
  });

  const [selectedPrediction, setSelectedPrediction] = useState<Prediction | null>(null);
  const [myPredictionId, setMyPredictionId] = useState<string | null>(null);
  const [isPredictionClosed, setIsPredictionClosed] = useState(false);
  const [appLoading, setAppLoading] = useState(true);

  const [allPredictions, setAllPredictions] = useState<Prediction[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize display settings
  const [localUser, setLocalUser] = useState({
    username: localStorage.getItem("worldcup_predict_username") || "",
    avatarSeed: localStorage.getItem("worldcup_predict_avatar_seed") || ""
  });

  // Cycle real-time community notifications toasts
  useEffect(() => {
    const triggerNotification = () => {
      const randomText = NOTIFICATION_TEMPLATES[Math.floor(Math.random() * NOTIFICATION_TEMPLATES.length)];
      setToastMessage(randomText);
      setTimeout(() => {
        setToastMessage(null);
      }, 5000);
    };

    // Initial toast
    setTimeout(triggerNotification, 4000);
    const interval = setInterval(triggerNotification, 20000);
    return () => clearInterval(interval);
  }, []);

  // Listen to predictions real-time list
  useEffect(() => {
    const q = query(collection(db, "predictions"), orderBy("created_at", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Prediction[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Prediction);
      });
      setAllPredictions(list);
    }, (error) => {
      console.error("Error listening to predictions:", error);
    });
    return () => unsubscribe();
  }, []);

  // Check closing dates
  const checkPredictionClosed = () => {
    const isClosed = new Date() > new Date(PREDICTION_CLOSING_TIME);
    setIsPredictionClosed(isClosed);
  };

  useEffect(() => {
    checkPredictionClosed();
    const interval = setInterval(checkPredictionClosed, 10000);

    const initApp = async () => {
      try {
        const res = await getResults();
        setResults(res);

        // Resolve share parameters directly to detailed social Discussion page!
        const params = new URLSearchParams(window.location.search);
        const shareId = params.get("share") || params.get("p");
        
        if (shareId) {
          const prediction = await getPredictionById(shareId);
          if (prediction) {
            setSelectedPrediction(prediction);
            setView("discussion");
          }
        }

        // Set up local user details if not existing
        if (!localStorage.getItem("worldcup_predict_username")) {
          const generatedName = "Striker_" + Math.floor(Math.random() * 9000 + 1000);
          localStorage.setItem("worldcup_predict_username", generatedName);
          localStorage.setItem("worldcup_predict_joined", String(Date.now()));
        }

        const localId = localStorage.getItem("wc2026_prediction_id");
        if (localId) {
          setMyPredictionId(localId);
        }
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        setAppLoading(false);
      }
    };

    initApp();
    return () => clearInterval(interval);
  }, []);

  const handlePredictionSuccess = (predId: string) => {
    setMyPredictionId(predId);
    getPredictionById(predId).then((pred) => {
      if (pred) {
        setSelectedPrediction(pred);
        setView("discussion"); // Take them directly to the prediction page so they can start social debate!
      }
    });
  };

  const handleResultsUpdated = (newResults: AdminResults) => {
    setResults(newResults);
  };

  // Computations for fan champion vote
  const totalVotes = allPredictions.length;
  const votesMap = { France: 0, Spain: 0, England: 0, Argentina: 0 };
  allPredictions.forEach(p => {
    if (p.champion in votesMap) {
      votesMap[p.champion as keyof typeof votesMap]++;
    }
  });

  const voteStats = Object.keys(votesMap).map(teamKey => {
    const count = votesMap[teamKey as keyof typeof votesMap];
    const percent = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
    return { id: teamKey, name: teamKey, count, percent };
  }).sort((a, b) => b.percent - a.percent);

  // Compute popular picks stats
  let match1France = 0, match1Spain = 0, match2England = 0, match2Argentina = 0;
  allPredictions.forEach(p => {
    if (p.match1 === "France") match1France++;
    if (p.match1 === "Spain") match1Spain++;
    if (p.match2 === "England") match2England++;
    if (p.match2 === "Argentina") match2Argentina++;
  });

  const totalM1 = match1France + match1Spain;
  const totalM2 = match2England + match2Argentina;

  const pFrance = totalM1 > 0 ? Math.round((match1France / totalM1) * 100) : 0;
  const pSpain = totalM1 > 0 ? Math.round((match1Spain / totalM1) * 100) : 0;
  const pEngland = totalM2 > 0 ? Math.round((match2England / totalM2) * 100) : 0;
  const pArgentina = totalM2 > 0 ? Math.round((match2Argentina / totalM2) * 100) : 0;

  const winnerCandidates = [
    { name: "France", percent: pFrance },
    { name: "Spain", percent: pSpain },
    { name: "England", percent: pEngland },
    { name: "Argentina", percent: pArgentina }
  ];
  winnerCandidates.sort((a, b) => b.percent - a.percent);
  const mostPickedWinner = winnerCandidates[0]?.percent > 0 ? winnerCandidates[0] : { name: "Spain", percent: 64 };
  const mostPickedChampion = totalVotes > 0 && voteStats[0]?.percent > 0 ? { name: voteStats[0].name, percent: voteStats[0].percent } : { name: "Argentina", percent: 45 };

  const myPrediction = allPredictions.find(p => p.id === myPredictionId);

  if (appLoading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <Trophy className="w-10 h-10 text-amber-400 animate-pulse" />
            <div className="absolute inset-0 bg-amber-400/20 blur-xl rounded-full" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Loading FIFA Platform...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-amber-400/30 selection:text-white pb-32">
      {/* Cinematic Top Ambient Light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-96 bg-gradient-to-b from-amber-500/5 to-transparent blur-[120px] pointer-events-none z-0" />

      {/* Main Container */}
      <div className="max-w-md mx-auto px-4 pt-6 space-y-6 relative z-10">
        
        {/* Navigation/Brand Header */}
        <header className="flex items-center justify-between py-2 border-b border-white/5 pb-4">
          <div 
            onClick={() => { setView("home"); setSelectedPrediction(null); }} 
            className="cursor-pointer flex items-center gap-2.5"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center text-black font-extrabold shadow-lg shadow-amber-500/20">
              <Trophy className="w-4.5 h-4.5" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-tight uppercase italic text-white leading-none">FIFA WORLD CUP 2026</h1>
              <p className="text-[9px] text-amber-400 tracking-wider font-bold uppercase mt-1 leading-none">Social Predictor</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setView(view === "admin" ? "home" : "admin")}
              className={`p-2 rounded-xl border transition-all backdrop-blur-md cursor-pointer ${
                view === "admin"
                  ? "bg-amber-400 border-amber-400 text-black shadow-lg shadow-amber-400/20"
                  : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
              }`}
              title="Admin Panel"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Real-Time Live Activity Notification (Toasts) */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-400/20 rounded-2xl p-3.5 flex items-start gap-2.5 shadow-xl shadow-amber-500/5 backdrop-blur-md relative overflow-hidden"
            >
              <div className="w-6.5 h-6.5 rounded-full bg-amber-400/10 flex items-center justify-center text-amber-400 shrink-0">
                <Bell className="w-3.5 h-3.5 animate-bounce" />
              </div>
              <div className="text-[10px] text-gray-200 font-medium leading-relaxed flex-1">
                <span className="font-bold text-amber-300 uppercase tracking-wider block text-[8px] mb-0.5">Live Alert</span>
                {toastMessage}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* View Router */}
        <AnimatePresence mode="wait">
          
          {/* HOME VIEW */}
          {view === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Hanging Banner / Announcement */}
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
                className="relative overflow-hidden bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 border border-amber-400/30 rounded-3xl p-4 shadow-lg shadow-amber-500/10 backdrop-blur-md"
              >
                {/* Decorative background lights */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/10 blur-xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-yellow-400/5 blur-xl pointer-events-none" />
                
                {/* Content */}
                <div className="flex items-center gap-3.5 relative z-10">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center text-black font-extrabold shadow-md shadow-amber-400/20 shrink-0 animate-bounce">
                    <span className="text-lg">🎁</span>
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-[9px] font-black tracking-widest text-amber-400 uppercase">ধামাকা অফার!</span>
                    </div>
                    <h4 className="text-sm font-black text-white leading-snug">
                      সঠিক প্রেডিকশন করলেই বিজয়ী পাবেন <span className="text-amber-400 underline decoration-amber-400/50 underline-offset-2">৫০ টাকা</span> পুরস্কার! 💸
                    </h4>
                  </div>
                </div>

                {/* Hanging ribbons effect styling */}
                <div className="absolute top-0 left-8 w-[2px] h-2.5 bg-white/20" />
                <div className="absolute top-0 right-8 w-[2px] h-2.5 bg-white/20" />
              </motion.div>

              {/* Cinematic Premium Hero */}
              <PremiumHero 
                onPredictClick={() => setView("predict")} 
                onViewLeaderboardClick={() => setView("leaderboard")} 
                isClosed={isPredictionClosed} 
                closingTime={PREDICTION_CLOSING_TIME} 
              />

              {/* Trending Spotlight Carousel */}
              <TrendingCarousel 
                predictions={allPredictions}
                onSelectPrediction={(pred) => {
                  setSelectedPrediction(pred);
                  setView("discussion");
                }}
              />

              {/* MY ACTIVE PREDICTION CARD (Section 1) */}
              {myPredictionId && myPrediction && (
                <div 
                  id="active-my-prediction-card"
                  onClick={() => {
                    setSelectedPrediction(myPrediction);
                    setView("discussion");
                  }}
                  className="relative overflow-hidden bg-white/5 border border-amber-500/30 hover:border-amber-400 rounded-3xl p-5 shadow-xl shadow-amber-500/5 cursor-pointer transition-all duration-300 hover:scale-[1.01] group backdrop-blur-xl"
                >
                  <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-amber-400/10 blur-[25px] pointer-events-none group-hover:bg-amber-400/15 transition-all duration-300" />
                  
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">⚽</span>
                      <h4 className="text-xs font-black uppercase tracking-widest text-amber-400">My Prediction</h4>
                    </div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                      {myPrediction.created_at ? timeAgo(myPrediction.created_at) : "Active"}
                    </span>
                  </div>

                  <div className="py-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">User Name</span>
                      <span className="text-xs font-black text-white">{myPrediction.name}</span>
                    </div>

                    {/* Match 1 predicted */}
                    <div className="flex items-center justify-between text-xs bg-white/5 p-2 rounded-xl border border-white/5">
                      <div className="flex items-center gap-1.5 w-5/12">
                        <img src="https://flagcdn.com/w40/fr.png" alt="" referrerPolicy="no-referrer" className="w-4.5 h-4.5 rounded-full border border-white/10" />
                        <span className="font-bold text-gray-300">France</span>
                      </div>
                      <div className="flex items-center gap-1.5 justify-center w-2/12 font-mono font-black text-white bg-black/40 px-2 py-0.5 rounded border border-white/5">
                        <span>{myPrediction.match1ScoreFrance}</span>
                        <span className="text-gray-500 font-sans">-</span>
                        <span>{myPrediction.match1ScoreSpain}</span>
                      </div>
                      <div className="flex items-center gap-1.5 justify-end w-5/12 text-right">
                        <span className="font-bold text-gray-300">Spain</span>
                        <img src="https://flagcdn.com/w40/es.png" alt="" referrerPolicy="no-referrer" className="w-4.5 h-4.5 rounded-full border border-white/10" />
                      </div>
                    </div>

                    {/* Match 2 predicted */}
                    <div className="flex items-center justify-between text-xs bg-white/5 p-2 rounded-xl border border-white/5">
                      <div className="flex items-center gap-1.5 w-5/12">
                        <img src="https://flagcdn.com/w40/gb-eng.png" alt="" referrerPolicy="no-referrer" className="w-4.5 h-4.5 rounded-full border border-white/10" />
                        <span className="font-bold text-gray-300">England</span>
                      </div>
                      <div className="flex items-center gap-1.5 justify-center w-2/12 font-mono font-black text-white bg-black/40 px-2 py-0.5 rounded border border-white/5">
                        <span>{myPrediction.match2ScoreEngland}</span>
                        <span className="text-gray-500 font-sans">-</span>
                        <span>{myPrediction.match2ScoreArgentina}</span>
                      </div>
                      <div className="flex items-center gap-1.5 justify-end w-5/12 text-right">
                        <span className="font-bold text-gray-300">Argentina</span>
                        <img src="https://flagcdn.com/w40/ar.png" alt="" referrerPolicy="no-referrer" className="w-4.5 h-4.5 rounded-full border border-white/10" />
                      </div>
                    </div>

                    {/* Champion */}
                    <div className="flex items-center justify-between border-t border-white/5 pt-3">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Champion</span>
                      <div className="flex items-center gap-1.5 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-full text-amber-400 text-[10px] font-black uppercase tracking-wide">
                        {TEAMS[myPrediction.champion] && (
                          <img src={TEAMS[myPrediction.champion].flag} alt="" referrerPolicy="no-referrer" className="w-4 h-4 rounded-full border border-amber-400/20" />
                        )}
                        <span>{myPrediction.champion}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">
                        {results.published ? `🟢 Scored: ${myPrediction.score ?? 0} PTS` : "🟡 Waiting for matches"}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5 text-[10px] font-black text-white uppercase group-hover:text-amber-400 transition-colors">
                      <span>View Details</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              )}

              {/* Matchups list overview */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Matchups</h3>
                <MatchupCard 
                  team1="France" 
                  team2="Spain" 
                  winner={results.published ? results.match1 : undefined}
                  statusText="Semi Final 1 • July 15, 2026"
                />
                <MatchupCard 
                  team1="England" 
                  team2="Argentina" 
                  winner={results.published ? results.match2 : undefined}
                  statusText="Semi Final 2 • July 15, 2026"
                />
              </div>

              {/* FAN CHAMPION VOTING (Section 2) */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-5 space-y-4 backdrop-blur-md">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <TrophyIcon className="w-4 h-4 text-amber-400" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-white">Fan Champion Prediction</h3>
                  </div>
                  <span className="text-[9px] font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20 uppercase tracking-wider">
                    Live Votes
                  </span>
                </div>

                <div className="space-y-3.5">
                  {voteStats.map((stat) => {
                    const team = TEAMS[stat.name];
                    return (
                      <div key={stat.id} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img src={team.flag} alt="" referrerPolicy="no-referrer" className="w-5 h-5 rounded-full border border-white/15" />
                            <span className="text-xs font-bold text-white">{stat.name}</span>
                          </div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xs font-black text-amber-400 font-mono">{stat.percent}%</span>
                            <span className="text-[9px] text-gray-500 font-bold">{stat.count} Votes</span>
                          </div>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${stat.percent}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* POPULAR PICKS STATS */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-5 space-y-4 backdrop-blur-md">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-amber-400" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-white">Popular Picks</h3>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-3 flex flex-col justify-between h-24">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Most Picked Winner</span>
                    <div className="mt-1">
                      <div className="flex items-center gap-1.5">
                        {TEAMS[mostPickedWinner.name]?.flag && (
                          <img src={TEAMS[mostPickedWinner.name].flag} alt="" referrerPolicy="no-referrer" className="w-4 h-4 rounded-full border border-white/10" />
                        )}
                        <span className="text-xs font-black text-white truncate">{mostPickedWinner.name}</span>
                      </div>
                      <span className="text-base font-black text-amber-400 mt-1 block font-mono">{mostPickedWinner.percent}%</span>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/5 rounded-2xl p-3 flex flex-col justify-between h-24">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Most Picked Champ</span>
                    <div className="mt-1">
                      <div className="flex items-center gap-1.5">
                        {TEAMS[mostPickedChampion.name]?.flag && (
                          <img src={TEAMS[mostPickedChampion.name].flag} alt="" referrerPolicy="no-referrer" className="w-4 h-4 rounded-full border border-white/10" />
                        )}
                        <span className="text-xs font-black text-white truncate">{mostPickedChampion.name}</span>
                      </div>
                      <span className="text-base font-black text-amber-400 mt-1 block font-mono">{mostPickedChampion.percent}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* COMMUNITY FEED VIEW */}
          {view === "feed" && (
            <motion.div
              key="feed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <CommunityFeed 
                onSelectPrediction={(pred) => {
                  setSelectedPrediction(pred);
                  setView("discussion");
                }}
                myPredictionId={myPredictionId}
              />
            </motion.div>
          )}

          {/* STANDINGS/LEADERBOARD VIEW */}
          {view === "leaderboard" && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Leaderboard 
                onViewPrediction={(id) => {
                  getPredictionById(id).then((pred) => {
                    if (pred) {
                      setSelectedPrediction(pred);
                      setView("discussion");
                    }
                  });
                }}
                results={results}
              />
            </motion.div>
          )}

          {/* PROFILE VIEW */}
          {view === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <ProfileView 
                onBack={() => setView("home")}
                myPredictionId={myPredictionId}
                results={results}
              />
            </motion.div>
          )}

          {/* DETAILED DISCUSSION BOARD VIEW */}
          {view === "discussion" && selectedPrediction && (
            <motion.div
              key="discussion"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <DiscussionView 
                prediction={selectedPrediction}
                onBack={() => {
                  setView("feed");
                  setSelectedPrediction(null);
                  const url = new URL(window.location.href);
                  url.searchParams.delete("share");
                  url.searchParams.delete("p");
                  window.history.replaceState({}, document.title, url.toString());
                }}
                myPredictionId={myPredictionId}
                results={results}
              />
            </motion.div>
          )}

          {/* PREDICTION FORM VIEW */}
          {view === "predict" && (
            <motion.div
              key="predict"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <PredictionForm
                onSuccess={handlePredictionSuccess}
                onCancel={() => setView("home")}
                existingPredictionId={myPredictionId || undefined}
              />
            </motion.div>
          )}

          {/* ADMIN PANEL VIEW */}
          {view === "admin" && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <AdminPanel
                onResultsUpdated={handleResultsUpdated}
                onClose={() => setView("home")}
              />
            </motion.div>
          )}

        </AnimatePresence>

        {/* BOTTOM NAVIGATION BAR */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-black/90 border-t border-white/10 px-6 py-3 flex items-center justify-between backdrop-blur-lg z-50 rounded-t-[1.5rem] shadow-[0_-10px_25px_rgba(0,0,0,0.5)]">
          <button 
            onClick={() => { setView("home"); setSelectedPrediction(null); }}
            className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${view === "home" ? "text-amber-400 font-extrabold scale-105" : "text-gray-400 hover:text-white"}`}
          >
            <Globe className="w-5 h-5" />
            <span className="text-[9px] uppercase tracking-wider font-bold">Home</span>
          </button>

          <button 
            onClick={() => { setView("feed"); setSelectedPrediction(null); }}
            className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${view === "feed" ? "text-amber-400 font-extrabold scale-105" : "text-gray-400 hover:text-white"}`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-[9px] uppercase tracking-wider font-bold">Feed</span>
          </button>

          <button 
            onClick={() => { setView("leaderboard"); setSelectedPrediction(null); }}
            className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${view === "leaderboard" ? "text-amber-400 font-extrabold scale-105" : "text-gray-400 hover:text-white"}`}
          >
            <Trophy className="w-5 h-5" />
            <span className="text-[9px] uppercase tracking-wider font-bold">Standings</span>
          </button>

          <button 
            onClick={() => { setView("profile"); setSelectedPrediction(null); }}
            className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${view === "profile" ? "text-amber-400 font-extrabold scale-105" : "text-gray-400 hover:text-white"}`}
          >
            <User className="w-5 h-5" />
            <span className="text-[9px] uppercase tracking-wider font-bold">Profile</span>
          </button>
        </nav>

      </div>
    </div>
  );
}

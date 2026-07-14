import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Flame, 
  Search, 
  MessageSquare, 
  ThumbsUp, 
  CheckCircle, 
  Clock, 
  ChevronRight,
  Filter,
  SlidersHorizontal,
  ChevronDown
} from "lucide-react";
import { Prediction } from "../types";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";

interface CommunityFeedProps {
  onSelectPrediction: (prediction: Prediction) => void;
  myPredictionId: string | null;
}

const TEAMS: Record<string, { name: string; flag: string }> = {
  France: { name: "France", flag: "/flags/france.svg" },
  Spain: { name: "Spain", flag: "/flags/spain.svg" },
  England: { name: "England", flag: "/flags/england.svg" },
  Argentina: { name: "Argentina", flag: "/flags/argentina.svg" },
};

export default function CommunityFeed({ onSelectPrediction, myPredictionId }: CommunityFeedProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterChampion, setFilterChampion] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"newest" | "likes" | "comments">("newest");
  const [visibleCount, setVisibleCount] = useState(5);

  // Load predictions and set up Real-time updates with Firestore
  useEffect(() => {
    const predictionsRef = collection(db, "predictions");
    const q = query(predictionsRef, orderBy("created_at", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Prediction[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({ id: docSnap.id, ...data } as Prediction);
      });
      setPredictions(list);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to predictions: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Helper to compute relative time
  const timeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);

    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hrs < 24) return `${hrs}h ago`;
    return `${days}d ago`;
  };

  // Filter and sort predictions
  const filteredPredictions = predictions
    .filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterChampion === "All" || p.champion === filterChampion;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (sortBy === "likes") {
        return (b.likes_count || 0) - (a.likes_count || 0);
      }
      if (sortBy === "comments") {
        return (b.comments_count || 0) - (a.comments_count || 0);
      }
      return b.created_at - a.created_at; // newest
    });

  const hasMore = filteredPredictions.length > visibleCount;

  return (
    <div id="community-predictions-feed" className="space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
            <h3 className="text-sm font-black uppercase tracking-widest text-white">🔥 Community Predictions</h3>
          </div>
          <span className="text-[10px] bg-white/5 border border-white/10 px-2.5 py-1 rounded-full text-gray-400 font-bold uppercase tracking-wider">
            Total: {predictions.length}
          </span>
        </div>

        {/* Search, Filter, Sort Controls */}
        <div className="space-y-2 bg-white/5 border border-white/10 p-3.5 rounded-2xl backdrop-blur-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search fans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/5 rounded-xl py-2 pl-9 pr-3 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-amber-400/40 transition-all"
            />
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            {/* Filter by Champion */}
            <div className="flex items-center gap-1">
              <Filter className="w-3 h-3 text-amber-400/80" />
              <select
                value={filterChampion}
                onChange={(e) => setFilterChampion(e.target.value)}
                className="bg-transparent text-[10px] font-bold text-gray-300 focus:outline-none cursor-pointer uppercase tracking-wider"
              >
                <option value="All">All Champions</option>
                <option value="France">France</option>
                <option value="Spain">Spain</option>
                <option value="England">England</option>
                <option value="Argentina">Argentina</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3 text-amber-400/80" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-[10px] font-bold text-gray-300 focus:outline-none cursor-pointer uppercase tracking-wider"
              >
                <option value="newest">Newest First</option>
                <option value="likes">Most Liked</option>
                <option value="comments">Most Active</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Feed list */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3">
          <span className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Syncing social feed...</span>
        </div>
      ) : filteredPredictions.length === 0 ? (
        <div className="py-12 text-center bg-white/2 border border-white/5 rounded-2xl">
          <MessageSquare className="w-8 h-8 text-gray-600 mx-auto mb-2" />
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
            {searchQuery || filterChampion !== "All" ? "No matches found" : "No predictions submitted yet!"}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          <AnimatePresence initial={false}>
            {filteredPredictions.slice(0, visibleCount).map((pred) => {
              const userAvatarSeed = encodeURIComponent(pred.name);
              const avatarUrl = pred.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${userAvatarSeed}`;
              const isUserOwn = pred.id === myPredictionId;

              return (
                <motion.div
                  key={pred.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  onClick={() => onSelectPrediction(pred)}
                  className={`group relative overflow-hidden bg-white/5 hover:bg-white/10 border rounded-3xl p-4.5 transition-all duration-300 cursor-pointer flex flex-col gap-3.5 backdrop-blur-xl ${
                    isUserOwn 
                      ? "border-amber-400/30 shadow-lg shadow-amber-500/5 bg-gradient-to-br from-amber-400/5 to-transparent" 
                      : "border-white/5 hover:border-amber-400/25"
                  }`}
                >
                  {/* Highlight card subtle gradient for owns */}
                  {isUserOwn && (
                    <div className="absolute top-0 right-0 bg-amber-400 text-black text-[8px] font-black uppercase tracking-wider px-2.5 py-1 rounded-bl-xl border-l border-b border-amber-400/20">
                      My Prediction
                    </div>
                  )}

                  {/* Header: User Profile */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img 
                        src={avatarUrl} 
                        alt="" 
                        referrerPolicy="no-referrer"
                        className="w-7 h-7 rounded-full bg-white/10 border border-white/10 shadow-sm shrink-0" 
                      />
                      <div>
                        <span className="text-xs font-black text-white block group-hover:text-amber-300 transition-colors">
                          {pred.name}
                        </span>
                        <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {timeAgo(pred.created_at)}
                        </span>
                      </div>
                    </div>
                    
                    {/* View Details arrow */}
                    <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                  </div>

                  {/* Body: Predicted Scores row */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-black/40 p-3 rounded-2xl border border-white/5">
                    {/* France vs Spain */}
                    <div className="flex items-center justify-between gap-2 border-r border-white/5 pr-3">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <img src="/flags/france.svg" alt="" referrerPolicy="no-referrer" className="w-4 h-4 rounded-full border border-white/10 shrink-0" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase truncate">FRA</span>
                      </div>
                      <span className="font-mono font-black text-white">
                        {pred.match1ScoreFrance}-{pred.match1ScoreSpain}
                      </span>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[10px] font-bold text-gray-400 uppercase truncate">ESP</span>
                        <img src="/flags/spain.svg" alt="" referrerPolicy="no-referrer" className="w-4 h-4 rounded-full border border-white/10 shrink-0" />
                      </div>
                    </div>

                    {/* England vs Argentina */}
                    <div className="flex items-center justify-between gap-2 pl-3">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <img src="/flags/england.svg" alt="" referrerPolicy="no-referrer" className="w-4 h-4 rounded-full border border-white/10 shrink-0" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase truncate">ENG</span>
                      </div>
                      <span className="font-mono font-black text-white">
                        {pred.match2ScoreEngland}-{pred.match2ScoreArgentina}
                      </span>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[10px] font-bold text-gray-400 uppercase truncate">ARG</span>
                        <img src="/flags/argentina.svg" alt="" referrerPolicy="no-referrer" className="w-4 h-4 rounded-full border border-white/10 shrink-0" />
                      </div>
                    </div>
                  </div>

                  {/* Row: Champion & Metrics */}
                  <div className="flex items-center justify-between border-t border-white/5 pt-3 text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Champion Pick</span>
                      <div className="flex items-center gap-1 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full text-amber-400 font-extrabold text-[9px] uppercase tracking-wide">
                        {TEAMS[pred.champion] && (
                          <img src={TEAMS[pred.champion].flag} alt="" referrerPolicy="no-referrer" className="w-3.5 h-3.5 rounded-full border border-amber-400/20 shrink-0" />
                        )}
                        <span>{pred.champion}</span>
                      </div>
                    </div>

                    {/* Likes, Comments, Agrees Metrics */}
                    <div className="flex items-center gap-3 text-gray-400">
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3 text-amber-400" />
                        <span className="font-mono font-bold">{pred.likes_count ?? 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 text-amber-400" />
                        <span className="font-mono font-bold">{pred.comments_count ?? 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-amber-400" />
                        <span className="font-mono font-bold">{pred.agrees_count ?? 0}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Infinite Load More */}
          {hasMore && (
            <button
              onClick={() => setVisibleCount((prev) => prev + 5)}
              className="w-full py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all cursor-pointer text-center"
            >
              Load More Predictions
            </button>
          )}
        </div>
      )}
    </div>
  );
}

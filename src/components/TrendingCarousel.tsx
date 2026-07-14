import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trophy, ThumbsUp, MessageSquare, Flame, Sparkles, ChevronRight } from "lucide-react";
import { Prediction, Comment } from "../types";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

interface TrendingCarouselProps {
  predictions: Prediction[];
  onSelectPrediction: (prediction: Prediction) => void;
}

const TEAMS: Record<string, { name: string; flag: string }> = {
  France: { name: "France", flag: "https://flagcdn.com/w40/fr.png" },
  Spain: { name: "Spain", flag: "https://flagcdn.com/w40/es.png" },
  England: { name: "England", flag: "https://flagcdn.com/w40/gb-eng.png" },
  Argentina: { name: "Argentina", flag: "https://flagcdn.com/w40/ar.png" },
};

export default function TrendingCarousel({ predictions, onSelectPrediction }: TrendingCarouselProps) {
  const [trendingComments, setTrendingComments] = useState<Comment[]>([]);
  const [predIndex, setPredIndex] = useState(0);
  const [commentIndex, setCommentIndex] = useState(0);

  // Fetch top 5 liked comments from Firestore
  useEffect(() => {
    const commentsRef = collection(db, "comments");
    const q = query(commentsRef, orderBy("likes", "desc"), limit(5));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Comment[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Comment);
      });
      setTrendingComments(list);
    }, (error) => {
      console.error("Error fetching trending comments:", error);
    });

    return () => unsubscribe();
  }, []);

  // Filter top 5 predictions by popularity (likes + agrees + comments count)
  const popularPredictions = [...predictions]
    .sort((a, b) => {
      const scoreA = (a.likes_count || 0) + (a.agrees_count || 0) + (a.comments_count || 0);
      const scoreB = (b.likes_count || 0) + (b.agrees_count || 0) + (b.comments_count || 0);
      return scoreB - scoreA;
    })
    .slice(0, 5);

  // Auto-slide predictions every 4.5 seconds
  useEffect(() => {
    if (popularPredictions.length <= 1) return;
    const interval = setInterval(() => {
      setPredIndex((prev) => (prev + 1) % popularPredictions.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [popularPredictions.length]);

  // Auto-slide comments every 4.5 seconds (staggered slightly from predictions)
  useEffect(() => {
    if (trendingComments.length <= 1) return;
    const interval = setInterval(() => {
      setCommentIndex((prev) => (prev + 1) % trendingComments.length);
    }, 4800);
    return () => clearInterval(interval);
  }, [trendingComments.length]);

  const activePred = popularPredictions[predIndex];
  const activeComment = trendingComments[commentIndex];

  return (
    <div className="space-y-4">
      {/* 1. POPULAR PREDICTIONS SPOTLIGHT */}
      {activePred && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Popular Prediction</span>
            </div>
            <div className="flex gap-1">
              {popularPredictions.map((_, i) => (
                <div 
                  key={i} 
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    i === predIndex ? "bg-amber-400 w-3" : "bg-white/10"
                  }`} 
                />
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activePred.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
              onClick={() => onSelectPrediction(activePred)}
              className="bg-gradient-to-r from-amber-500/10 to-yellow-500/5 border border-amber-400/20 hover:border-amber-400/40 rounded-3xl p-4.5 cursor-pointer  relative overflow-hidden transition-all duration-300 group"
            >
              {/* Background ambient light */}
              <div className="absolute -right-6 -top-6 w-16 h-16 bg-amber-400/10 blur-[20px] pointer-events-none" />

              <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                <div className="flex items-center gap-2">
                  <img 
                    src={activePred.avatar || `https://api.dicebear.com/7.x/adventurer/png?seed=${encodeURIComponent(activePred.name)}`}
                    alt="" 
                    className="w-6.5 h-6.5 rounded-full bg-white/5 border border-white/10 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h4 className="text-xs font-black text-white group-hover:text-amber-400 transition-colors flex items-center gap-1">
                      {activePred.name}
                      <span className="text-[9px] text-amber-400 font-bold">🔥 Top Pick</span>
                    </h4>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[9px] font-black text-amber-400 uppercase">
                  <span>View Debate</span>
                  <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Prediction row */}
              <div className="grid grid-cols-2 gap-2 text-[11px] py-3">
                {/* France vs Spain */}
                <div className="flex items-center justify-between gap-1.5 border-r border-white/5 pr-2.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <img src="https://flagcdn.com/w40/fr.png" alt="" className="w-3.5 h-3.5 rounded-full" />
                    <span className="font-bold text-gray-400 truncate">FRA</span>
                  </div>
                  <span className="font-mono font-black text-white bg-black/35 px-1.5 py-0.5 rounded border border-white/5">
                    {activePred.match1ScoreFrance}-{activePred.match1ScoreSpain}
                  </span>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-bold text-gray-400 truncate">ESP</span>
                    <img src="https://flagcdn.com/w40/es.png" alt="" className="w-3.5 h-3.5 rounded-full" />
                  </div>
                </div>

                {/* England vs Argentina */}
                <div className="flex items-center justify-between gap-1.5 pl-2.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <img src="https://flagcdn.com/w40/gb-eng.png" alt="" className="w-3.5 h-3.5 rounded-full" />
                    <span className="font-bold text-gray-400 truncate">ENG</span>
                  </div>
                  <span className="font-mono font-black text-white bg-black/35 px-1.5 py-0.5 rounded border border-white/5">
                    {activePred.match2ScoreEngland}-{activePred.match2ScoreArgentina}
                  </span>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-bold text-gray-400 truncate">ARG</span>
                    <img src="https://flagcdn.com/w40/ar.png" alt="" className="w-3.5 h-3.5 rounded-full" />
                  </div>
                </div>
              </div>

              {/* Champion & stats */}
              <div className="flex items-center justify-between border-t border-white/5 pt-2.5 text-[9px]">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-gray-400 uppercase tracking-wide">Champion:</span>
                  <span className="flex items-center gap-1 text-amber-400 font-extrabold uppercase bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                    {TEAMS[activePred.champion] && (
                      <img src={TEAMS[activePred.champion].flag} alt="" className="w-3 h-3 rounded-full" />
                    )}
                    {activePred.champion}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-gray-400">
                  <span className="flex items-center gap-0.5"><ThumbsUp className="w-3 h-3 text-amber-400" /> {activePred.likes_count ?? 0}</span>
                  <span className="flex items-center gap-0.5"><MessageSquare className="w-3 h-3 text-amber-400" /> {activePred.comments_count ?? 0}</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* 2. TRENDING DEBATES (COMMENTS) */}
      {activeComment && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Hot Fan Debate</span>
            </div>
            <div className="flex gap-1">
              {trendingComments.map((_, i) => (
                <div 
                  key={i} 
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    i === commentIndex ? "bg-amber-400 w-3" : "bg-white/10"
                  }`} 
                />
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeComment.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              onClick={async () => {
                // Find matching prediction object in predictions list and select it
                const matchPred = predictions.find(p => p.id === activeComment.predictionId);
                if (matchPred) onSelectPrediction(matchPred);
              }}
              className="bg-white/5 border border-white/10 hover:border-amber-400/25 rounded-3xl p-4 cursor-pointer  flex flex-col gap-2.5 transition-all duration-300 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img 
                    src={activeComment.avatar} 
                    alt="" 
                    className="w-6 h-6 rounded-full bg-white/5 border border-white/10 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <span className="text-xs font-black text-white group-hover:text-amber-300 transition-colors block">
                      {activeComment.username}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[9px] text-gray-400 uppercase font-black">
                  <span className="flex items-center gap-0.5"><ThumbsUp className="w-3 h-3 text-amber-400 fill-amber-400/10" /> {activeComment.likes} Likes</span>
                </div>
              </div>

              {/* Comment text */}
              <p className="text-[11px] text-gray-300 italic pl-8 font-medium leading-relaxed select-none">
                "{activeComment.text.length > 80 ? activeComment.text.slice(0, 80) + "..." : activeComment.text}"
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

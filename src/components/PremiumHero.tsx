import React from "react";
import { motion } from "motion/react";
import { Trophy, Sparkles, Calendar, ArrowRight, Award } from "lucide-react";
import Countdown from "./Countdown";
import PremiumLogo from "./PremiumLogo";

interface PremiumHeroProps {
  onPredictClick: () => void;
  onViewLeaderboardClick: () => void;
  isClosed: boolean;
  closingTime: string;
}

export default function PremiumHero({
  onPredictClick,
  onViewLeaderboardClick,
  isClosed,
  closingTime
}: PremiumHeroProps) {
  return (
    <div id="premium-hero-container" className="relative w-full rounded-[2.5rem] overflow-hidden border border-white/10 bg-black shadow-2xl">
      {/* Background Video Layer */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover scale-105 select-none"
          preload="auto"
          poster="https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=1200"
        >
          <source
            src="https://assets.mixkit.co/videos/preview/mixkit-soccer-stadium-with-floodlights-at-night-42293-large.mp4"
            type="video/mp4"
          />
        </video>
        {/* Dark Cinematic Overlays */}
        <div className="absolute inset-0 bg-black/75 z-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90 z-20" />
      </div>

      {/* Floating Sparkles & Light Beams */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none z-10" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-400/5 rounded-full blur-[100px] pointer-events-none z-10" />

      {/* Interactive Content Container */}
      <div className="relative z-30 px-6 py-10 md:py-14 flex flex-col items-center text-center space-y-6">
        
        {/* Tournament Brand Logo (FIFA-style SVG) */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-2"
        >
          <PremiumLogo />
        </motion.div>

        {/* Cinematic Title/Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex flex-col items-center gap-2.5"
        >
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-400/30 text-[10px] font-black uppercase tracking-widest text-amber-300 shadow-lg shadow-amber-500/5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: "12s" }} />
            🏆 FIFA WORLD CUP 2026
          </span>
          
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase italic leading-none max-w-sm">
            SEMI FINAL PREDICTION
          </h2>
        </motion.div>

        {/* Engaging Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xs text-gray-300 font-medium max-w-xs leading-relaxed"
        >
          Predict before kickoff. Compete with football fans around the world. Become the ultimate football predictor.
        </motion.p>

        {/* Large Countdown Timer */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="w-full max-w-xs pt-4 border-t border-white/10 flex flex-col items-center"
        >
          <Countdown targetDate={closingTime} onExpire={() => {}} />
        </motion.div>

        {/* High-Impact CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-md pt-6"
        >
          {isClosed ? (
            <div className="w-full flex items-center justify-center gap-2 py-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-black text-gray-400 uppercase tracking-widest">
              <span>🔒 Prediction period has closed</span>
            </div>
          ) : (
            <button
              onClick={onPredictClick}
              className="flex-1 py-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-xs tracking-widest uppercase rounded-2xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] duration-200 shadow-[0_0_30px_rgba(245,158,11,0.3)] cursor-pointer"
            >
              <span>Predict Now</span>
              <ArrowRight className="w-4 h-4 text-black stroke-[3]" />
            </button>
          )}

          <button
            onClick={onViewLeaderboardClick}
            className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black text-xs tracking-widest uppercase rounded-2xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] duration-200  cursor-pointer"
          >
            <Award className="w-4 h-4 text-amber-400" />
            <span>Leaderboard</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
}

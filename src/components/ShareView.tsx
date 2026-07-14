import { useState } from "react";
import { motion } from "motion/react";
import { 
  Copy, 
  Check, 
  Send, 
  Facebook, 
  Twitter, 
  Share2, 
  Trophy, 
  ArrowLeft,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { Prediction } from "../types";

interface ShareViewProps {
  prediction: Prediction;
  onBackToHome: () => void;
  isOwner?: boolean; // True if this prediction was just submitted by the current user
}

const TEAMS: Record<string, { name: string; flag: string }> = {
  France: { name: "France", flag: "https://flagcdn.com/w40/fr.png" },
  Spain: { name: "Spain", flag: "https://flagcdn.com/w40/es.png" },
  England: { name: "England", flag: "https://flagcdn.com/w40/gb-eng.png" },
  Argentina: { name: "Argentina", flag: "https://flagcdn.com/w40/ar.png" },
};

export default function ShareView({ prediction, onBackToHome, isOwner = false }: ShareViewProps) {
  const [copied, setCopied] = useState(false);

  // Generate the full dynamic shareable link
  const shareUrl = `${window.location.origin}${window.location.pathname}?share=${prediction.id}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getShareText = () => {
    const emojis: Record<string, string> = {
      France: "🇫🇷",
      Spain: "🇪🇸",
      England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
      Argentina: "🇦🇷"
    };
    const p1 = emojis[prediction.match1] || "";
    const p2 = emojis[prediction.match2] || "";
    const pC = emojis[prediction.champion] || "";
    
    const m1Score = prediction.match1ScoreFrance !== undefined 
      ? ` (${prediction.match1ScoreFrance}-${prediction.match1ScoreSpain})` 
      : "";
    const m2Score = prediction.match2ScoreEngland !== undefined 
      ? ` (${prediction.match2ScoreEngland}-${prediction.match2ScoreArgentina})` 
      : "";

    return `🏆 My World Cup 2026 Semi Finals Predictions:\n⚽ France vs Spain: ${prediction.match1}${m1Score} ${p1}\n⚽ England vs Argentina: ${prediction.match2}${m2Score} ${p2}\n⭐ Champion: ${prediction.champion} ${pC}\n\nPredict yours here:`;
  };

  const shareToWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${getShareText()}\n${shareUrl}`)}`;
    window.open(url, "_blank");
  };

  const shareToX = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(getShareText())}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank");
  };

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank");
  };

  const formattedDate = new Date(prediction.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short"
  });

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Header back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToHome}
          className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Home</span>
        </button>
        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
          Prediction Details
        </span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden bg-white/5 border border-white/10 rounded-3xl p-6  shadow-2xl"
      >
        {/* Visual highlight */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full" />

        {isOwner && (
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 animate-bounce">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-emerald-400">Prediction Submitted!</h3>
            <p className="text-xs text-gray-400 mt-1">Your lock-in is confirmed for World Cup 2026</p>
          </div>
        )}

        {/* User Info */}
        <div className="border-b border-white/10 pb-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Predictor</span>
              <h4 className="text-lg font-extrabold text-white tracking-wide mt-0.5">
                {prediction.name}
              </h4>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">ID</span>
              <p className="text-xs font-mono text-amber-400 font-bold mt-0.5">{prediction.id}</p>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 font-medium mt-2">
            Submitted: {formattedDate}
          </p>
        </div>

        {/* Predictions breakdown */}
        <div className="space-y-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Predictions Selected</span>

          {/* Match 1 */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 uppercase font-semibold">France vs Spain</span>
              <span className="text-sm font-bold text-white mt-1">Winner Match 1</span>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                {TEAMS[prediction.match1]?.flag && (
                  <img
                    src={TEAMS[prediction.match1].flag}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-5 h-5 rounded-full border border-white/20 shrink-0"
                  />
                )}
                <span className="text-sm font-bold text-white">{prediction.match1}</span>
              </div>
              {prediction.match1ScoreFrance !== undefined && prediction.match1ScoreSpain !== undefined && (
                <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md mt-1.5 border border-amber-400/10">
                  Score: {prediction.match1ScoreFrance} - {prediction.match1ScoreSpain}
                </span>
              )}
            </div>
          </div>

          {/* Match 2 */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 uppercase font-semibold">England vs Argentina</span>
              <span className="text-sm font-bold text-white mt-1">Winner Match 2</span>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                {TEAMS[prediction.match2]?.flag && (
                  <img
                    src={TEAMS[prediction.match2].flag}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-5 h-5 rounded-full border border-white/20 shrink-0"
                  />
                )}
                <span className="text-sm font-bold text-white">{prediction.match2}</span>
              </div>
              {prediction.match2ScoreEngland !== undefined && prediction.match2ScoreArgentina !== undefined && (
                <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md mt-1.5 border border-amber-400/10">
                  Score: {prediction.match2ScoreEngland} - {prediction.match2ScoreArgentina}
                </span>
              )}
            </div>
          </div>

          {/* Champion */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-400/5 border border-amber-400/10">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
                <Trophy className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-amber-400 uppercase font-bold tracking-wider">Champion</span>
                <span className="text-sm font-extrabold text-white">World Cup Winner</span>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-amber-400/15 border border-amber-400/20 px-4 py-2 rounded-xl">
              {TEAMS[prediction.champion]?.flag && (
                <img
                  src={TEAMS[prediction.champion].flag}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-6 h-6 rounded-full border border-white/20 shrink-0"
                />
              )}
              <span className="text-sm font-extrabold text-amber-400">{prediction.champion}</span>
            </div>
          </div>
        </div>

        {/* Action Sharing Buttons */}
        <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
          <div className="flex items-center justify-between gap-3">
            {/* Copy Link Button */}
            <button
              onClick={copyToClipboard}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                copied
                  ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                  : "bg-white/5 border-white/10 text-white hover:bg-white/10"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied Link</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Link</span>
                </>
              )}
            </button>

            {/* General Share fallback */}
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: `${prediction.name}'s World Cup 2026 Predictions`,
                    text: getShareText(),
                    url: shareUrl,
                  }).catch(console.error);
                } else {
                  copyToClipboard();
                }
              }}
              className="p-3 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all flex items-center justify-center cursor-pointer"
              title="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          {/* Social Icons row */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={shareToWhatsApp}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={shareToX}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900/40 border border-white/10 hover:bg-slate-950 text-white text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              <Twitter className="w-3.5 h-3.5" />
              <span>Share on X</span>
            </button>
            <button
              onClick={shareToFacebook}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600/10 border border-blue-600/20 hover:bg-blue-600/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              <Facebook className="w-3.5 h-3.5" />
              <span>Facebook</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* CTA to Predict */}
      {!isOwner && (
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onBackToHome}
          className="w-full flex items-center justify-between p-4.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-xs tracking-widest uppercase shadow-[0_0_25px_rgba(251,191,36,0.25)] cursor-pointer"
        >
          <span>Think you can do better?</span>
          <div className="flex items-center gap-1">
            <span>Predict Now</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </motion.button>
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowLeft, 
  MessageSquare, 
  ThumbsUp, 
  CheckCircle, 
  Clock, 
  Share2, 
  Eye, 
  Pin, 
  Trash2, 
  Flag, 
  CornerDownRight, 
  Send,
  Sparkles,
  Trophy,
  AlertCircle
} from "lucide-react";
import { Prediction, Comment, Reaction, AdminResults } from "../types";
import { 
  collection, 
  doc, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  deleteDoc, 
  updateDoc, 
  increment, 
  getDoc,
  setDoc
} from "firebase/firestore";
import { db } from "../lib/firebase";

interface DiscussionViewProps {
  prediction: Prediction;
  onBack: () => void;
  myPredictionId: string | null;
  results: AdminResults;
}

const TEAMS: Record<string, { name: string; flag: string }> = {
  France: { name: "France", flag: "https://flagcdn.com/w40/fr.png" },
  Spain: { name: "Spain", flag: "https://flagcdn.com/w40/es.png" },
  England: { name: "England", flag: "https://flagcdn.com/w40/gb-eng.png" },
  Argentina: { name: "Argentina", flag: "https://flagcdn.com/w40/ar.png" },
};

// Available premium reaction emojis/types
const REACTION_TYPES = [
  { type: "agree", emoji: "👍", label: "Agree", color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" },
  { type: "bold", emoji: "🔥", label: "Bold Prediction", color: "bg-orange-500/10 border-orange-500/20 text-orange-400" },
  { type: "crazy", emoji: "😂", label: "Crazy Prediction", color: "bg-blue-500/10 border-blue-500/20 text-blue-400" },
  { type: "interesting", emoji: "😮", label: "Interesting", color: "bg-purple-500/10 border-purple-500/20 text-purple-400" },
  { type: "no-chance", emoji: "💀", label: "No Chance", color: "bg-red-500/10 border-red-500/20 text-red-400" },
];

export default function DiscussionView({
  prediction,
  onBack,
  myPredictionId,
  results,
}: DiscussionViewProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [commentText, setCommentText] = useState("");
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sortBy, setSortBy] = useState<"top" | "newest" | "oldest">("top");
  const [shareToast, setShareToast] = useState(false);
  const [viewCountIncremented, setViewCountIncremented] = useState(false);

  // Read local user name & session details
  const [localUser, setLocalUser] = useState({
    username: localStorage.getItem("worldcup_predict_username") || "Legendary Striker",
    userId: localStorage.getItem("worldcup_predict_id") || "user_" + Math.random().toString(36).substr(2, 9),
    avatar: localStorage.getItem("worldcup_predict_avatar") || "avatar_" + Math.floor(Math.random() * 10)
  });

  // Autocomplete Mentions variables
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionPosition, setMentionPosition] = useState(0);
  const commentInputRef = useRef<HTMLInputElement>(null);

  // Mentionable users list (derived from comments authors and prediction owners)
  const [mentionableUsers, setMentionableUsers] = useState<string[]>([]);

  // Real-time comments, reactions, and counts
  useEffect(() => {
    // Increment Prediction views in Firestore once per load
    if (!viewCountIncremented) {
      const predDocRef = doc(db, "predictions", prediction.id);
      updateDoc(predDocRef, {
        views_count: increment(1)
      }).catch(() => {
        // Fallback if document is not initialized with views
        setDoc(predDocRef, { views_count: 1 }, { merge: true });
      });
      setViewCountIncremented(true);
    }

    // Subscribe to comments
    const commentsColRef = collection(db, "comments");
    const commentsQuery = query(commentsColRef, where("predictionId", "==", prediction.id));
    const unsubscribeComments = onSnapshot(commentsQuery, (snapshot) => {
      const list: Comment[] = [];
      const usersSet = new Set<string>();
      usersSet.add(prediction.name); // prediction author is always mentionable

      snapshot.forEach((docSnap) => {
        const commentData = docSnap.data() as Comment;
        list.push({ id: docSnap.id, ...commentData });
        usersSet.add(commentData.username);
      });

      setComments(list);
      setMentionableUsers(Array.from(usersSet));
    });

    // Subscribe to reactions
    const reactionsColRef = collection(db, "reactions");
    const reactionsQuery = query(reactionsColRef, where("predictionId", "==", prediction.id));
    const unsubscribeReactions = onSnapshot(reactionsQuery, (snapshot) => {
      const list: Reaction[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Reaction);
      });
      setReactions(list);
    });

    return () => {
      unsubscribeComments();
      unsubscribeReactions();
    };
  }, [prediction.id, viewCountIncremented]);

  // Is this prediction 100% correct? (Perfect Prediction Badge check)
  const isPerfectPrediction = (() => {
    if (!results.published) return false;
    
    const m1Perfect = results.match1 === prediction.match1 && 
                      Number(prediction.match1ScoreFrance) === Number(results.match1ScoreFrance) &&
                      Number(prediction.match1ScoreSpain) === Number(results.match1ScoreSpain);

    const m2Perfect = results.match2 === prediction.match2 && 
                      Number(prediction.match2ScoreEngland) === Number(results.match2ScoreEngland) &&
                      Number(prediction.match2ScoreArgentina) === Number(results.match2ScoreArgentina);

    const champPerfect = results.champion === prediction.champion;

    return m1Perfect && m2Perfect && champPerfect;
  })();

  // Handle Mentions typing trigger
  const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCommentText(value);

    const cursor = e.target.selectionStart || 0;
    const textBeforeCursor = value.slice(0, cursor);
    const words = textBeforeCursor.split(/\s+/);
    const lastWord = words[words.length - 1];

    if (lastWord.startsWith("@")) {
      const q = lastWord.slice(1);
      setMentionQuery(q);
      setMentionPosition(cursor - q.length);
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  const selectMention = (username: string) => {
    const textBeforeMention = commentText.slice(0, mentionPosition - 1);
    const textAfterMention = commentText.slice(commentInputRef.current?.selectionStart || commentText.length);
    setCommentText(`${textBeforeMention}@${username} ${textAfterMention}`);
    setShowMentions(false);
    commentInputRef.current?.focus();
  };

  // Submit comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      await addDoc(collection(db, "comments"), {
        predictionId: prediction.id,
        text: commentText.trim(),
        username: localUser.username,
        avatar: `https://api.dicebear.com/7.x/adventurer/png?seed=${encodeURIComponent(localUser.username)}`,
        created_at: Date.now(),
        likes: 0,
        liked_by: [],
        reported: false,
        isPinned: false
      });

      // Increment comments_count inside predictions
      const predDocRef = doc(db, "predictions", prediction.id);
      await updateDoc(predDocRef, {
        comments_count: increment(1)
      });

      setCommentText("");
    } catch (err) {
      console.error("Error submitting comment:", err);
    }
  };

  // Submit Reply
  const handleSubmitReply = async (parentCommentId: string) => {
    if (!replyText.trim()) return;

    try {
      await addDoc(collection(db, "comments"), {
        predictionId: prediction.id,
        text: replyText.trim(),
        username: localUser.username,
        avatar: `https://api.dicebear.com/7.x/adventurer/png?seed=${encodeURIComponent(localUser.username)}`,
        created_at: Date.now(),
        likes: 0,
        liked_by: [],
        parentCommentId,
        reported: false,
        isPinned: false
      });

      // Increment comments_count inside predictions
      const predDocRef = doc(db, "predictions", prediction.id);
      await updateDoc(predDocRef, {
        comments_count: increment(1)
      });

      setReplyText("");
      setReplyToId(null);
    } catch (err) {
      console.error("Error submitting reply:", err);
    }
  };

  // Toggle Like on Prediction
  const handleLikePrediction = async () => {
    const userLikeRef = doc(db, "predictions", prediction.id);
    await updateDoc(userLikeRef, {
      likes_count: increment(1)
    });
  };

  // Handle Reactions (Agrees, Bold, Crazy, Interesting, No Chance)
  const handleReactionClick = async (type: "agree" | "bold" | "crazy" | "interesting" | "no-chance") => {
    try {
      const reactionId = `${prediction.id}_${localUser.userId}`;
      const reactionDocRef = doc(db, "reactions", reactionId);
      const docSnap = await getDoc(reactionDocRef);

      const predDocRef = doc(db, "predictions", prediction.id);

      if (docSnap.exists()) {
        const existingData = docSnap.data() as Reaction;
        if (existingData.type === type) {
          // Remove reaction
          await deleteDoc(reactionDocRef);
          if (type === "agree") {
            await updateDoc(predDocRef, { agrees_count: increment(-1) });
          }
        } else {
          // Change reaction type
          const oldType = existingData.type;
          await updateDoc(reactionDocRef, { type });
          if (oldType === "agree") {
            await updateDoc(predDocRef, { agrees_count: increment(-1) });
          }
          if (type === "agree") {
            await updateDoc(predDocRef, { agrees_count: increment(1) });
          }
        }
      } else {
        // Create new reaction
        await setDoc(reactionDocRef, {
          predictionId: prediction.id,
          userId: localUser.userId,
          username: localUser.username,
          type
        });

        if (type === "agree") {
          await updateDoc(predDocRef, { agrees_count: increment(1) });
        }
      }
    } catch (err) {
      console.error("Error reacting:", err);
    }
  };

  // Like comment
  const handleLikeComment = async (commentId: string) => {
    try {
      const commentDocRef = doc(db, "comments", commentId);
      const snap = await getDoc(commentDocRef);
      if (snap.exists()) {
        const data = snap.data() as Comment;
        const likedBy = data.liked_by || [];
        
        if (likedBy.includes(localUser.userId)) {
          // Unlike
          await updateDoc(commentDocRef, {
            likes: increment(-1),
            liked_by: likedBy.filter(id => id !== localUser.userId)
          });
        } else {
          // Like
          await updateDoc(commentDocRef, {
            likes: increment(1),
            liked_by: [...likedBy, localUser.userId]
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete own comment
  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await deleteDoc(doc(db, "comments", commentId));
      const predDocRef = doc(db, "predictions", prediction.id);
      await updateDoc(predDocRef, {
        comments_count: increment(-1)
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Report comment
  const handleReportComment = async (commentId: string) => {
    try {
      await updateDoc(doc(db, "comments", commentId), {
        reported: true
      });
      alert("Comment has been reported for review.");
    } catch (err) {
      console.error(err);
    }
  };

  // Pin comment (Only prediction author or any fan can do in this demo!)
  const handlePinComment = async (commentId: string, currentPinned: boolean) => {
    try {
      await updateDoc(doc(db, "comments", commentId), {
        isPinned: !currentPinned
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Share prediction URL
  const handleShare = () => {
    const url = `${window.location.origin}/prediction/${prediction.id}`;
    navigator.clipboard.writeText(url);
    setShareToast(true);
    setTimeout(() => setShareToast(false), 2000);

    // Increment share counter in Firestore
    const predDocRef = doc(db, "predictions", prediction.id);
    updateDoc(predDocRef, {
      shares_count: increment(1)
    }).catch(() => {});
  };

  // Helper relative times
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

  // Organize nested replies hierarchy
  const parentComments = comments.filter(c => !c.parentCommentId);
  const repliesMap = comments.reduce((acc, c) => {
    if (c.parentCommentId) {
      if (!acc[c.parentCommentId]) acc[c.parentCommentId] = [];
      acc[c.parentCommentId].push(c);
    }
    return acc;
  }, {} as Record<string, Comment[]>);

  // Sorting parent comments
  const sortedParentComments = parentComments.sort((a, b) => {
    // Pin comments go first
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;

    if (sortBy === "top") {
      return (b.likes || 0) - (a.likes || 0);
    }
    if (sortBy === "newest") {
      return b.created_at - a.created_at;
    }
    return a.created_at - b.created_at; // oldest
  });

  // Calculate Reaction Tallies
  const reactionTallies = REACTION_TYPES.reduce((acc, rx) => {
    acc[rx.type] = reactions.filter(r => r.type === rx.type).length;
    return acc;
  }, {} as Record<string, number>);

  const hasReacted = (type: string) => {
    return reactions.some(r => r.userId === localUser.userId && r.type === type);
  };

  const formattedPredictionDate = new Date(prediction.created_at).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  return (
    <div id="prediction-discussion-page" className="space-y-6 max-w-md mx-auto">
      {/* Back Button and Page Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-gray-300 hover:text-white transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Standings</span>
        </button>
        <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
          Match Discussion
        </span>
      </div>

      {/* Main Prediction Details Card */}
      <div className="relative bg-zinc-900 border border-white/10 rounded-3xl p-5 shadow-md">
        
        {/* Glowing effect if Perfect Prediction */}
        {isPerfectPrediction && (
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-amber-600/5 animate-pulse rounded-[2rem] pointer-events-none" />
        )}

        {/* Brand/Owner Info & Date */}
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <img 
              src={(prediction.avatar || '').replace('/adventurer/svg', '/adventurer/png') || `https://api.dicebear.com/7.x/adventurer/png?seed=${encodeURIComponent(prediction.name)}`}
              alt="" 
              className="w-8 h-8 rounded-full bg-white/10 border border-white/10 shadow-sm"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-black text-white">{prediction.name}</h4>
                {isPerfectPrediction && (
                  <span className="inline-flex items-center gap-1 bg-amber-400 text-black text-[8px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm animate-bounce">
                    <Sparkles className="w-2.5 h-2.5" />
                    Perfect Pick
                  </span>
                )}
              </div>
              <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 mt-0.5">
                <Clock className="w-2.5 h-2.5" />
                {formattedPredictionDate}
              </span>
            </div>
          </div>
          
          <span className="text-[9px] font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/25 uppercase tracking-wider">
            {results.published ? `🟢 ${prediction.score ?? 0} PTS` : "🟡 LIVE"}
          </span>
        </div>

        {/* Predictions Score Rows */}
        <div className="py-4 space-y-3.5">
          {/* Match 1 details */}
          <div className="flex items-center justify-between text-xs bg-black/40 p-3 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2 w-5/12">
              <img src="https://flagcdn.com/w40/fr.png" alt="" referrerPolicy="no-referrer" className="w-5 h-5 rounded-full border border-white/10 shadow-sm" />
              <span className="font-extrabold text-white">France</span>
            </div>
            <div className="flex items-center gap-1.5 justify-center w-2/12 font-mono font-black text-base text-amber-400">
              <span>{prediction.match1ScoreFrance}</span>
              <span className="text-gray-500 font-sans font-medium text-xs">-</span>
              <span>{prediction.match1ScoreSpain}</span>
            </div>
            <div className="flex items-center gap-2 justify-end w-5/12 text-right">
              <span className="font-extrabold text-white">Spain</span>
              <img src="https://flagcdn.com/w40/es.png" alt="" referrerPolicy="no-referrer" className="w-5 h-5 rounded-full border border-white/10 shadow-sm" />
            </div>
          </div>

          {/* Match 2 details */}
          <div className="flex items-center justify-between text-xs bg-black/40 p-3 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2 w-5/12">
              <img src="https://flagcdn.com/w40/gb-eng.png" alt="" referrerPolicy="no-referrer" className="w-5 h-5 rounded-full border border-white/10 shadow-sm" />
              <span className="font-extrabold text-white">England</span>
            </div>
            <div className="flex items-center gap-1.5 justify-center w-2/12 font-mono font-black text-base text-amber-400">
              <span>{prediction.match2ScoreEngland}</span>
              <span className="text-gray-500 font-sans font-medium text-xs">-</span>
              <span>{prediction.match2ScoreArgentina}</span>
            </div>
            <div className="flex items-center gap-2 justify-end w-5/12 text-right">
              <span className="font-extrabold text-white">Argentina</span>
              <img src="https://flagcdn.com/w40/ar.png" alt="" referrerPolicy="no-referrer" className="w-5 h-5 rounded-full border border-white/10 shadow-sm" />
            </div>
          </div>

          {/* Champion pick */}
          <div className="flex items-center justify-between border-t border-white/5 pt-3">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Champion Pick</span>
            <div className="flex items-center gap-2 bg-amber-400/10 border border-amber-400/25 px-3 py-1.5 rounded-full text-amber-400 text-xs font-black uppercase tracking-wider shadow-md">
              {TEAMS[prediction.champion] && (
                <img src={TEAMS[prediction.champion].flag} alt="" referrerPolicy="no-referrer" className="w-4 h-4 rounded-full border border-amber-400/20" />
              )}
              <span>{prediction.champion}</span>
            </div>
          </div>
        </div>

        {/* Live Counters (Views, Shares, Likes) */}
        <div className="flex items-center justify-between border-t border-white/5 pt-3 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-amber-400/80" />
              <span>{prediction.views_count ?? 1} Views</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-amber-400/80" />
              <span>{prediction.shares_count ?? 0} Shares</span>
            </div>
          </div>

          <button 
            onClick={handleLikePrediction}
            className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20"
          >
            <ThumbsUp className="w-3.5 h-3.5 fill-current" />
            <span>{prediction.likes_count ?? 0} Likes</span>
          </button>
        </div>
      </div>

      {/* REACTIONS SELECTOR PANEL */}
      <div className="bg-zinc-900 border border-white/10 rounded-3xl p-4 space-y-3 shadow-lg">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-400 border-b border-white/5 pb-2">
          React to prediction
        </h4>
        <div className="flex items-center justify-between gap-1.5 overflow-x-auto py-1">
          {REACTION_TYPES.map((rx) => {
            const count = reactionTallies[rx.type] || 0;
            const reacted = hasReacted(rx.type);

            return (
              <button
                key={rx.type}
                onClick={() => handleReactionClick(rx.type as any)}
                className={`flex-1 min-w-[65px] flex flex-col items-center justify-center p-2 rounded-2xl border transition-all hover:scale-105 active:scale-95 duration-200 cursor-pointer ${
                  reacted 
                    ? "bg-amber-400/20 border-amber-400 text-amber-400 font-extrabold shadow-sm shadow-amber-500/10" 
                    : "bg-white/2 border-white/5 text-gray-400 hover:bg-white/5"
                }`}
                title={rx.label}
              >
                <span className="text-lg mb-0.5">{rx.emoji}</span>
                <span className="text-[8px] uppercase tracking-wider truncate max-w-full text-center leading-none">
                  {rx.label.split(" ")[0]}
                </span>
                <span className="text-[9px] font-bold font-mono mt-1 text-white">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* COPIED TOAST FOR SHARING */}
      <AnimatePresence>
        {shareToast && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-amber-400 text-black font-black text-xs uppercase px-4 py-2.5 rounded-full shadow-lg z-50 flex items-center gap-1.5"
          >
            <span>🔗 Unique URL Copied!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DISCUSSION / COMMENTS LIST & ADD COMMENT SECTION */}
      <div className="space-y-4 bg-zinc-900 border border-white/10 rounded-3xl p-5 shadow-lg">
        
        {/* Comments Section Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-black uppercase tracking-widest text-white">
              Discussion ({comments.length})
            </h4>
          </div>

          {/* Comment Sort Selector */}
          <div className="flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-xl border border-white/5">
            <span className="text-[8px] font-black uppercase text-gray-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-[9px] font-black uppercase text-amber-400 focus:outline-none cursor-pointer"
            >
              <option value="top">Top</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
        </div>

        {/* Input box to post a new comment */}
        <form onSubmit={handleSubmitComment} className="relative mt-2">
          <div className="relative">
            <input
              ref={commentInputRef}
              type="text"
              placeholder="Post a comment... use @ to mention"
              value={commentText}
              onChange={handleCommentChange}
              className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 pl-4 pr-12 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400/40 transition-all"
            />
            <button
              type="submit"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-amber-400 hover:bg-amber-300 text-black flex items-center justify-center transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          </div>

          {/* @mention suggestions dropdown */}
          <AnimatePresence>
            {showMentions && mentionableUsers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute left-0 bottom-full mb-1 w-48 bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-40 text-left max-h-40 overflow-y-auto"
              >
                <div className="px-3 py-1.5 border-b border-white/5 bg-white/5 text-[8px] font-black uppercase text-amber-400 tracking-wider">
                  Select User to Mention
                </div>
                {mentionableUsers
                  .filter((u) => u.toLowerCase().includes(mentionQuery.toLowerCase()))
                  .map((username) => (
                    <button
                      key={username}
                      type="button"
                      onClick={() => selectMention(username)}
                      className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-amber-400 hover:text-black font-semibold transition-colors"
                    >
                      @{username}
                    </button>
                  ))}
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        {/* Comments Feed List */}
        {sortedParentComments.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-500 italic">
            No comments yet. Start the prediction debate!
          </div>
        ) : (
          <div className="space-y-4 divide-y divide-white/5 max-h-[450px] overflow-y-auto pr-1">
            {sortedParentComments.map((comment, index) => {
              const replies = repliesMap[comment.id] || [];
              const commentLiked = comment.liked_by?.includes(localUser.userId);

              return (
                <div key={comment.id} className={`pt-4 first:pt-0 space-y-3 ${comment.isPinned ? "bg-amber-400/5 -mx-4 px-4 py-3.5 rounded-2xl border border-amber-400/10" : ""}`}>
                  
                  {/* Pinned visual label */}
                  {comment.isPinned && (
                    <div className="flex items-center gap-1 text-[8px] font-black text-amber-400 uppercase tracking-widest mb-1.5">
                      <Pin className="w-3 h-3 fill-current" />
                      <span>Pinned Comment</span>
                    </div>
                  )}

                  {/* Comment Author info */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <img 
                        src={comment.avatar} 
                        alt="" 
                        referrerPolicy="no-referrer"
                        className="w-6 h-6 rounded-full bg-white/10 border border-white/10 shadow-sm shrink-0" 
                      />
                      <div>
                        <span className="text-[11px] font-black text-white block">
                          {comment.username}
                        </span>
                        <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider block mt-0.5">
                          {timeAgo(comment.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons (Pin, Delete, Report) */}
                    <div className="flex items-center gap-2 text-gray-400">
                      {/* Pin action (author or general) */}
                      <button 
                        onClick={() => handlePinComment(comment.id, comment.isPinned ?? false)}
                        className={`hover:text-amber-400 transition-colors cursor-pointer ${comment.isPinned ? "text-amber-400" : ""}`}
                        title={comment.isPinned ? "Unpin Comment" : "Pin Comment"}
                      >
                        <Pin className="w-3 h-3" />
                      </button>

                      {/* Delete button (If owned) */}
                      {comment.username === localUser.username && (
                        <button 
                          onClick={() => handleDeleteComment(comment.id)}
                          className="hover:text-red-400 transition-colors cursor-pointer"
                          title="Delete Comment"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}

                      {/* Report button */}
                      <button 
                        onClick={() => handleReportComment(comment.id)}
                        className="hover:text-amber-400 transition-colors cursor-pointer"
                        title="Report Comment"
                      >
                        <Flag className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Comment Body */}
                  <p className="text-[11px] text-gray-300 pl-8.5 font-medium leading-relaxed select-text whitespace-pre-wrap">
                    {/* Highlight mentions in text */}
                    {comment.text.split(" ").map((word, i) => {
                      if (word.startsWith("@")) {
                        return <span key={i} className="text-amber-400 font-black mr-1">{word}</span>;
                      }
                      return word + " ";
                    })}
                  </p>

                  {/* Likes and Reply CTAs */}
                  <div className="flex items-center gap-4 pl-8.5 text-[9px] text-gray-400 font-black uppercase">
                    <button 
                      onClick={() => handleLikeComment(comment.id)}
                      className={`flex items-center gap-1 cursor-pointer transition-colors ${commentLiked ? "text-amber-400" : "hover:text-white"}`}
                    >
                      <ThumbsUp className={`w-3 h-3 ${commentLiked ? "fill-current" : ""}`} />
                      <span>{comment.likes} Like</span>
                    </button>

                    <button 
                      onClick={() => {
                        setReplyToId(replyToId === comment.id ? null : comment.id);
                        setReplyText(`@${comment.username} `);
                      }}
                      className="hover:text-white transition-colors cursor-pointer"
                    >
                      Reply
                    </button>
                  </div>

                  {/* REPLY INPUT FIELD */}
                  {replyToId === comment.id && (
                    <div className="pl-8.5 flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Write a reply..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-[10px] text-white focus:outline-none focus:border-amber-400/40"
                      />
                      <button
                        onClick={() => handleSubmitReply(comment.id)}
                        className="py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                      >
                        Send
                      </button>
                    </div>
                  )}

                  {/* NESTED REPLIES FEED */}
                  {replies.length > 0 && (
                    <div className="pl-8.5 space-y-3 pt-2">
                      {replies.map((reply) => (
                        <div key={reply.id} className="flex gap-2.5 items-start bg-white/2 border border-white/5 rounded-2xl p-2.5">
                          <CornerDownRight className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <div className="flex-1 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <img 
                                  src={reply.avatar} 
                                  alt="" 
                                  referrerPolicy="no-referrer"
                                  className="w-5 h-5 rounded-full bg-white/10 border border-white/10 shadow-sm shrink-0" 
                                />
                                <span className="text-[10px] font-black text-white">{reply.username}</span>
                              </div>
                              
                              {/* Reply deletion */}
                              {reply.username === localUser.username && (
                                <button 
                                  onClick={() => handleDeleteComment(reply.id)}
                                  className="text-gray-500 hover:text-red-400 cursor-pointer transition-colors"
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </div>

                            <p className="text-[10px] text-gray-300 font-medium leading-relaxed">
                              {reply.text.split(" ").map((word, i) => {
                                if (word.startsWith("@")) {
                                  return <span key={i} className="text-amber-400 font-black mr-1">{word}</span>;
                                }
                                return word + " ";
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FOOTER ACTION SHARE */}
      <button
        onClick={handleShare}
        className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black text-xs tracking-widest uppercase rounded-2xl flex items-center justify-center gap-2.5 transition-all hover:scale-[1.01] active:scale-[0.99] duration-200 cursor-pointer"
      >
        <Share2 className="w-4 h-4 text-amber-400" />
        <span>Share Prediction To Friends</span>
      </button>
    </div>
  );
}

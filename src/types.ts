export type Team = "France" | "Spain" | "England" | "Argentina";

export interface Prediction {
  id: string;
  name: string;
  avatar?: string; // Avatar seed or identifier
  match1: "France" | "Spain";
  match2: "England" | "Argentina";
  champion: Team;
  score?: number;
  created_at: number; // UTC timestamp in milliseconds
  share_id: string;
  match1ScoreFrance?: number;
  match1ScoreSpain?: number;
  match2ScoreEngland?: number;
  match2ScoreArgentina?: number;
  country?: string;
  likes_count?: number;
  comments_count?: number;
  agrees_count?: number;
  views_count?: number;
  shares_count?: number;
}

export interface AdminResults {
  match1: "France" | "Spain" | "";
  match2: "England" | "Argentina" | "";
  champion: Team | "";
  published: boolean;
  match1ScoreFrance?: number;
  match1ScoreSpain?: number;
  match2ScoreEngland?: number;
  match2ScoreArgentina?: number;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  avatar?: string;
  score: number;
  match1Correct: boolean;
  match2Correct: boolean;
  match1ScoreCorrect?: boolean;
  match2ScoreCorrect?: boolean;
  championCorrect: boolean;
  created_at: number;
  p: Prediction;
}

export interface Comment {
  id: string;
  predictionId: string;
  text: string;
  username: string;
  avatar: string;
  created_at: number;
  likes: number;
  liked_by?: string[]; // Array of user IDs or session keys
  parentCommentId?: string; // For replies
  reported?: boolean;
  isPinned?: boolean; // Pinned by admin
}

export interface Reaction {
  id: string;
  predictionId: string;
  userId: string;
  username: string;
  type: "agree" | "bold" | "crazy" | "interesting" | "no-chance";
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: number;
}

export interface UserProfile {
  id: string;
  username: string;
  avatar: string;
  joinedDate: number;
  predictionsCount: number;
  correctPercentage: number;
  championAccuracy: boolean;
  achievements: string[]; // Badge IDs
}


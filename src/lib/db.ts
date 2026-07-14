import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  orderBy, 
  writeBatch
} from "firebase/firestore";
import { db } from "./firebase";
import { Prediction, AdminResults } from "../types";

// Collection Names
const PREDICTIONS_COLLECTION = "predictions";
const RESULTS_COLLECTION = "results";
const ADMIN_CONFIG_DOC = "admin_config";

/**
 * Submits a new prediction to Firestore
 */
export async function submitPrediction(prediction: Omit<Prediction, "score">): Promise<void> {
  const docRef = doc(db, PREDICTIONS_COLLECTION, prediction.id);
  await setDoc(docRef, {
    ...prediction,
    score: null, // Initial state, not scored yet
  });
}

/**
 * Gets a specific prediction by ID
 */
export async function getPredictionById(id: string): Promise<Prediction | null> {
  const docRef = doc(db, PREDICTIONS_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as Prediction;
  }
  return null;
}

/**
 * Gets all predictions, optionally sorted for leaderboard
 */
export async function getAllPredictions(): Promise<Prediction[]> {
  const colRef = collection(db, PREDICTIONS_COLLECTION);
  const q = query(colRef, orderBy("created_at", "desc"));
  const querySnapshot = await getDocs(q);
  
  const list: Prediction[] = [];
  querySnapshot.forEach((doc) => {
    list.push({ id: doc.id, ...doc.data() } as Prediction);
  });
  return list;
}

/**
 * Gets the current published match results
 */
export async function getResults(): Promise<AdminResults> {
  const docRef = doc(db, RESULTS_COLLECTION, ADMIN_CONFIG_DOC);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as AdminResults;
  }
  
  // Return default empty configuration if not created yet
  return {
    match1: "",
    match2: "",
    champion: "",
    published: false,
  };
}

/**
 * Updates/Publishes the final match results and scores all existing predictions
 */
export async function publishResultsAndCalculateScores(results: AdminResults): Promise<void> {
  // 1. Save results to Firestore
  const resultsDocRef = doc(db, RESULTS_COLLECTION, ADMIN_CONFIG_DOC);
  await setDoc(resultsDocRef, results);

  // 2. Load all predictions to score them
  const predictionsRef = collection(db, PREDICTIONS_COLLECTION);
  const querySnapshot = await getDocs(predictionsRef);
  
  const batch = writeBatch(db);
  
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data() as Prediction;
    let score = 0;

    // Scoring Rules:
    // Match 1 correct = 1 point
    // Match 2 correct = 1 point
    // Champion correct = 2 points
    // Max = 4 points

    if (results.published) {
      if (results.match1 && data.match1 === results.match1) {
        score += 1;
      }
      if (results.match2 && data.match2 === results.match2) {
        score += 1;
      }
      if (results.champion && data.champion === results.champion) {
        score += 2;
      }

      // Exact score bonus: +2 points per match
      if (
        results.match1ScoreFrance !== undefined && results.match1ScoreFrance !== null &&
        results.match1ScoreSpain !== undefined && results.match1ScoreSpain !== null &&
        data.match1ScoreFrance !== undefined && data.match1ScoreFrance !== null &&
        data.match1ScoreSpain !== undefined && data.match1ScoreSpain !== null &&
        Number(data.match1ScoreFrance) === Number(results.match1ScoreFrance) &&
        Number(data.match1ScoreSpain) === Number(results.match1ScoreSpain)
      ) {
        score += 2;
      }

      if (
        results.match2ScoreEngland !== undefined && results.match2ScoreEngland !== null &&
        results.match2ScoreArgentina !== undefined && results.match2ScoreArgentina !== null &&
        data.match2ScoreEngland !== undefined && data.match2ScoreEngland !== null &&
        data.match2ScoreArgentina !== undefined && data.match2ScoreArgentina !== null &&
        Number(data.match2ScoreEngland) === Number(results.match2ScoreEngland) &&
        Number(data.match2ScoreArgentina) === Number(results.match2ScoreArgentina)
      ) {
        score += 2;
      }
    }

    const predictionDocRef = doc(db, PREDICTIONS_COLLECTION, docSnap.id);
    batch.update(predictionDocRef, { score });
  });

  // Commit batch update
  await batch.commit();
}

/**
 * Seeds the database with mock predictions from famous figures and Bangladeshi fans
 */
export async function seedMockPredictions(): Promise<void> {
  const mockPredictions: Omit<Prediction, "score">[] = [
    {
      id: "mock_messi",
      name: "Lionel Messi 🐐",
      avatar: "Messi",
      match1: "Spain",
      match2: "Argentina",
      champion: "Argentina",
      match1ScoreFrance: 1,
      match1ScoreSpain: 2,
      match2ScoreEngland: 1,
      match2ScoreArgentina: 3,
      created_at: Date.now() - 3600000 * 5, // 5 hours ago
      share_id: "mock_messi",
      likes_count: 5200,
      comments_count: 140,
      agrees_count: 4800,
      views_count: 85000,
      shares_count: 1200
    },
    {
      id: "mock_ronaldo",
      name: "Cristiano Ronaldo 👑",
      avatar: "Ronaldo",
      match1: "France",
      match2: "Argentina",
      champion: "France",
      match1ScoreFrance: 3,
      match1ScoreSpain: 2,
      match2ScoreEngland: 0,
      match2ScoreArgentina: 1,
      created_at: Date.now() - 3600000 * 4, // 4 hours ago
      share_id: "mock_ronaldo",
      likes_count: 4800,
      comments_count: 210,
      agrees_count: 3100,
      views_count: 79000,
      shares_count: 950
    },
    {
      id: "mock_shakib",
      name: "Shakib Al Hasan 🏏",
      avatar: "Shakib",
      match1: "Spain",
      match2: "Argentina",
      champion: "Argentina",
      match1ScoreFrance: 1,
      match1ScoreSpain: 2,
      match2ScoreEngland: 0,
      match2ScoreArgentina: 2,
      created_at: Date.now() - 3600000 * 3, // 3 hours ago
      share_id: "mock_shakib",
      likes_count: 1200,
      comments_count: 45,
      agrees_count: 980,
      views_count: 15000,
      shares_count: 180
    },
    {
      id: "mock_niloy",
      name: "Niloy Hakim 🏆",
      avatar: "Niloy",
      match1: "France",
      match2: "Argentina",
      champion: "Argentina",
      match1ScoreFrance: 2,
      match1ScoreSpain: 1,
      match2ScoreEngland: 1,
      match2ScoreArgentina: 2,
      created_at: Date.now() - 3600000 * 2, // 2 hours ago
      share_id: "mock_niloy",
      likes_count: 15,
      comments_count: 2,
      agrees_count: 12,
      views_count: 240,
      shares_count: 8
    },
    {
      id: "mock_tamim",
      name: "Tamim Iqbal 🏏",
      avatar: "Tamim",
      match1: "Spain",
      match2: "Argentina",
      champion: "Argentina",
      match1ScoreFrance: 1,
      match1ScoreSpain: 3,
      match2ScoreEngland: 1,
      match2ScoreArgentina: 2,
      created_at: Date.now() - 3600000 * 1, // 1 hour ago
      share_id: "mock_tamim",
      likes_count: 650,
      comments_count: 12,
      agrees_count: 480,
      views_count: 6200,
      shares_count: 44
    },
    {
      id: "mock_pep",
      name: "Pep Guardiola 🧠",
      avatar: "Pep",
      match1: "Spain",
      match2: "Argentina",
      champion: "Spain",
      match1ScoreFrance: 1,
      match1ScoreSpain: 2,
      match2ScoreEngland: 1,
      match2ScoreArgentina: 2,
      created_at: Date.now() - 1800000, // 30 mins ago
      share_id: "mock_pep",
      likes_count: 1800,
      comments_count: 68,
      agrees_count: 1400,
      views_count: 24000,
      shares_count: 320
    },
    {
      id: "mock_elon",
      name: "Elon Musk 🚀",
      avatar: "Elon",
      match1: "France",
      match2: "England",
      champion: "England",
      match1ScoreFrance: 4,
      match1ScoreSpain: 3,
      match2ScoreEngland: 3,
      match2ScoreArgentina: 0,
      created_at: Date.now() - 900000, // 15 mins ago
      share_id: "mock_elon",
      likes_count: 14500,
      comments_count: 890,
      agrees_count: 8500,
      views_count: 350000,
      shares_count: 2800
    },
    {
      id: "mock_fahim",
      name: "Fahim Chowdhury 🇧🇩",
      avatar: "Fahim",
      match1: "Spain",
      match2: "Argentina",
      champion: "Argentina",
      match1ScoreFrance: 0,
      match1ScoreSpain: 2,
      match2ScoreEngland: 1,
      match2ScoreArgentina: 3,
      created_at: Date.now() - 600000, // 10 mins ago
      share_id: "mock_fahim",
      likes_count: 32,
      comments_count: 3,
      agrees_count: 24,
      views_count: 450,
      shares_count: 12
    },
    {
      id: "mock_zuck",
      name: "Mark Zuckerberg 👥",
      avatar: "Zuck",
      match1: "Spain",
      match2: "Argentina",
      champion: "Argentina",
      match1ScoreFrance: 1,
      match1ScoreSpain: 2,
      match2ScoreEngland: 1,
      match2ScoreArgentina: 2,
      created_at: Date.now() - 300000, // 5 mins ago
      share_id: "mock_zuck",
      likes_count: 3400,
      comments_count: 180,
      agrees_count: 2900,
      views_count: 48000,
      shares_count: 410
    },
    {
      id: "mock_mrbeast",
      name: "MrBeast 🎁",
      avatar: "MrBeast",
      match1: "France",
      match2: "Argentina",
      champion: "Argentina",
      match1ScoreFrance: 3,
      match1ScoreSpain: 1,
      match2ScoreEngland: 2,
      match2ScoreArgentina: 4,
      created_at: Date.now() - 120000, // 2 mins ago
      share_id: "mock_mrbeast",
      likes_count: 22000,
      comments_count: 1200,
      agrees_count: 18500,
      views_count: 650000,
      shares_count: 5900
    }
  ];

  const batch = writeBatch(db);
  for (const pred of mockPredictions) {
    const docRef = doc(db, PREDICTIONS_COLLECTION, pred.id);
    batch.set(docRef, {
      ...pred,
      score: null
    });
  }
  await batch.commit();
}

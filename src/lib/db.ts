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

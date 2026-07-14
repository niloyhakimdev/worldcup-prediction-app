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
  const firstNames = [
    "Rahim", "Karim", "Abul", "Sabbir", "Fahim", "Tanvir", "Naim", "Arif", "Imran", "Asif", 
    "Sujon", "Riad", "Rubel", "Soumya", "Taskin", "Shoriful", "Mehidy", "Liton", "Anamul", "Nasir", 
    "Imrul", "Mominul", "Taijul", "Ebadot", "Jahid", "Mamun", "Siddik", "Rana", "Babul", "Farhan",
    "Nayeem", "Saif", "Yeasin", "Sohel", "Biplob", "Mithun", "Zia", "Kamal", "Zafar", "Tariq",
    "Mostafiz", "Hasan", "Mizan", "Rafiq", "Jamil", "Habib", "Rashed", "Shaheen", "Selim", "Khorshed"
  ];

  const lastNames = [
    "Hasan", "Rahman", "Islam", "Chowdhury", "Khan", "Ahmed", "Iqbal", "Ali", "Uddin", "Sarkar", 
    "Patwary", "Bhuiyan", "Siddique", "Talukder", "Miah", "Akand", "Munshi", "Gazi", "Molla", "Kazi",
    "Patwari", "Howlader", "Majumder", "Dewan", "Bahar", "Sikder", "Kundu", "Bose", "Dutta", "Paul"
  ];

  const famousBangladeshis = [
    { name: "Jamal Bhuyan 🇧🇩⚽", avatarSeed: "Jamal" },
    { name: "Topu Barman 🛡️", avatarSeed: "Topu" },
    { name: "Shekh Morsalin ⚡", avatarSeed: "Morsalin" },
    { name: "Mashrafe Mortaza 🏏", avatarSeed: "Mashrafe" },
    { name: "Mushfiqur Rahim 🏏", avatarSeed: "Mushfiqur" },
    { name: "Mahmudullah Riyad 🏏", avatarSeed: "Riyad" },
    { name: "Mustafizur Rahman 🏏", avatarSeed: "Fizz" },
    { name: "Taskin Ahmed 🏏", avatarSeed: "Taskin" },
    { name: "Liton Das 🏏", avatarSeed: "Liton" },
    { name: "Ayman Sadiq 🎓", avatarSeed: "Ayman" },
    { name: "Solaiman Shukhon 🎙️", avatarSeed: "Solaiman" }
  ];

  const famousGlobals = [
    { name: "Lionel Messi 🐐", avatarSeed: "Messi" },
    { name: "Cristiano Ronaldo 👑", avatarSeed: "Ronaldo" },
    { name: "Pep Guardiola 🧠", avatarSeed: "Pep" },
    { name: "Elon Musk 🚀", avatarSeed: "Elon" },
    { name: "Mark Zuckerberg 👥", avatarSeed: "Zuck" },
    { name: "MrBeast 🎁", avatarSeed: "MrBeast" }
  ];

  const list: Omit<Prediction, "score">[] = [];

  // Add globals
  for (const glob of famousGlobals) {
    const isMessi = glob.name.includes("Messi");
    const isRonaldo = glob.name.includes("Ronaldo");
    list.push({
      id: "mock_" + glob.avatarSeed.toLowerCase(),
      name: glob.name,
      avatar: `https://api.dicebear.com/7.x/adventurer/png?seed=${glob.avatarSeed}`,
      match1: isMessi ? "Spain" : "France",
      match2: "Argentina",
      champion: isMessi ? "Argentina" : "France",
      match1ScoreFrance: isMessi ? 1 : 3,
      match1ScoreSpain: isMessi ? 2 : 2,
      match2ScoreEngland: isMessi ? 1 : 0,
      match2ScoreArgentina: isMessi ? 3 : 1,
      created_at: Date.now() - 3600000 * 5,
      share_id: "mock_" + glob.avatarSeed.toLowerCase(),
      likes_count: isMessi ? 5200 : isRonaldo ? 4800 : 2500,
      comments_count: isMessi ? 3 : isRonaldo ? 2 : 1,
      agrees_count: isMessi ? 4800 : isRonaldo ? 3100 : 1800,
      views_count: isMessi ? 85000 : isRonaldo ? 79000 : 40000,
      shares_count: isMessi ? 1200 : isRonaldo ? 950 : 350
    });
  }

  // Add famous Bangladeshis
  for (const bd of famousBangladeshis) {
    const m1ScoreFrance = Math.floor(Math.random() * 4);
    const m1ScoreSpain = Math.floor(Math.random() * 4);
    const m2ScoreEngland = Math.floor(Math.random() * 4);
    const m2ScoreArgentina = Math.floor(Math.random() * 4);
    const match1 = m1ScoreFrance > m1ScoreSpain ? "France" : "Spain";
    const match2 = m2ScoreEngland > m2ScoreArgentina ? "England" : "Argentina";
    const champion = Math.random() > 0.5 ? match1 : match2;

    list.push({
      id: "mock_" + bd.avatarSeed.toLowerCase(),
      name: bd.name,
      avatar: `https://api.dicebear.com/7.x/adventurer/png?seed=${bd.avatarSeed}`,
      match1,
      match2,
      champion,
      match1ScoreFrance: m1ScoreFrance,
      match1ScoreSpain: m1ScoreSpain,
      match2ScoreEngland: m2ScoreEngland,
      match2ScoreArgentina: m2ScoreArgentina,
      created_at: Date.now() - 3600000 * (Math.random() * 24 + 6),
      share_id: "mock_" + bd.avatarSeed.toLowerCase(),
      likes_count: Math.floor(Math.random() * 800 + 400),
      comments_count: bd.name.includes("Jamal") || bd.name.includes("Shakib") ? 2 : 0,
      agrees_count: Math.floor(Math.random() * 600 + 200),
      views_count: Math.floor(Math.random() * 10000 + 5000),
      shares_count: Math.floor(Math.random() * 100 + 20)
    });
  }

  // Add random Bangladeshi names up to 120 total
  const generatedNamesSet = new Set<string>();
  const totalEntries = 120;
  
  while (list.length < totalEntries) {
    const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const fullName = `${fName} ${lName}`;
    
    if (!generatedNamesSet.has(fullName)) {
      generatedNamesSet.add(fullName);
      
      const m1ScoreFrance = Math.floor(Math.random() * 4);
      const m1ScoreSpain = Math.floor(Math.random() * 4);
      const m2ScoreEngland = Math.floor(Math.random() * 4);
      const m2ScoreArgentina = Math.floor(Math.random() * 4);
      const match1 = m1ScoreFrance > m1ScoreSpain ? "France" : "Spain";
      const match2 = m2ScoreEngland > m2ScoreArgentina ? "England" : "Argentina";
      const champion = Math.random() > 0.5 ? match1 : match2;

      list.push({
        id: `gen_pred_${list.length}`,
        name: fullName,
        avatar: `https://api.dicebear.com/7.x/adventurer/png?seed=${encodeURIComponent(fullName)}`,
        match1,
        match2,
        champion,
        match1ScoreFrance: m1ScoreFrance,
        match1ScoreSpain: m1ScoreSpain,
        match2ScoreEngland: m2ScoreEngland,
        match2ScoreArgentina: m2ScoreArgentina,
        created_at: Date.now() - 3600000 * (Math.random() * 48),
        share_id: `gen_pred_${list.length}`,
        likes_count: Math.floor(Math.random() * 180 + 5),
        comments_count: 0,
        agrees_count: Math.floor(Math.random() * 120 + 2),
        views_count: Math.floor(Math.random() * 1500 + 20),
        shares_count: Math.floor(Math.random() * 15)
      });
    }
  }

  const mockComments = [
    {
      id: "comment_messi_1",
      predictionId: "mock_messi",
      text: "France is strong, but Argentina has the magic. Nice prediction Leo!",
      username: "Shakib Al Hasan 🏏",
      avatar: "https://api.dicebear.com/7.x/adventurer/png?seed=Shakib",
      created_at: Date.now() - 3600000 * 4.5,
      likes: 120,
      liked_by: [],
      reported: false,
      isPinned: true
    },
    {
      id: "comment_messi_2",
      predictionId: "mock_messi",
      text: "Very bold prediction! I think Spain vs France will be the real final.",
      username: "Pep Guardiola 🧠",
      avatar: "https://api.dicebear.com/7.x/adventurer/png?seed=Pep",
      created_at: Date.now() - 3600000 * 4.2,
      likes: 95,
      liked_by: [],
      reported: false,
      isPinned: false
    },
    {
      id: "comment_ronaldo_1",
      predictionId: "mock_ronaldo",
      text: "France is good, but Spain's midfield is too control-heavy, Cristiano! ⚽",
      username: "Pep Guardiola 🧠",
      avatar: "https://api.dicebear.com/7.x/adventurer/png?seed=Pep",
      created_at: Date.now() - 3600000 * 3.8,
      likes: 180,
      liked_by: [],
      reported: false,
      isPinned: true
    },
    {
      id: "comment_ronaldo_2",
      predictionId: "mock_ronaldo",
      text: "Ronaldo predicting France to win? Interesting. Let's see who holds the cup! 🏆",
      username: "Lionel Messi 🐐",
      avatar: "https://api.dicebear.com/7.x/adventurer/png?seed=Messi",
      created_at: Date.now() - 3600000 * 3.5,
      likes: 210,
      liked_by: [],
      reported: false,
      isPinned: false
    },
    {
      id: "comment_elon_1",
      predictionId: "mock_elon",
      text: "3-0 against Argentina? Elon, stick to space travel, you don't know football! 😂",
      username: "Mark Zuckerberg 👥",
      avatar: "https://api.dicebear.com/7.x/adventurer/png?seed=Zuck",
      created_at: Date.now() - 3600000 * 0.8,
      likes: 4200,
      liked_by: [],
      reported: false,
      isPinned: true
    },
    {
      id: "comment_elon_2",
      predictionId: "mock_elon",
      text: "Grok AI computed this prediction? 💀",
      username: "Fahim Chowdhury 🇧🇩",
      avatar: "https://api.dicebear.com/7.x/adventurer/png?seed=Fahim",
      created_at: Date.now() - 3600000 * 0.7,
      likes: 12,
      liked_by: [],
      reported: false,
      isPinned: false
    },
    {
      id: "comment_shakib_1",
      predictionId: "mock_shakib",
      text: "আর্জেন্টিনা ২-০ ইংল্যান্ড! অস্থির প্রেডিকশন সাকিব ভাই! 🔥🇧🇩",
      username: "Jamal Bhuyan 🇧🇩⚽",
      avatar: "https://api.dicebear.com/7.x/adventurer/png?seed=Jamal",
      created_at: Date.now() - 3600000 * 2.8,
      likes: 245,
      liked_by: [],
      reported: false,
      isPinned: true
    },
    {
      id: "comment_shakib_2",
      predictionId: "mock_shakib",
      text: "England has a solid defence Shakib, won't be that easy for Argentina.",
      username: "Tamim Iqbal 🏏",
      avatar: "https://api.dicebear.com/7.x/adventurer/png?seed=Tamim",
      created_at: Date.now() - 3600000 * 2.5,
      likes: 28,
      liked_by: [],
      reported: false,
      isPinned: false
    },
    {
      id: "comment_jamal_1",
      predictionId: "mock_jamal",
      text: "Jamal bhai, exact prediction right hole BKSP code check korbo! ⚽🇧🇩",
      username: "Shekh Morsalin ⚡",
      avatar: "https://api.dicebear.com/7.x/adventurer/png?seed=Morsalin",
      created_at: Date.now() - 3600000 * 1.2,
      likes: 92,
      liked_by: [],
      reported: false,
      isPinned: true
    },
    {
      id: "comment_jamal_2",
      predictionId: "mock_jamal",
      text: "Argentina represents Latin football best, Jamal. Totally agree.",
      username: "Mustafizur Rahman 🎯",
      avatar: "https://api.dicebear.com/7.x/adventurer/png?seed=Fizz",
      created_at: Date.now() - 3600000 * 1.0,
      likes: 54,
      liked_by: [],
      reported: false,
      isPinned: false
    }
  ];

  const batch1 = writeBatch(db);
  const batch2 = writeBatch(db);
  
  // Seed predictions
  list.forEach((pred, index) => {
    const docRef = doc(db, PREDICTIONS_COLLECTION, pred.id);
    if (index < 100) {
      batch1.set(docRef, { ...pred, score: null });
    } else {
      batch2.set(docRef, { ...pred, score: null });
    }
  });

  // Seed comments
  for (const comment of mockComments) {
    const docRef = doc(db, "comments", comment.id);
    if (list.length < 100) {
      batch1.set(docRef, comment);
    } else {
      batch2.set(docRef, comment);
    }
  }

  await batch1.commit();
  if (list.length > 100) {
    await batch2.commit();
  }
}

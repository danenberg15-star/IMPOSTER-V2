import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyA-0BongIbOG5wuN2vDbKrO1cv81tl5Lqk",
  authDomain: "the-imposter-online-game-new.firebaseapp.com",
  databaseURL: "https://the-imposter-online-game-new-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "the-imposter-online-game-new",
  storageBucket: "the-imposter-online-game-new.firebasestorage.app",
  messagingSenderId: "275504193522",
  appId: "1:275504193522:web:27ab2a901ceca8d518556b"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

const hebrewShortWords = [
  'פיל', 'גמל', 'דג', 'צב', 'דוב', 'נחש', 'פרח', 'שמש', 'ענן', 'בית', 
  'כדור', 'בובה', 'בלון', 'עוגה', 'שוקו', 'גלידה', 'סירה', 'אוטו',
  'דגל', 'מלך', 'כתר', 'קוף', 'שפן', 'גיר', 'לוח', 'תיק', 'מים', 'לחם'
];

export const generateRoomCode = () => {
  return hebrewShortWords[Math.floor(Math.random() * hebrewShortWords.length)];
};
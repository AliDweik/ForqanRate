import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

export const firebaseConfig = {
  apiKey: "AIzaSyCczWLvnkupy3lnx7QI6AltPXNqjGPreJI",
  authDomain: "forqanratesystem.firebaseapp.com",
  projectId: "forqanratesystem",
  storageBucket: "forqanratesystem.firebasestorage.app",
  messagingSenderId: "993310510708",
  appId: "1:993310510708:web:237b69063ddf3312990b21",
  measurementId: "G-L5S3ME66QM",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

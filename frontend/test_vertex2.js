import { initializeApp } from "firebase/app";
import { getVertexAI, getGenerativeModel } from "firebase/ai";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
console.log("Firebase initialized");

async function test() {
  try {
    const aiModule = await import("firebase/ai");
    console.log("AI module exports:", Object.keys(aiModule));
    // Check what is inside
    const vertexAI = aiModule.getAI(app);
    // Wait, let's see if getGenerativeModel exists
  } catch (err) {
    console.error("Error:", err);
  }
}

test();

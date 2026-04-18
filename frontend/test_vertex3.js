import { initializeApp } from "firebase/app";
import { getAI, getGenerativeModel, VertexAIBackend } from "firebase/ai";
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
    const ai = getAI(app, { backend: new VertexAIBackend() });
    const model = getGenerativeModel(ai, { model: "gemini-1.5-flash" });
    const response = await model.generateContent("Say hello");
    console.log("Response:", response.response.text());
  } catch (err) {
    console.error("Error:", err);
  }
}

test();

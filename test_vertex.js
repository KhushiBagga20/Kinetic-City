import { initializeApp } from "firebase/app";
import { getVertexAI, getGenerativeModel } from "firebase/vertexai";
import dotenv from "dotenv";

dotenv.config({ path: "frontend/.env" });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const vertexAI = getVertexAI(app);
const model = getGenerativeModel(vertexAI, { model: "gemini-2.0-flash" });

async function test() {
  try {
    const response = await model.generateContent("Say hello");
    console.log("Response:", response.response.text());
  } catch (err) {
    console.error("Error:", err);
  }
}

test();

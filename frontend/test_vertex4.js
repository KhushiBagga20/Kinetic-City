import { initializeApp } from "firebase/app";
import { getAI, getGenerativeModel, VertexAIBackend } from "firebase/ai";
import fs from "fs";

const env = fs.readFileSync(".env", "utf-8").split("\n").reduce((acc, line) => {
  const [key, ...val] = line.split("=");
  if (key && val.length) acc[key] = val.join("=").replace(/['"]/g, "");
  return acc;
}, {});

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
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

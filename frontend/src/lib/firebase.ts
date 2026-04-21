import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// The app will check if the API key exists. If not, it safely falls back to local storage.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

// Check if Firebase is properly configured
export const isFirebaseConfigured = !!firebaseConfig.apiKey;

// Initialize Firebase only if we have keys (prevents crashes)
export const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
export const auth = isFirebaseConfigured ? getAuth(app!) : null;
export const db = isFirebaseConfigured ? getFirestore(app!) : null;

// Initialize Firebase AI client using VertexAIBackend
// This routes to the paid-tier Vertex AI endpoint (aiplatform.googleapis.com)
// which utilizes your Google Cloud billing account.
export const getVertexClient = async () => {
  if (!isFirebaseConfigured || !app) return null;
  try {
    const { getAI, VertexAIBackend } = await import('firebase/ai');
    return getAI(app, { backend: new VertexAIBackend() });
  } catch (err) {
    console.warn("Firebase Vertex AI module not found:", err);
    return null;
  }
};



// Google Sign-In helper
// NOTE: Add localhost to Firebase Console authorized domains:
// Console → Authentication → Settings → Authorized domains
export async function signInWithGoogle() {
  if (!auth) throw new Error('Firebase not configured')
  const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth')
  const provider = new GoogleAuthProvider()
  provider.addScope('email')
  provider.addScope('profile')
  const result = await signInWithPopup(auth, provider)
  return result.user
}

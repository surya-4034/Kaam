import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDfeL6rICld9rg4RihSrwwYhPkWgcbw0EM",
  authDomain: "kaam-app-d348a.firebaseapp.com",
  projectId: "kaam-app-d348a",
  storageBucket: "kaam-app-d348a.firebasestorage.app",
  messagingSenderId: "602825840265",
  appId: "1:602825840265:web:20b0717cb920795843d858",
  measurementId: "G-9C4Z3H86V7"
};

// Initialize Firebase App & Auth Services
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;

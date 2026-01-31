import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDmTABUlqWJqucoT8vg2oTkmJvkgVKnt1o",
  authDomain: "wealth-app-b477b.firebaseapp.com",
  projectId: "wealth-app-b477b",
  storageBucket: "wealth-app-b477b.firebasestorage.app",
  messagingSenderId: "648103144152",
  appId: "1:648103144152:web:b8eb22ac237d5b1f91c5ad",
  measurementId: "G-NX0YWJ3ZBZ"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  type Auth,
  type User,
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAnalytics, type Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY as string,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN as string,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID as string,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: process.env
    .NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID as string,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID as string,
};

// Initialize Firebase (singleton pattern)
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let analytics: Analytics | null = null;

try {
  if (
    typeof window !== "undefined" ||
    (firebaseConfig.apiKey && firebaseConfig.projectId)
  ) {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0] as FirebaseApp;
    }

    auth = getAuth(app);
    db = getFirestore(app);

    // Analytics only in browser
    if (typeof window !== "undefined") {
      analytics = getAnalytics(app);
    }
  } else {
    console.warn(
      "Firebase config missing or incomplete. Skipping initialization during build."
    );
    // Mock objects for build time to prevent crashes if imported
    // These will throw if used, which is expected if config is missing
    app = {} as FirebaseApp;
    auth = {} as Auth;
    db = {} as Firestore;
  }
} catch (error) {
  console.warn("Error initializing Firebase");
  app = {} as FirebaseApp;
  auth = {} as Auth;
  db = {} as Firestore;
}

export { app, auth, db, analytics };

export async function loginUser(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function registerUser(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

import { getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  inMemoryPersistence,
  initializeAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { Platform } from "react-native";

const ALLOWED_EMAILS = new Set([
  "marcelo.munoz.coaquira@gmail.com",
  "ivanasuarezd@gmail.com",
]);

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

let authInitialized = false;
let authReadyPromise: Promise<User | null> | null = null;

function assertFirebaseConfig() {
  const missing = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing Firebase config: ${missing.join(", ")}.`);
  }
}

export function getFirebaseApp() {
  assertFirebaseConfig();
  if (getApps().length > 0) {
    return getApps()[0];
  }

  return initializeApp({
    apiKey: firebaseConfig.apiKey,
    authDomain: firebaseConfig.authDomain,
    databaseURL: firebaseConfig.databaseURL,
    projectId: firebaseConfig.projectId,
    appId: firebaseConfig.appId,
  });
}

export function getFirebaseAuth() {
  const app = getFirebaseApp();

  if (!authInitialized) {
    if (Platform.OS === "web") {
      getAuth(app);
    } else {
      initializeAuth(app, {
        persistence: inMemoryPersistence,
      });
    }
    authInitialized = true;
  }

  return getAuth(app);
}

export async function signInWithEmail(email: string, password: string) {
  const normalised = email.trim().toLowerCase();
  if (!ALLOWED_EMAILS.has(normalised)) {
    throw new Error("This email address is not authorised to sign in.");
  }
  const auth = getFirebaseAuth();
  await signInWithEmailAndPassword(auth, normalised, password);
}

export async function signOutFirebase() {
  await signOut(getFirebaseAuth());
}

export function subscribeAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(getFirebaseAuth(), callback);
}

export function getCurrentUser() {
  return getFirebaseAuth().currentUser;
}

export function waitForAuthReady() {
  if (authReadyPromise) return authReadyPromise;

  authReadyPromise = new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), (user) => {
      unsubscribe();
      resolve(user);
    });
  });

  return authReadyPromise;
}

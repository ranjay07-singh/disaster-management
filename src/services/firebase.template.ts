// ============================================================================
// FIREBASE CONFIGURATION TEMPLATE
// ============================================================================
// INSTRUCTIONS:
// 1. Copy this file and rename it to 'firebase.ts'
// 2. Replace the placeholder values with your actual Firebase config
// 3. Get your config from: https://console.firebase.google.com/
// 4. NEVER commit the actual firebase.ts file to git!
// ============================================================================

import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🔥 YOUR FIREBASE CONFIGURATION
// Replace these values with your actual Firebase project credentials
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Firebase Auth
let auth: Auth;
try {
  auth = initializeAuth(app);
} catch (error) {
  // Auth already initialized, get existing instance
  auth = getAuth(app);
}

// Initialize Firestore and Storage
export const firestore: Firestore = getFirestore(app);
export const storage = getStorage(app);
export { auth };
export type { Auth };
export default app;

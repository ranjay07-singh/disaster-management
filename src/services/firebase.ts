import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCuy2gAg6xxoo_LISpxgWl-VbnXdT7iv0M",
  authDomain: "disaster-management-1729.firebaseapp.com",
  projectId: "disaster-management-1729",
  storageBucket: "disaster-management-1729.firebasestorage.app",
  messagingSenderId: "201052502493",
  appId: "1:201052502493:web:ada1d432910f2c26b51e34"
};

// Initialize Firebase only if it hasn't been initialized
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);
export default app;
import { auth, firestore } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Test Firebase connection
export const testFirebaseConnection = async () => {
  try {
    console.log('Testing Firebase connection...');
    
    // Test Firestore connection
    const testDoc = doc(firestore, 'test', 'connection');
    await setDoc(testDoc, {
      message: 'Firebase connected successfully!',
      timestamp: new Date().toISOString()
    });
    
    const docSnap = await getDoc(testDoc);
    if (docSnap.exists()) {
      console.log('✅ Firestore connection successful:', docSnap.data());
      return true;
    } else {
      console.log('❌ Firestore connection failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Firebase connection error:', error);
    return false;
  }
};

// Test authentication
export const testAuth = async () => {
  try {
    console.log('Testing Firebase Auth...');
    
    // Check if auth is initialized
    if (auth) {
      console.log('✅ Firebase Auth initialized successfully');
      console.log('Current user:', auth.currentUser);
      return true;
    } else {
      console.log('❌ Firebase Auth not initialized');
      return false;
    }
  } catch (error) {
    console.error('❌ Firebase Auth error:', error);
    return false;
  }
};
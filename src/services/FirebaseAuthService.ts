import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
  Auth
} from 'firebase/auth';
import { auth } from './firebase'; // Use the centralized Firebase config

// Use the properly configured Firebase auth from firebase.ts
const firebaseAuth = auth;

// Firebase Auth Helper Functions
export const FirebaseAuthService = {
  // Check if Firebase is properly configured
  isConfigured(): boolean {
    return firebaseAuth !== null;
  },

  // Register new user with email and password
  async registerWithEmail(email: string, password: string, displayName: string): Promise<{ success: boolean; user?: FirebaseUser; message?: string }> {
    if (!firebaseAuth) {
      return { success: false, message: 'Firebase not configured. Please check your Firebase setup.' };
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      
      // Update profile with display name
      await updateProfile(userCredential.user, {
        displayName: displayName
      });
      
      console.log('✅ Firebase user created successfully:', email);
      return { success: true, user: userCredential.user };
    } catch (error: any) {
      console.error('❌ Firebase registration failed:', error.code);
      let message = 'Registration failed. Please try again.';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          message = 'An account with this email already exists.';
          break;
        case 'auth/weak-password':
          message = 'Password is too weak. Please use a stronger password.';
          break;
        case 'auth/invalid-email':
          message = 'Please enter a valid email address.';
          break;
        case 'auth/network-request-failed':
          message = 'Network error. Please check your connection.';
          break;
        default:
          message = `Registration failed: ${error.message}`;
      }
      
      return { success: false, message };
    }
  },

  // Sign in with email and password
  async signInWithEmail(email: string, password: string): Promise<{ success: boolean; user?: FirebaseUser; message?: string }> {
    if (!firebaseAuth) {
      return { success: false, message: 'Firebase not configured. Please check your Firebase setup.' };
    }

    try {
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      console.log('✅ Firebase sign in successful:', email);
      return { success: true, user: userCredential.user };
    } catch (error: any) {
      console.error('❌ Firebase sign in failed:', error.code);
      let message = 'Sign in failed. Please try again.';
      
      switch (error.code) {
        case 'auth/user-not-found':
          message = 'No account found with this email address.';
          break;
        case 'auth/wrong-password':
          message = 'Incorrect password. Please try again.';
          break;
        case 'auth/invalid-email':
          message = 'Please enter a valid email address.';
          break;
        case 'auth/user-disabled':
          message = 'This account has been disabled.';
          break;
        case 'auth/too-many-requests':
          message = 'Too many failed attempts. Please try again later.';
          break;
        case 'auth/network-request-failed':
          message = 'Network error. Please check your connection.';
          break;
        default:
          message = `Sign in failed: ${error.message}`;
      }
      
      return { success: false, message };
    }
  },

  // Send password reset email
  async sendPasswordResetEmail(email: string): Promise<{ success: boolean; message: string }> {
    if (!firebaseAuth) {
      return { 
        success: false, 
        message: 'Firebase not configured. Please check your Firebase setup.' 
      };
    }

    try {
      await sendPasswordResetEmail(firebaseAuth, email);
      console.log('✅ Password reset email sent to:', email);
      return { 
        success: true, 
        message: 'Password reset email sent successfully! Please check your inbox and spam folder.' 
      };
    } catch (error: any) {
      console.error('❌ Password reset failed:', error.code);
      let message = 'Failed to send password reset email. Please try again.';
      
      switch (error.code) {
        case 'auth/user-not-found':
          message = 'No account found with this email address.';
          break;
        case 'auth/invalid-email':
          message = 'Please enter a valid email address.';
          break;
        case 'auth/too-many-requests':
          message = 'Too many requests. Please wait before trying again.';
          break;
        case 'auth/network-request-failed':
          message = 'Network error. Please check your connection.';
          break;
        default:
          message = `Password reset failed: ${error.message}`;
      }
      
      return { success: false, message };
    }
  },

  // Sign out current user
  async signOut(): Promise<{ success: boolean; message?: string }> {
    if (!firebaseAuth) {
      return { success: false, message: 'Firebase not configured.' };
    }

    try {
      await signOut(firebaseAuth);
      console.log('✅ Firebase sign out successful');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Firebase sign out failed:', error);
      return { success: false, message: 'Sign out failed' };
    }
  },

  // Get current user
  getCurrentUser(): FirebaseUser | null {
    if (!firebaseAuth) return null;
    return firebaseAuth.currentUser;
  },

  // Listen to auth state changes
  onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
    if (!auth) {
      callback(null);
      return () => {};
    }
    return onAuthStateChanged(firebaseAuth, callback);
  },

  // Check if user is signed in
  isSignedIn(): boolean {
    return auth ? auth.currentUser !== null : false;
  },

  // Get user profile information
  getUserProfile() {
    const user = this.getCurrentUser();
    if (!user) return null;
    
    return {
      id: user.uid,
      email: user.email,
      name: user.displayName || 'User',
      emailVerified: user.emailVerified,
      photoURL: user.photoURL,
      createdAt: user.metadata.creationTime,
      lastSignIn: user.metadata.lastSignInTime
    };
  }
};

export { firebaseAuth as auth };
export default FirebaseAuthService;
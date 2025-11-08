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
import { auth as firebaseAuth } from './firebase';

// Clean Firebase Auth Service using the properly configured firebase.ts
export const CleanFirebaseAuthService = {
  
  // Check if Firebase is properly configured
  isConfigured(): boolean {
    return firebaseAuth !== null && firebaseAuth !== undefined;
  },

  // Register new user with email and password
  async registerWithEmail(email: string, password: string, displayName: string): Promise<{ success: boolean; user?: FirebaseUser; message?: string }> {
    if (!firebaseAuth) {
      return { success: false, message: 'Firebase Auth not initialized. Please check your Firebase configuration.' };
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      
      // Update profile with display name
      if (displayName) {
        await updateProfile(userCredential.user, {
          displayName: displayName
        });
      }

      console.log('✅ User registered successfully:', userCredential.user.email);
      return { 
        success: true, 
        user: userCredential.user, 
        message: 'User registered successfully' 
      };
    } catch (error: any) {
      console.log('❌ Registration error:', error?.code || error?.message);
      return { 
        success: false, 
        message: error?.message || 'Registration failed' 
      };
    }
  },

  // Sign in with email and password
  async signInWithEmail(email: string, password: string): Promise<{ success: boolean; user?: FirebaseUser; message?: string }> {
    if (!firebaseAuth) {
      return { success: false, message: 'Firebase Auth not initialized. Please check your Firebase configuration.' };
    }

    try {
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      console.log('✅ User signed in successfully:', userCredential.user.email);
      
      return { 
        success: true, 
        user: userCredential.user, 
        message: 'Login successful' 
      };
    } catch (error: any) {
      console.log('❌ Login error:', error?.code || error?.message);
      return { 
        success: false, 
        message: error?.message || 'Login failed' 
      };
    }
  },

  // Send password reset email
  async sendPasswordResetEmail(email: string): Promise<{ success: boolean; message: string }> {
    if (!firebaseAuth) {
      return { success: false, message: 'Firebase Auth not initialized. Please check your Firebase configuration.' };
    }

    try {
      await sendPasswordResetEmail(firebaseAuth, email);
      console.log('✅ Password reset email sent to:', email);
      
      return { 
        success: true, 
        message: 'Password reset email sent successfully. Please check your inbox and spam folder.' 
      };
    } catch (error: any) {
      console.log('❌ Password reset error:', error?.code || error?.message);
      return { 
        success: false, 
        message: error?.message || 'Failed to send password reset email' 
      };
    }
  },

  // Sign out current user
  async signOut(): Promise<{ success: boolean; message?: string }> {
    if (!firebaseAuth) {
      return { success: false, message: 'Firebase Auth not initialized' };
    }

    try {
      await signOut(firebaseAuth);
      console.log('✅ User signed out successfully');
      return { success: true };
    } catch (error: any) {
      console.log('❌ Sign out error:', error?.code || error?.message);
      return { 
        success: false, 
        message: error?.message || 'Sign out failed' 
      };
    }
  },

  // Get current user
  getCurrentUser(): FirebaseUser | null {
    if (!firebaseAuth) return null;
    return firebaseAuth.currentUser;
  },

  // Listen to auth state changes
  onAuthStateChanged(callback: (user: FirebaseUser | null) => void): (() => void) | null {
    if (!firebaseAuth) {
      console.log('⚠️ Firebase Auth not initialized');
      return null;
    }
    
    return onAuthStateChanged(firebaseAuth, callback);
  },

  // Get user profile information
  async getUserProfile(): Promise<{ 
    id: string; 
    email: string | null; 
    name: string; 
    emailVerified: boolean; 
    photoURL: string | null;
    createdAt: string | undefined;
    lastSignIn: string | undefined;
  } | null> {
    const user = this.getCurrentUser();
    if (!user) return null;

    return {
      id: user.uid,
      email: user.email,
      name: user.displayName || user.email?.split('@')[0] || 'Unknown User',
      emailVerified: user.emailVerified,
      photoURL: user.photoURL,
      createdAt: user.metadata.creationTime,
      lastSignIn: user.metadata.lastSignInTime,
    };
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }
};

export default CleanFirebaseAuthService;
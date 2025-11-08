import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  User as FirebaseUser,
  Auth
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, deleteField, Firestore } from 'firebase/firestore';
import { auth, firestore } from './firebase';
import { User, UserRole } from '../types/User';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Type assertion to fix TypeScript errors
const firebaseAuth = auth as Auth;
const firestoreDB = firestore as Firestore;

export class AuthService {
  static async register(email: string, password: string, userData: Partial<User>): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      const firebaseUser = userCredential.user;

      // Update Firebase profile
      await updateProfile(firebaseUser, {
        displayName: userData.name,
      });

      // Create user document in Firestore
      const user: User = {
        id: firebaseUser.uid,
        name: userData.name || '',
        email: email,
        phone: userData.phone || '',
        role: userData.role || UserRole.VICTIM,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...userData,
      };

      // Only add location if it exists
      if (userData.location) {
        user.location = userData.location;
      }

      if (firestoreDB) {
        await setDoc(doc(firestoreDB, 'users', firebaseUser.uid), user);
      }
      await AsyncStorage.setItem('userData', JSON.stringify(user));

      return user;
    } catch (error) {
      // Log silently in development mode only
      if (__DEV__) {
        console.log('Registration error:', (error as any)?.code || (error as any)?.message);
      }
      throw error;
    }
  }

  static async login(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      const firebaseUser = userCredential.user;

      // Get user data from Firestore
      if (!firestoreDB) {
        throw new Error('Firestore not initialized');
      }
      const userDoc = await getDoc(doc(firestoreDB, 'users', firebaseUser.uid));
      
      if (!userDoc.exists()) {
        throw new Error('User data not found');
      }

      const userData = userDoc.data() as User;
      await AsyncStorage.setItem('userData', JSON.stringify(userData));

      return userData;
    } catch (error) {
      // Log silently in development mode only
      if (__DEV__) {
        console.log('Login error:', (error as any)?.code || (error as any)?.message);
      }
      throw error;
    }
  }

  static async logout(): Promise<void> {
    try {
      await signOut(firebaseAuth);
      await AsyncStorage.removeItem('userData');
    } catch (error) {
      // Log silently in development mode only
      if (__DEV__) {
        console.log('Logout error:', (error as any)?.code || (error as any)?.message);
      }
      throw error;
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    try {
      // First check AsyncStorage
      const storedUser = await AsyncStorage.getItem('userData');
      if (storedUser) {
        return JSON.parse(storedUser);
      }

      // If not in storage, check Firebase Auth
      return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
          unsubscribe();
          
          if (firebaseUser && firestoreDB) {
            try {
              const userDoc = await getDoc(doc(firestoreDB, 'users', firebaseUser.uid));
              if (userDoc.exists()) {
                const userData = userDoc.data() as User;
                await AsyncStorage.setItem('userData', JSON.stringify(userData));
                resolve(userData);
              } else {
                resolve(null);
              }
            } catch (error) {
              if (__DEV__) {
                console.log('Error fetching user data:', (error as any)?.code || (error as any)?.message);
              }
              resolve(null);
            }
          } else {
            resolve(null);
          }
        });
      });
    } catch (error) {
      if (__DEV__) {
        console.log('Get current user error:', (error as any)?.code || (error as any)?.message);
      }
      return null;
    }
  }

  static async updateUserProfile(userId: string, updates: Partial<User>): Promise<void> {
    try {
      if (!firestoreDB) {
        throw new Error('Firestore not initialized');
      }
      
      // Handle undefined values by converting them to deleteField()
      const processedUpdates: any = { updatedAt: new Date() };
      
      Object.keys(updates).forEach(key => {
        const value = (updates as any)[key];
        if (value === undefined || value === null) {
          // Use deleteField() to properly remove the field from Firestore
          processedUpdates[key] = deleteField();
        } else {
          processedUpdates[key] = value;
        }
      });
      
      await updateDoc(doc(firestoreDB, 'users', userId), processedUpdates);

      // Update AsyncStorage
      const storedUser = await AsyncStorage.getItem('userData');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        const updatedUser = { ...userData, updatedAt: new Date() };
        
        // Apply updates, removing undefined/null fields from local storage too
        Object.keys(updates).forEach(key => {
          const value = (updates as any)[key];
          if (value === undefined || value === null) {
            delete (updatedUser as any)[key];
          } else {
            (updatedUser as any)[key] = value;
          }
        });
        
        await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
      }
    } catch (error) {
      if (__DEV__) {
        console.log('Update profile error:', (error as any)?.code || (error as any)?.message);
      }
      throw error;
    }
  }

  static async switchRole(userId: string, newRole: UserRole, additionalData?: any): Promise<void> {
    try {
      const updateData: any = {
        role: newRole,
        updatedAt: new Date(),
        ...additionalData,
      };

      await this.updateUserProfile(userId, updateData);
    } catch (error) {
      if (__DEV__) {
        console.log('Switch role error:', (error as any)?.code || (error as any)?.message);
      }
      throw error;
    }
  }

  static async resetPassword(email: string): Promise<void> {
    try {
      if (!firebaseAuth) {
        throw new Error('Firebase Auth not initialized');
      }
      await sendPasswordResetEmail(firebaseAuth, email);
    } catch (error) {
      if (__DEV__) {
        console.log('Password reset error:', (error as any)?.code || (error as any)?.message);
      }
      throw error;
    }
  }
}
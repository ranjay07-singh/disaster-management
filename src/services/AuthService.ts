import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, firestore } from './firebase';
import { User, UserRole } from '../types/User';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class AuthService {
  static async register(email: string, password: string, userData: Partial<User>): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
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

      await setDoc(doc(firestore, 'users', firebaseUser.uid), user);
      await AsyncStorage.setItem('userData', JSON.stringify(user));

      return user;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  static async login(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Get user data from Firestore
      const userDoc = await getDoc(doc(firestore, 'users', firebaseUser.uid));
      
      if (!userDoc.exists()) {
        throw new Error('User data not found');
      }

      const userData = userDoc.data() as User;
      await AsyncStorage.setItem('userData', JSON.stringify(userData));

      return userData;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  static async logout(): Promise<void> {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem('userData');
    } catch (error) {
      console.error('Logout error:', error);
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
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          unsubscribe();
          
          if (firebaseUser) {
            try {
              const userDoc = await getDoc(doc(firestore, 'users', firebaseUser.uid));
              if (userDoc.exists()) {
                const userData = userDoc.data() as User;
                await AsyncStorage.setItem('userData', JSON.stringify(userData));
                resolve(userData);
              } else {
                resolve(null);
              }
            } catch (error) {
              console.error('Error fetching user data:', error);
              resolve(null);
            }
          } else {
            resolve(null);
          }
        });
      });
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  static async updateUserProfile(userId: string, updates: Partial<User>): Promise<void> {
    try {
      await updateDoc(doc(firestore, 'users', userId), {
        ...updates,
        updatedAt: new Date(),
      });

      // Update AsyncStorage
      const storedUser = await AsyncStorage.getItem('userData');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        const updatedUser = { ...userData, ...updates, updatedAt: new Date() };
        await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Update profile error:', error);
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
      console.error('Switch role error:', error);
      throw error;
    }
  }
}
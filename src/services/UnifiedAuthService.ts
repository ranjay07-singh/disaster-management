import { auth } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { AuthenticationService } from './AuthenticationService';
import { AuthService } from './AuthService';
import { User, UserRole } from '../types/User';

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  firebaseUser: FirebaseUser | null;
  authMethod: 'firebase' | 'api' | null;
}

/**
 * Unified Authentication Manager that handles both Firebase and API authentication
 * This service bridges the gap between Firebase auth and API authentication
 */
export class UnifiedAuthService {
  private static authState: AuthState = {
    isAuthenticated: false,
    user: null,
    firebaseUser: null,
    authMethod: null,
  };

  private static listeners: Array<(state: AuthState) => void> = [];

  /**
   * Initialize the unified auth service
   * Sets up Firebase auth listener and API session management
   */
  static initialize(): Promise<void> {
    return new Promise((resolve) => {
      // Listen to Firebase auth state changes
      onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          // Firebase user is logged in
          console.log('🔥 Firebase user authenticated:', firebaseUser.email);
          
          try {
            // Try to get user profile from Firestore
            let userProfile = await AuthService.getCurrentUser();
            
            if (!userProfile) {
              // No profile found - create a default one for existing Firebase users
              console.log('📝 Creating missing user profile for Firebase user');
              
              userProfile = await this.createMissingUserProfile(firebaseUser);
            }
            
            if (userProfile) {
              // Update auth state with Firebase user
              this.authState = {
                isAuthenticated: true,
                user: userProfile,
                firebaseUser: firebaseUser,
                authMethod: 'firebase',
              };

              // Set up API authentication for backward compatibility
              await this.setupAPICredentialsFromFirebase(firebaseUser, userProfile);
              console.log('✅ Firebase authentication setup complete');
              
            } else {
              // Still no profile after creation attempt
              console.log('❌ Failed to create user profile');
              await this.handleAuthenticationFailure('Failed to setup user profile');
            }
          } catch (error) {
            console.error('🚨 Error during Firebase auth setup:', error);
            await this.handleAuthenticationFailure('Authentication setup failed');
          }
        } else {
          // No Firebase user - DO NOT automatically try to restore session
          console.log('No Firebase user authenticated');
          
          // Clear auth state - don't attempt to restore API session automatically
          this.authState = {
            isAuthenticated: false,
            user: null,
            firebaseUser: null,
            authMethod: null,
          };
        }

        // Notify all listeners
        this.notifyListeners();
        resolve();
      });
    });
  }

  /**
   * Set up API credentials based on Firebase user for backward compatibility
   */
  private static async setupAPICredentialsFromFirebase(
    firebaseUser: FirebaseUser, 
    userProfile: User
  ): Promise<void> {
    try {
      // Create API credentials that work with Spring Boot backend
      const mockCredentials = {
        username: 'user', // Use the Spring Boot configured username
        password: 'disaster123', // Fixed password for consistency
      };

      // Store credentials for API service compatibility
      await AuthenticationService.storeCredentials(mockCredentials);
      
      // Convert User to UserProfile format for storage
      const profileForStorage = {
        id: userProfile.id,
        name: userProfile.name,
        email: userProfile.email,
        phone: userProfile.phone,
        role: userProfile.role,
        isActive: userProfile.isActive,
      };
      await AuthenticationService.storeUserProfile(profileForStorage);
      
      // Verify credentials are stored properly
      const storedCreds = await AuthenticationService.getStoredCredentials();
      const storedProfile = await AuthenticationService.getUserProfile();
      
      if (storedCreds && storedProfile) {
        console.log('✅ API credentials set up for Firebase user:', userProfile.name);
        console.log('🔐 Stored credentials:', { username: storedCreds.username, hasPassword: !!storedCreds.password });
      } else {
        throw new Error('Failed to verify stored credentials');
      }
    } catch (error) {
      console.error('❌ Failed to setup API credentials for Firebase user:', error);
      throw error; // Re-throw to trigger fallback handling
    }
  }

  /**
   * Get current authentication state
   */
  static getAuthState(): AuthState {
    return { ...this.authState };
  }

  /**
   * Check if user is authenticated (either Firebase or API)
   */
  static isAuthenticated(): boolean {
    return this.authState.isAuthenticated;
  }

  /**
   * Get current user
   */
  static getCurrentUser(): User | null {
    return this.authState.user;
  }

  /**
   * Get authentication headers for API calls
   * Works for both Firebase and API authenticated users
   */
  static async getAuthHeaders(): Promise<Record<string, string>> {
    if (!this.authState.isAuthenticated) {
      throw new Error('No user is currently authenticated. Please log in to continue.');
    }

    try {
      // For Spring Boot backend, always use Basic Authentication
      if (this.authState.authMethod === 'firebase' || this.authState.authMethod === 'api') {
        // Use stored API credentials (Basic Auth compatible)
        const headers = await AuthenticationService.getAuthHeaders();
        
        // Verify headers are properly formatted
        if (!headers.Authorization) {
          console.error('❌ No Authorization header found, regenerating credentials');
          
          // If Firebase user is still authenticated, re-setup API credentials
          if (this.authState.firebaseUser && this.authState.user) {
            await this.setupAPICredentialsFromFirebase(this.authState.firebaseUser, this.authState.user);
            return await AuthenticationService.getAuthHeaders();
          } else {
            throw new Error('Authentication credentials missing');
          }
        }
        
        console.log('🔐 Using auth headers for:', this.authState.user?.name);
        return headers;
      } else {
        throw new Error('No valid authentication method available');
      }
    } catch (error) {
      console.error('❌ Failed to get auth headers:', error);
      
      // If Firebase user is still authenticated, try to re-setup credentials
      if (this.authState.firebaseUser && this.authState.user) {
        console.log('🔄 Attempting to re-setup API credentials for Firebase user');
        try {
          await this.setupAPICredentialsFromFirebase(this.authState.firebaseUser, this.authState.user);
          return await AuthenticationService.getAuthHeaders();
        } catch (retryError) {
          console.error('❌ Retry failed:', retryError);
        }
      }
      
      throw new Error('Authentication expired. Please log in again.');
    }
  }

  /**
   * Login with Firebase
   */
  static async loginWithFirebase(email: string, password: string): Promise<User> {
    try {
      console.log('🔐 Attempting Firebase login for:', email);
      const user = await AuthService.login(email, password);
      console.log('✅ Firebase login successful for:', user.email);
      return user;
    } catch (error) {
      console.log('🔥 Firebase Auth Info:', error instanceof Error ? error.message : 'Unknown error');
      
      // Handle specific Firebase auth errors
      if (error instanceof Error) {
        if (error.message === 'User data not found') {
          // This means Firebase auth succeeded but no Firestore profile exists
          // The onAuthStateChanged listener should handle this case
          throw new Error('Please wait while we set up your account profile...');
        } else if (error.message.includes('auth/user-not-found')) {
          throw new Error('No account found with this email address. Please check your email or create a new account.');
        } else if (error.message.includes('auth/wrong-password') || error.message.includes('auth/invalid-credential')) {
          throw new Error('Incorrect email or password. Please check your credentials and try again.');
        } else if (error.message.includes('auth/too-many-requests')) {
          throw new Error('Too many failed login attempts. Please wait a few minutes before trying again.');
        } else if (error.message.includes('auth/network-request-failed')) {
          throw new Error('Network error. Please check your internet connection and try again.');
        }
      }
      
      console.error('❌ Firebase login failed:', error);
      throw error;
    }
  }

  /**
   * Login with API
   */
  static async loginWithAPI(username: string, password: string): Promise<boolean> {
    try {
      const success = await AuthenticationService.login(username, password);
      if (success) {
        // Update auth state
        const userProfile = await AuthenticationService.getUserProfile();
        if (userProfile) {
          // Convert UserProfile to User type
          const user: User = {
            ...userProfile,
            phone: userProfile.phone || 'Not provided',
            role: userProfile.role as UserRole,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          this.authState = {
            isAuthenticated: true,
            user: user,
            firebaseUser: null,
            authMethod: 'api',
          };
          
          console.log('✅ API authentication successful for:', user.name);
          this.notifyListeners();
        }
      }
      return success;
    } catch (error) {
      console.error('API login failed:', error);
      throw error;
    }
  }

  /**
   * Direct login for development/testing - bypasses Firebase
   */
  static async loginDirect(username: string, password: string): Promise<boolean> {
    try {
      // Store credentials directly for API compatibility
      await AuthenticationService.storeCredentials({ username, password });
      
      // Create a basic user profile for API authentication
      const userProfile = {
        id: Date.now().toString(),
        name: username === 'user' ? 'API User' : username.split('@')[0] || 'User',
        email: username.includes('@') ? username : `${username}@disastermanagement.com`,
        phone: 'Not provided',
        role: username.includes('admin') ? 'monitoring' as const : 'victim' as const,
        isActive: true,
      };

      await AuthenticationService.storeUserProfile(userProfile);

      // Convert to User type and update auth state
      const user: User = {
        ...userProfile,
        role: userProfile.role as UserRole,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.authState = {
        isAuthenticated: true,
        user: user,
        firebaseUser: null,
        authMethod: 'api',
      };

      console.log('✅ Direct authentication successful for:', user.name);
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('Direct login failed:', error);
      return false;
    }
  }

  /**
   * Register with Firebase
   */
  static async registerWithFirebase(email: string, password: string, userData: any): Promise<User> {
    try {
      console.log('📝 Attempting Firebase registration for:', email);
      const user = await AuthService.register(email, password, userData);
      console.log('✅ Firebase registration successful for:', user.email);
      return user;
    } catch (error) {
      console.log('🔥 Firebase Auth Info:', (error as any)?.code || (error instanceof Error ? error.message : 'Unknown error'));
      
      // Handle specific Firebase registration errors
      if (error instanceof Error || (error as any)?.code) {
        const errorCode = (error as any)?.code || '';
        const errorMessage = (error as Error)?.message || '';
        
        if (errorCode === 'auth/email-already-in-use' || errorMessage.includes('email-already-in-use')) {
          throw new Error('An account with this email already exists. Please use the login option instead, or try a different email address.');
        } else if (errorCode === 'auth/weak-password' || errorMessage.includes('weak-password')) {
          throw new Error('Password is too weak. Please use at least 6 characters with a mix of letters and numbers.');
        } else if (errorCode === 'auth/invalid-email' || errorMessage.includes('invalid-email')) {
          throw new Error('Please enter a valid email address (e.g., example@email.com).');
        } else if (errorCode === 'auth/network-request-failed' || errorMessage.includes('network')) {
          throw new Error('Network error. Please check your internet connection and try again.');
        }
      }
      
      console.error('❌ Firebase registration failed:', error);
      throw error;
    }
  }

  /**
   * Logout from both Firebase and API
   */
  static async logout(): Promise<void> {
    try {
      console.log('🚪 Starting logout process...');
      
      // Logout from Firebase if authenticated
      if (this.authState.firebaseUser) {
        console.log('🔥 Logging out from Firebase...');
        await AuthService.logout();
      }

      // Logout from API if authenticated - ALWAYS clear stored credentials
      console.log('🗑️ Clearing all stored credentials...');
      await AuthenticationService.logout();

      // Clear auth state
      this.authState = {
        isAuthenticated: false,
        user: null,
        firebaseUser: null,
        authMethod: null,
      };

      console.log('✅ User logged out successfully');
      this.notifyListeners();
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails, clear the local state
      this.authState = {
        isAuthenticated: false,
        user: null,
        firebaseUser: null,
        authMethod: null,
      };
      this.notifyListeners();
      throw error;
    }
  }

  /**
   * Add auth state listener
   */
  static addAuthStateListener(callback: (state: AuthState) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  /**
   * Notify all listeners of auth state changes
   */
  private static notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.authState);
      } catch (error) {
        console.error('Error in auth state listener:', error);
      }
    });
  }

  /**
   * Create a missing user profile for existing Firebase users
   */
  private static async createMissingUserProfile(firebaseUser: FirebaseUser): Promise<User | null> {
    try {
      // Create a basic user profile from Firebase user data
      const userData = {
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        phone: firebaseUser.phoneNumber || '',
        role: UserRole.VICTIM, // Default role
      };

      // Use AuthService to create the profile in Firestore
      const user = await AuthService.register(firebaseUser.email!, 'firebase_user', userData);
      console.log('✅ Created missing user profile:', user.email);
      return user;
    } catch (error) {
      console.error('❌ Failed to create missing user profile:', error);
      
      // Fallback: create minimal user object
      const fallbackUser: User = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        email: firebaseUser.email || 'unknown@email.com',
        phone: firebaseUser.phoneNumber || 'Not provided',
        role: UserRole.VICTIM,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      console.log('🔄 Using fallback user profile');
      return fallbackUser;
    }
  }

  /**
   * Handle authentication failures gracefully
   */
  private static async handleAuthenticationFailure(reason: string): Promise<void> {
    console.error('🚨 Authentication failure:', reason);
    
    // Clear any existing authentication state
    this.clearAuthState();
    
    // Could trigger a logout or redirect to login screen
    // For now, just ensure clean state
  }

  /**
   * Clear authentication state
   */
  private static clearAuthState(): void {
    this.authState = {
      isAuthenticated: false,
      user: null,
      firebaseUser: null,
      authMethod: null,
    };
  }

  /**
   * Refresh authentication credentials when they expire
   */
  static async refreshAuthentication(): Promise<boolean> {
    console.log('🔄 Attempting to refresh authentication...');
    
    try {
      // If Firebase user is still authenticated, re-setup API credentials
      if (this.authState.firebaseUser && this.authState.user) {
        await this.setupAPICredentialsFromFirebase(this.authState.firebaseUser, this.authState.user);
        console.log('✅ Authentication refreshed successfully');
        return true;
      } else {
        console.log('❌ No Firebase user available for refresh');
        return false;
      }
    } catch (error) {
      console.error('❌ Authentication refresh failed:', error);
      return false;
    }
  }

  /**
   * Handle HTTP 401 errors by attempting to refresh authentication
   */
  static async handleAuthenticationExpiry(): Promise<boolean> {
    console.log('🔑 Handling authentication expiry...');
    
    const refreshed = await this.refreshAuthentication();
    if (!refreshed) {
      // Don't clear auth state here - it will cause auto re-login loop
      // Just return false and let the API call handle the error
      console.log('⚠️ Authentication refresh failed - user needs to log in again');
    }
    
    return refreshed;
  }

  /**
   * Handle authentication errors gracefully
   */
  static handleAuthError(error: any): string {
    console.error('Authentication error:', error);
    
    if (error?.message?.includes('session has expired') || error?.message?.includes('HTTP 401')) {
      return 'Authentication expired. Please log in again.';
    } else if (error?.message?.includes('No user is currently authenticated')) {
      return 'Please log in to access this feature.';
    } else if (error?.code?.startsWith('auth/')) {
      // Firebase errors
      const firebaseErrors: Record<string, string> = {
        'auth/user-not-found': 'No account found with this email address.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/invalid-credential': 'Invalid email or password.',
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/weak-password': 'Password is too weak.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/network-request-failed': 'Network error. Please check your connection.',
      };
      return firebaseErrors[error.code] || 'Authentication failed. Please try again.';
    } else {
      return error?.message || 'An unexpected error occurred. Please try again.';
    }
  }
}
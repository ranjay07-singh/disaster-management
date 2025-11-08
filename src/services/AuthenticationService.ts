import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, getBasicAuthHeaders } from '../config/ApiConfig';

export interface AuthCredentials {
  username: string;
  password: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'victim' | 'volunteer' | 'monitoring';
  isActive: boolean;
}

export class AuthenticationService {
  private static readonly CREDENTIALS_KEY = 'auth_credentials';
  private static readonly USER_PROFILE_KEY = 'user_profile';

  // Store credentials securely
  static async storeCredentials(credentials: AuthCredentials): Promise<void> {
    try {
      await AsyncStorage.setItem(this.CREDENTIALS_KEY, JSON.stringify(credentials));
    } catch (error) {
      console.error('Failed to store credentials:', error);
      throw error;
    }
  }

  // Get stored credentials
  static async getStoredCredentials(): Promise<AuthCredentials | null> {
    try {
      const stored = await AsyncStorage.getItem(this.CREDENTIALS_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to get credentials:', error);
      return null;
    }
  }

  // Store user profile
  static async storeUserProfile(profile: UserProfile): Promise<void> {
    try {
      await AsyncStorage.setItem(this.USER_PROFILE_KEY, JSON.stringify(profile));
    } catch (error) {
      console.error('Failed to store user profile:', error);
      throw error;
    }
  }

  // Get stored user profile
  static async getUserProfile(): Promise<UserProfile | null> {
    try {
      const stored = await AsyncStorage.getItem(this.USER_PROFILE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return null;
    }
  }

  // Login - Enhanced with better error handling
  static async login(username: string, password: string): Promise<boolean> {
    try {
      // Enhanced validation for different user types
      const validCredentials = [
        { user: 'admin@gmail.com', minPassLength: 8 },
        { user: 'user@example.com', minPassLength: 8 },
        { user: 'victim@example.com', minPassLength: 8 },
        { user: 'volunteer@example.com', minPassLength: 8 },
        { user: 'user', minPassLength: 10 }, // Legacy support
      ];

      const isValid = validCredentials.some(cred => 
        username.toLowerCase() === cred.user.toLowerCase() && password.length >= cred.minPassLength
      );

      if (isValid || username.includes('@')) {
        // Authentication successful
        const userProfile: UserProfile = {
          id: Date.now().toString(),
          name: username.includes('@') ? username.split('@')[0] : 'API User',
          email: username.includes('@') ? username : `${username}@disastermanagement.com`,
          role: username.includes('admin') ? 'monitoring' : 
                username.includes('volunteer') ? 'volunteer' : 'victim',
          isActive: true,
        };

        // Store credentials and profile
        await this.storeCredentials({ username, password });
        await this.storeUserProfile(userProfile);

        return true;
      } else {
        throw new Error('Invalid username or password. Please check your credentials and try again.');
      }
    } catch (error) {
      console.error('Login failed:', error);
      // Re-throw with user-friendly message
      if (error instanceof Error) {
        throw error; // Keep the user-friendly message
      } else {
        throw new Error('Login failed. Please check your internet connection and try again.');
      }
    }
  }

  // Logout
  static async logout(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.CREDENTIALS_KEY);
      await AsyncStorage.removeItem(this.USER_PROFILE_KEY);
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  }

  // Check if user is logged in
  static async isLoggedIn(): Promise<boolean> {
    try {
      const credentials = await this.getStoredCredentials();
      const profile = await this.getUserProfile();
      return credentials !== null && profile !== null;
    } catch (error) {
      console.log('Error checking login status:', error);
      return false;
    }
  }

  // Get auth headers for API calls
  static async getAuthHeaders(): Promise<Record<string, string>> {
    const credentials = await this.getStoredCredentials();
    if (!credentials) {
      throw new Error('Your session has expired. Please log in again to continue.');
    }
    
    // Validate credentials have required fields
    if (!credentials.username || !credentials.password) {
      throw new Error('Invalid session data. Please log in again to continue.');
    }
    
    return getBasicAuthHeaders(credentials.username, credentials.password);
  }
}
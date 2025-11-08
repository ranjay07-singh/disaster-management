import { AuthService } from './AuthService';
import { User, UserRole } from '../types/User';

export class FirebaseUserService {
  
  /**
   * Register a new user with Firebase Auth + Firestore
   */
  static async registerUser(userData: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    phone: string;
    role: 'victim' | 'volunteer' | 'monitoring';
  }): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      // Basic validation
      if (userData.password !== userData.confirmPassword) {
        return { success: false, message: 'Passwords do not match' };
      }

      if (userData.password.length < 8) {
        return { success: false, message: 'Password must be at least 8 characters long' };
      }

      // Convert role string to UserRole enum
      let userRole: UserRole;
      switch (userData.role) {
        case 'victim':
          userRole = UserRole.VICTIM;
          break;
        case 'volunteer':
          userRole = UserRole.VOLUNTEER;
          break;
        case 'monitoring':
          userRole = UserRole.MONITORING;
          break;
        default:
          userRole = UserRole.VICTIM;
      }

      // Register with Firebase
      const user = await AuthService.register(userData.email, userData.password, {
        name: userData.name,
        phone: userData.phone,
        role: userRole,
      });

      return { 
        success: true, 
        message: 'User registered successfully', 
        user 
      };

    } catch (error: any) {
      let errorMessage = 'Registration failed';
      
      if (error?.code === 'auth/email-already-in-use') {
        errorMessage = 'Email is already registered';
      } else if (error?.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
      } else if (error?.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error?.message) {
        errorMessage = error.message;
      }

      return { success: false, message: errorMessage };
    }
  }

  /**
   * Login user with Firebase Auth
   */
  static async loginUser(credentials: {
    email: string;
    password: string;
  }): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      const user = await AuthService.login(credentials.email, credentials.password);
      
      return { 
        success: true, 
        message: 'Login successful', 
        user 
      };

    } catch (error: any) {
      let errorMessage = 'Login failed';
      
      if (error?.code === 'auth/invalid-credential' || error?.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password';
      } else if (error?.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (error?.message === 'User data not found') {
        errorMessage = 'User profile not found. Please register again.';
      } else if (error?.message) {
        errorMessage = error.message;
      }

      return { success: false, message: errorMessage };
    }
  }

  /**
   * Check if email exists (by trying to send password reset)
   */
  static async isEmailExists(email: string): Promise<boolean> {
    try {
      // Try to send password reset email
      // If email doesn't exist, Firebase will throw error
      await AuthService.resetPassword(email);
      return true; // Email exists
    } catch (error: any) {
      if (error?.code === 'auth/user-not-found') {
        return false; // Email doesn't exist
      }
      // For other errors, assume email exists
      return true;
    }
  }

  /**
   * Reset password using Firebase
   */
  static async resetPassword(email: string): Promise<{ success: boolean; message: string }> {
    try {
      await AuthService.resetPassword(email);
      return { 
        success: true, 
        message: 'Password reset email sent successfully' 
      };
    } catch (error: any) {
      let errorMessage = 'Failed to send password reset email';
      
      if (error?.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address';
      } else if (error?.message) {
        errorMessage = error.message;
      }

      return { success: false, message: errorMessage };
    }
  }

  /**
   * Get current user
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      return await AuthService.getCurrentUser();
    } catch (error) {
      console.log('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Logout user
   */
  static async logout(): Promise<void> {
    try {
      await AuthService.logout();
    } catch (error) {
      console.log('Logout error:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(userId: string, updates: Partial<User>): Promise<{ success: boolean; message: string }> {
    try {
      await AuthService.updateUserProfile(userId, updates);
      return { success: true, message: 'Profile updated successfully' };
    } catch (error: any) {
      return { 
        success: false, 
        message: error?.message || 'Failed to update profile' 
      };
    }
  }

  /**
   * Switch user role
   */
  static async switchRole(userId: string, newRole: UserRole, additionalData?: any): Promise<{ success: boolean; message: string }> {
    try {
      await AuthService.switchRole(userId, newRole, additionalData);
      return { success: true, message: 'Role switched successfully' };
    } catch (error: any) {
      return { 
        success: false, 
        message: error?.message || 'Failed to switch role' 
      };
    }
  }
}

export default FirebaseUserService;
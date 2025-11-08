import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, getBasicAuthHeaders } from '../config/ApiConfig';

export interface UserRegistrationData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  phone: string;
  role: 'victim' | 'volunteer' | 'monitoring';
}

export interface LoginData {
  email: string;
  password: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'victim' | 'volunteer' | 'monitoring';
  isActive: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: string;
}

export class UserService {
  private static readonly USERS_STORAGE_KEY = 'registered_users';
  private static readonly CURRENT_USER_KEY = 'current_user';

  // Validation methods
  static validateEmail(email: string): { isValid: boolean; message: string } {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      return { isValid: false, message: 'Email is required' };
    }
    if (!emailRegex.test(email.trim())) {
      return { isValid: false, message: 'Please enter a valid email address' };
    }
    return { isValid: true, message: '' };
  }

  static validatePhone(phone: string): { isValid: boolean; message: string } {
    const phoneRegex = /^[+]?[\d\s\-\(\)]{10,}$/;
    if (!phone.trim()) {
      return { isValid: false, message: 'Phone number is required' };
    }
    if (!phoneRegex.test(phone.trim())) {
      return { isValid: false, message: 'Please enter a valid phone number (at least 10 digits)' };
    }
    return { isValid: true, message: '' };
  }

  static validatePassword(password: string): { isValid: boolean; message: string } {
    if (!password) {
      return { isValid: false, message: 'Password is required' };
    }
    if (password.length < 8) {
      return { isValid: false, message: 'Password must be at least 8 characters long' };
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return { isValid: false, message: 'Password must contain uppercase, lowercase, and numbers' };
    }
    return { isValid: true, message: '' };
  }

  static validateName(name: string): { isValid: boolean; message: string } {
    if (!name.trim()) {
      return { isValid: false, message: 'Full name is required' };
    }
    if (name.trim().length < 2) {
      return { isValid: false, message: 'Name must be at least 2 characters long' };
    }
    if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
      return { isValid: false, message: 'Name can only contain letters and spaces' };
    }
    return { isValid: true, message: '' };
  }

  // Get all registered users
  static async getRegisteredUsers(): Promise<UserProfile[]> {
    try {
      const stored = await AsyncStorage.getItem(this.USERS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get users:', error);
      return [];
    }
  }

  // Check if email exists
  static async isEmailExists(email: string): Promise<boolean> {
    const users = await this.getRegisteredUsers();
    return users.some(user => user.email.toLowerCase() === email.toLowerCase());
  }

  // Check if phone exists
  static async isPhoneExists(phone: string): Promise<boolean> {
    const users = await this.getRegisteredUsers();
    return users.some(user => user.phone === phone);
  }

  // Register new user
  static async registerUser(data: UserRegistrationData): Promise<{ success: boolean; message: string; user?: UserProfile }> {
    try {
      // Validate input data
      const emailValidation = this.validateEmail(data.email);
      if (!emailValidation.isValid) {
        return { success: false, message: emailValidation.message };
      }

      const phoneValidation = this.validatePhone(data.phone);
      if (!phoneValidation.isValid) {
        return { success: false, message: phoneValidation.message };
      }

      const nameValidation = this.validateName(data.name);
      if (!nameValidation.isValid) {
        return { success: false, message: nameValidation.message };
      }

      const passwordValidation = this.validatePassword(data.password);
      if (!passwordValidation.isValid) {
        return { success: false, message: passwordValidation.message };
      }

      if (data.password !== data.confirmPassword) {
        return { success: false, message: 'Passwords do not match' };
      }

      // Check for existing email
      if (await this.isEmailExists(data.email)) {
        return { success: false, message: 'Email address is already registered' };
      }

      // Check for existing phone
      if (await this.isPhoneExists(data.phone)) {
        return { success: false, message: 'Phone number is already registered' };
      }

      // Create new user
      const newUser: UserProfile = {
        id: Date.now().toString(),
        name: data.name.trim(),
        email: data.email.toLowerCase().trim(),
        phone: data.phone.trim(),
        role: data.role,
        isActive: true,
        isEmailVerified: false,
        isPhoneVerified: false,
        createdAt: new Date().toISOString(),
      };

      // Store password separately (in production, hash it)
      const hashedPassword = btoa(data.password); // Simple encoding, use proper hashing in production

      // Get existing users and add new one
      const users = await this.getRegisteredUsers();
      users.push(newUser);
      await AsyncStorage.setItem(this.USERS_STORAGE_KEY, JSON.stringify(users));

      // Store password mapping
      const passwordData = await this.getPasswordData();
      passwordData[newUser.email] = hashedPassword;
      await AsyncStorage.setItem('user_passwords', JSON.stringify(passwordData));

      return { 
        success: true, 
        message: 'Registration successful! Please verify your email and phone.', 
        user: newUser 
      };
    } catch (error) {
      console.error('Registration failed:', error);
      return { success: false, message: 'Registration failed. Please try again.' };
    }
  }

  // Login user
  static async loginUser(data: LoginData): Promise<{ success: boolean; message: string; user?: UserProfile }> {
    try {
      const emailValidation = this.validateEmail(data.email);
      if (!emailValidation.isValid) {
        return { success: false, message: emailValidation.message };
      }

      const users = await this.getRegisteredUsers();
      const user = users.find(u => u.email.toLowerCase() === data.email.toLowerCase());

      if (!user) {
        return { success: false, message: 'No account found with this email address' };
      }

      // Check password
      const passwordData = await this.getPasswordData();
      const storedPassword = passwordData[user.email];
      const enteredPassword = btoa(data.password);

      if (storedPassword !== enteredPassword) {
        return { success: false, message: 'Invalid password' };
      }

      if (!user.isActive) {
        return { success: false, message: 'Your account has been deactivated. Please contact support.' };
      }

      // Store current user
      await AsyncStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));

      return { 
        success: true, 
        message: 'Login successful!', 
        user 
      };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, message: 'Login failed. Please try again.' };
    }
  }

  // Get current user
  static async getCurrentUser(): Promise<UserProfile | null> {
    try {
      const stored = await AsyncStorage.getItem(this.CURRENT_USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  // Reset password
  static async resetPassword(email: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const passwordValidation = this.validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        return { success: false, message: passwordValidation.message };
      }

      const users = await this.getRegisteredUsers();
      const userIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());

      if (userIndex === -1) {
        return { success: false, message: 'No account found with this email address' };
      }

      // Update password
      const passwordData = await this.getPasswordData();
      passwordData[email.toLowerCase()] = btoa(newPassword);
      await AsyncStorage.setItem('user_passwords', JSON.stringify(passwordData));

      return { 
        success: true, 
        message: 'Password reset successful! You can now login with your new password.' 
      };
    } catch (error) {
      console.error('Password reset failed:', error);
      return { success: false, message: 'Password reset failed. Please try again.' };
    }
  }

  // Logout
  static async logout(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.CURRENT_USER_KEY);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  // Get password data
  private static async getPasswordData(): Promise<Record<string, string>> {
    try {
      const stored = await AsyncStorage.getItem('user_passwords');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      return {};
    }
  }

  // Verify email
  static async verifyEmail(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const users = await this.getRegisteredUsers();
      const userIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());

      if (userIndex === -1) {
        return { success: false, message: 'User not found' };
      }

      users[userIndex].isEmailVerified = true;
      await AsyncStorage.setItem(this.USERS_STORAGE_KEY, JSON.stringify(users));

      // Update current user if it's the same
      const currentUser = await this.getCurrentUser();
      if (currentUser && currentUser.email === email) {
        currentUser.isEmailVerified = true;
        await AsyncStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(currentUser));
      }

      return { success: true, message: 'Email verified successfully!' };
    } catch (error) {
      console.error('Email verification failed:', error);
      return { success: false, message: 'Email verification failed. Please try again.' };
    }
  }
}
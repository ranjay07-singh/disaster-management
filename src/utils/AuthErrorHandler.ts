import { Alert } from 'react-native';

export interface AuthError {
  code?: string;
  message: string;
  type: 'firebase' | 'api' | 'validation' | 'network' | 'unknown';
}

export class AuthErrorHandler {
  /**
   * Handles and displays authentication errors in a user-friendly way
   */
  static handleAuthError(error: any, context: string = 'Authentication'): void {
    const authError = this.parseError(error);
    const title = this.getErrorTitle(authError.type);
    const message = this.getUserFriendlyMessage(authError);
    
    Alert.alert(title, message, [
      { text: 'OK', style: 'default' },
      { 
        text: 'Get Help', 
        style: 'default',
        onPress: () => this.showHelp(authError.type)
      }
    ]);
  }

  /**
   * Parses different types of errors into a standardized format
   */
  private static parseError(error: any): AuthError {
    // Firebase errors
    if (error?.code?.startsWith('auth/')) {
      return {
        code: error.code,
        message: error.message,
        type: 'firebase'
      };
    }

    // API errors
    if (typeof error === 'string') {
      if (error.includes('credentials') || error.includes('session')) {
        return { message: error, type: 'api' };
      }
      if (error.includes('network') || error.includes('connection')) {
        return { message: error, type: 'network' };
      }
      if (error.includes('password') || error.includes('username') || error.includes('email')) {
        return { message: error, type: 'validation' };
      }
    }

    // Error objects
    if (error instanceof Error) {
      return this.parseError(error.message);
    }

    // Unknown errors
    return {
      message: 'An unexpected error occurred. Please try again.',
      type: 'unknown'
    };
  }

  /**
   * Gets appropriate title for error type
   */
  private static getErrorTitle(type: AuthError['type']): string {
    switch (type) {
      case 'firebase': return '🔥 Authentication Issue';
      case 'api': return '🔐 Session Problem';
      case 'validation': return '❌ Input Error';
      case 'network': return '🌐 Connection Issue';
      default: return '⚠️ Unexpected Error';
    }
  }

  /**
   * Converts technical errors to user-friendly messages
   */
  private static getUserFriendlyMessage(authError: AuthError): string {
    // Firebase-specific errors
    if (authError.type === 'firebase' && authError.code) {
      const firebaseMessages: Record<string, string> = {
        'auth/user-not-found': 'No account found with this email address. Please check your email or create a new account.',
        'auth/wrong-password': 'Incorrect password. Please try again or use "Forgot Password" to reset it.',
        'auth/invalid-credential': 'The email or password you entered is incorrect. Please double-check and try again.',
        'auth/email-already-in-use': 'An account with this email already exists. Try logging in instead, or use "Forgot Password" if you don\'t remember your password.',
        'auth/weak-password': 'Your password is too weak. Please choose a stronger password with at least 6 characters.',
        'auth/invalid-email': 'Please enter a valid email address (e.g., example@email.com).',
        'auth/user-disabled': 'This account has been temporarily disabled. Please contact support for assistance.',
        'auth/too-many-requests': 'Too many failed attempts. Please wait a few minutes before trying again.',
        'auth/network-request-failed': 'Network error. Please check your internet connection and try again.',
        'auth/requires-recent-login': 'For security reasons, please log out and log back in before making this change.'
      };

      return firebaseMessages[authError.code] || authError.message;
    }

    // Return the original message for other types (already user-friendly)
    return authError.message;
  }

  /**
   * Shows context-specific help based on error type
   */
  private static showHelp(type: AuthError['type']): void {
    let helpMessage = '';
    let helpTitle = '';

    switch (type) {
      case 'firebase':
        helpTitle = '🔥 Firebase Authentication Help';
        helpMessage = `Common solutions:
        
• Check your internet connection
• Verify your email address format
• Ensure password meets requirements (6+ characters)
• Try logging out and back in
• Clear app data if problems persist

Need more help? Contact our support team.`;
        break;

      case 'api':
        helpTitle = '🔐 Session Help';
        helpMessage = `Session issues can be resolved by:
        
• Logging out and logging back in
• Checking your internet connection
• Clearing app cache/data
• Ensuring app is up to date

If problems persist, contact technical support.`;
        break;

      case 'validation':
        helpTitle = '❌ Input Help';
        helpMessage = `Please check:
        
• Email format: example@email.com
• Password: At least 6 characters
• All required fields are filled
• No special characters in name fields

Try correcting the highlighted fields.`;
        break;

      case 'network':
        helpTitle = '🌐 Connection Help';
        helpMessage = `Network troubleshooting:
        
• Check WiFi/mobile data connection
• Try switching between WiFi and mobile data
• Restart the app
• Check if other apps work
• Wait a few minutes and try again

Contact your ISP if connection issues persist.`;
        break;

      default:
        helpTitle = '⚠️ General Help';
        helpMessage = `General troubleshooting steps:
        
• Restart the app completely
• Check your internet connection
• Try logging out and back in
• Clear app cache/data
• Update to the latest app version

Contact Support:
📧 support@disastermanagement.com
📞 1-800-DISASTER
🌐 www.disastermanagement.com/help`;
        break;
    }

    Alert.alert(helpTitle, helpMessage, [
      { text: 'Got it', style: 'default' }
    ]);
  }

  /**
   * Quick method to show network error
   */
  static showNetworkError(): void {
    Alert.alert(
      '🌐 No Internet Connection',
      'Please check your internet connection and try again.',
      [{ text: 'OK', style: 'default' }]
    );
  }

  /**
   * Quick method to show validation error
   */
  static showValidationError(field: string, requirement: string): void {
    Alert.alert(
      `❌ Invalid ${field}`,
      requirement,
      [{ text: 'OK', style: 'default' }]
    );
  }

  /**
   * Quick method to show success message
   */
  static showSuccess(title: string, message: string): void {
    Alert.alert(
      `✅ ${title}`,
      message,
      [{ text: 'Continue', style: 'default' }]
    );
  }
}
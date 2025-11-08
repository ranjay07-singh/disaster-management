import { Alert } from 'react-native';

/**
 * Professional error handling and user feedback system
 * Provides graceful degradation and user-friendly error messages
 */
export class ProfessionalErrorHandler {
  
  private static isServerDown = false;
  private static lastServerCheck = 0;
  private static readonly SERVER_CHECK_INTERVAL = 30000; // 30 seconds

  /**
   * Handle authentication errors with professional user feedback
   */
  static handleAuthError(error: any, context: string = 'Authentication'): void {
    // Use console.log instead of console.error to avoid red error screen in production
    console.log(`[${context}] Error:`, error);
    
    const errorInfo = this.parseError(error);
    
    if (errorInfo.isRecoverable) {
      this.showRecoverableError(errorInfo);
    } else {
      this.showCriticalError(errorInfo);
    }
  }

  /**
   * Handle API errors with fallback mechanisms
   */
  static async handleApiError(error: any, fallbackAction?: () => Promise<any>): Promise<any> {
    // Use console.log instead of console.error to avoid red error screen in production
    console.log('[API] Error:', error);
    
    const errorInfo = this.parseError(error);
    
    // Check if server is down
    if (errorInfo.isServerError) {
      this.isServerDown = true;
      this.lastServerCheck = Date.now();
      
      if (fallbackAction) {
        console.log('🔄 Attempting fallback action...');
        try {
          return await fallbackAction();
        } catch (fallbackError) {
          console.log('[API] Fallback also failed:', fallbackError);
        }
      }
      
      this.showServerDownDialog();
      throw new Error('Service temporarily unavailable. Using offline mode.');
    }
    
    throw error;
  }

  /**
   * Parse different types of errors into structured format
   */
  private static parseError(error: any): ErrorInfo {
    // Firebase Auth errors
    if (error?.code?.startsWith('auth/')) {
      return {
        type: 'firebase_auth',
        code: error.code,
        message: this.getFirebaseAuthMessage(error.code),
        isRecoverable: true,
        isServerError: false,
        userAction: this.getFirebaseAuthAction(error.code)
      };
    }

    // HTTP errors
    if (error?.message?.includes('HTTP')) {
      const statusMatch = error.message.match(/HTTP (\d+)/);
      const status = statusMatch ? parseInt(statusMatch[1]) : 0;
      
      return {
        type: 'http',
        code: `HTTP_${status}`,
        message: this.getHttpErrorMessage(status),
        isRecoverable: status < 500,
        isServerError: status >= 500,
        userAction: this.getHttpErrorAction(status)
      };
    }

    // Network errors
    if (error?.message?.includes('fetch') || error?.message?.includes('network')) {
      return {
        type: 'network',
        code: 'NETWORK_ERROR',
        message: 'Unable to connect to the server. Please check your internet connection.',
        isRecoverable: true,
        isServerError: false,
        userAction: 'Check your internet connection and try again.'
      };
    }

    // User data errors
    if (error?.message?.includes('User data not found')) {
      return {
        type: 'user_data',
        code: 'USER_DATA_MISSING',
        message: 'Your account profile is being set up. Please wait a moment.',
        isRecoverable: true,
        isServerError: false,
        userAction: 'Please wait while we complete your account setup.'
      };
    }

    // Generic errors
    return {
      type: 'generic',
      code: 'UNKNOWN_ERROR',
      message: error?.message || 'An unexpected error occurred.',
      isRecoverable: true,
      isServerError: false,
      userAction: 'Please try again. If the problem persists, contact support.'
    };
  }

  /**
   * Show recoverable error with helpful actions
   */
  private static showRecoverableError(errorInfo: ErrorInfo): void {
    Alert.alert(
      '⚠️ Temporary Issue',
      `${errorInfo.message}\n\n${errorInfo.userAction}`,
      [
        { text: 'Try Again', style: 'default' },
        { text: 'Get Help', onPress: () => this.showHelpDialog(errorInfo) }
      ]
    );
  }

  /**
   * Show critical error with support options
   */
  private static showCriticalError(errorInfo: ErrorInfo): void {
    Alert.alert(
      '🚨 Service Issue',
      `${errorInfo.message}\n\nWe're working to resolve this issue.`,
      [
        { text: 'OK', style: 'default' },
        { text: 'Contact Support', onPress: () => this.showSupportOptions() }
      ]
    );
  }

  /**
   * Show server down dialog with status updates
   */
  private static showServerDownDialog(): void {
    Alert.alert(
      '🔧 Server Maintenance',
      'Our servers are temporarily unavailable. This may be due to maintenance or high traffic.\n\nThe app will continue to work with limited functionality.',
      [
        { text: 'Continue Offline', style: 'default' },
        { text: 'Check Status', onPress: () => this.checkServerStatus() }
      ]
    );
  }

  /**
   * Show help dialog for specific error types
   */
  private static showHelpDialog(errorInfo: ErrorInfo): void {
    let helpMessage = '';
    
    switch (errorInfo.type) {
      case 'firebase_auth':
        helpMessage = `Authentication Help:
        
• Double-check your email and password
• Ensure you have a stable internet connection
• Try resetting your password if needed
• Contact support if you continue having issues

For immediate help: support@disastermanagement.com`;
        break;
        
      case 'network':
        helpMessage = `Network Troubleshooting:
        
• Check your WiFi or mobile data connection
• Try switching between WiFi and mobile data
• Restart the app and try again
• Check if other apps can connect to the internet

If your connection is fine, our servers may be busy.`;
        break;
        
      default:
        helpMessage = `General Troubleshooting:
        
• Restart the app completely
• Check your internet connection
• Update to the latest app version
• Clear app cache if the problem persists

Contact Support:
📧 support@disastermanagement.com
📞 1-800-DISASTER`;
        break;
    }
    
    Alert.alert('💡 Help & Troubleshooting', helpMessage, [
      { text: 'Got it', style: 'default' }
    ]);
  }

  /**
   * Show support contact options
   */
  private static showSupportOptions(): void {
    Alert.alert(
      '📞 Contact Support',
      'Get immediate help from our support team:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Email Support', onPress: () => console.log('Open email app') },
        { text: 'Call Support', onPress: () => console.log('Open dialer') }
      ]
    );
  }

  /**
   * Check server status and provide updates
   */
  private static async checkServerStatus(): Promise<void> {
    // Simple health check
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('https://httpstat.us/200', { 
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        this.isServerDown = false;
        Alert.alert('✅ Connection Restored', 'Your internet connection is working. Please try again.');
      } else {
        Alert.alert('🔍 Status Check', 'Connection issues detected. Please try again in a few minutes.');
      }
    } catch (error) {
      Alert.alert('🔍 Status Check', 'Unable to check server status. Please try again later.');
    }
  }

  /**
   * Get user-friendly Firebase auth messages
   */
  private static getFirebaseAuthMessage(code: string): string {
    const messages: Record<string, string> = {
      'auth/user-not-found': 'No account found with this email address.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/invalid-credential': 'Invalid email or password. Please check your credentials.',
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/too-many-requests': 'Too many failed attempts. Please wait before trying again.',
      'auth/network-request-failed': 'Network error. Please check your connection.'
    };
    
    return messages[code] || 'Authentication failed. Please try again.';
  }

  /**
   * Get user-friendly HTTP error messages
   */
  private static getHttpErrorMessage(status: number): string {
    if (status === 504 || status === 503) {
      return 'Server is temporarily unavailable due to maintenance or high traffic.';
    } else if (status === 500) {
      return 'Server encountered an error. Our team has been notified.';
    } else if (status === 401) {
      return 'Your session has expired. Please log in again.';
    } else if (status === 403) {
      return 'Access denied. Please check your permissions.';
    } else if (status === 404) {
      return 'The requested resource was not found.';
    } else if (status >= 400) {
      return 'Request failed. Please check your input and try again.';
    } else {
      return 'An unexpected server error occurred.';
    }
  }

  /**
   * Get specific user actions for Firebase auth errors
   */
  private static getFirebaseAuthAction(code: string): string {
    const actions: Record<string, string> = {
      'auth/user-not-found': 'Please check your email or create a new account.',
      'auth/wrong-password': 'Try again or use "Forgot Password" to reset.',
      'auth/invalid-credential': 'Double-check your email and password.',
      'auth/email-already-in-use': 'Use the login option instead, or try a different email.',
      'auth/weak-password': 'Choose a stronger password with at least 6 characters.',
      'auth/invalid-email': 'Enter a valid email address (e.g., user@example.com).',
      'auth/too-many-requests': 'Wait a few minutes before trying again.',
      'auth/network-request-failed': 'Check your internet connection and retry.'
    };
    
    return actions[code] || 'Please try again or contact support if the issue persists.';
  }

  /**
   * Get specific user actions for HTTP errors
   */
  private static getHttpErrorAction(status: number): string {
    if (status >= 500) {
      return 'Please try again in a few minutes. If the problem persists, contact support.';
    } else if (status === 401) {
      return 'Please log out and log back in.';
    } else if (status === 403) {
      return 'Contact your administrator or support team.';
    } else {
      return 'Please check your input and try again.';
    }
  }

  /**
   * Check if server is currently marked as down
   */
  static isServerCurrentlyDown(): boolean {
    if (!this.isServerDown) return false;
    
    // Auto-reset server down status after interval
    if (Date.now() - this.lastServerCheck > this.SERVER_CHECK_INTERVAL) {
      this.isServerDown = false;
      return false;
    }
    
    return true;
  }

  /**
   * Force reset server down status
   */
  static resetServerStatus(): void {
    this.isServerDown = false;
    this.lastServerCheck = 0;
  }
}

interface ErrorInfo {
  type: 'firebase_auth' | 'http' | 'network' | 'user_data' | 'generic';
  code: string;
  message: string;
  isRecoverable: boolean;
  isServerError: boolean;
  userAction: string;
}
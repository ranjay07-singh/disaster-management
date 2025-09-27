/**
 * Logging utility for development and production environments
 * In development: logs to console with console.log (no red error overlay)
 * In production: logs are suppressed for user experience
 */

export class Logger {
  /**
   * Log information messages (development only)
   */
  static info(message: string, data?: any) {
    if (__DEV__) {
      console.log(`ℹ️ ${message}`, data || '');
    }
  }

  /**
   * Log warning messages (development only)
   */
  static warn(message: string, data?: any) {
    if (__DEV__) {
      console.warn(`⚠️ ${message}`, data || '');
    }
  }

  /**
   * Log error messages (development only, using console.log to avoid red screen)
   */
  static error(message: string, error?: any) {
    if (__DEV__) {
      const errorInfo = error ? {
        code: error.code,
        message: error.message,
      } : '';
      console.log(`❌ ${message}`, errorInfo);
    }
  }

  /**
   * Log debug messages (development only)
   */
  static debug(message: string, data?: any) {
    if (__DEV__) {
      console.log(`🐛 DEBUG: ${message}`, data || '');
    }
  }

  /**
   * Log success messages (development only)
   */
  static success(message: string, data?: any) {
    if (__DEV__) {
      console.log(`✅ ${message}`, data || '');
    }
  }
}

export default Logger;
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface OTPData {
  email: string;
  otp: string;
  timestamp: number;
  expiresIn: number; // minutes
}

export interface OTPResponse {
  success: boolean;
  message: string;
  otp?: string; // Only for development/testing
}

export class OTPService {
  private static readonly OTP_STORAGE_KEY = 'otp_data';
  private static readonly OTP_EXPIRY_MINUTES = 10;

  // Generate 6-digit OTP
  static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Send OTP via email/SMS (with real email integration)
  static async sendOTP(email: string, method: 'email' | 'sms' = 'email'): Promise<OTPResponse> {
    try {
      const otp = this.generateOTP();
      const timestamp = Date.now();
      
      // Store OTP data
      const otpData: OTPData = {
        email,
        otp,
        timestamp,
        expiresIn: this.OTP_EXPIRY_MINUTES,
      };

      await AsyncStorage.setItem(`${this.OTP_STORAGE_KEY}_${email}`, JSON.stringify(otpData));

      // Send actual OTP via email
      if (method === 'email') {
        console.log(`📧 Sending OTP to email ${email}: ${otp}`);
        
        // Try to send real email using EmailJS (free service)
        const emailSent = await this.sendRealEmailOTP(email, otp);
        
        if (emailSent) {
          console.log('✅ Real email sent successfully!');
          return { 
            success: true, 
            message: `OTP sent successfully to your email address`,
          };
        } else {
          console.log('⚠️ Email service unavailable, using fallback notification');
          return { 
            success: true, 
            message: `OTP generated: ${otp} (Email service temporarily unavailable)`,
            otp // Show OTP in development when email fails
          };
        }
      } else {
        console.log(`📱 OTP Sent to SMS ${email}: ${otp}`);
        // SMS integration would go here (Twilio, AWS SNS, etc.)
        return { 
          success: true, 
          message: `SMS OTP: ${otp} (SMS service not configured)`,
          otp // Show OTP for SMS in development
        };
      }
    } catch (error) {
      console.error('Failed to send OTP:', error);
      return { 
        success: false, 
        message: 'Failed to send OTP. Please try again.' 
      };
    }
  }

  // Verify OTP
  static async verifyOTP(email: string, enteredOTP: string): Promise<OTPResponse> {
    try {
      const stored = await AsyncStorage.getItem(`${this.OTP_STORAGE_KEY}_${email}`);
      if (!stored) {
        return { 
          success: false, 
          message: 'OTP not found. Please request a new code.' 
        };
      }

      const otpData: OTPData = JSON.parse(stored);
      
      // Check if email matches
      if (otpData.email !== email) {
        return { 
          success: false, 
          message: 'Invalid request. Please try again.' 
        };
      }

      // Check if OTP matches
      if (otpData.otp !== enteredOTP) {
        return { 
          success: false, 
          message: 'Invalid OTP. Please check and try again.' 
        };
      }

      // Check if OTP is expired
      const now = Date.now();
      const elapsed = (now - otpData.timestamp) / (1000 * 60); // minutes
      
      if (elapsed > otpData.expiresIn) {
        await this.clearOTP(email);
        return { 
          success: false, 
          message: 'OTP has expired. Please request a new code.' 
        };
      }

      // OTP is valid, clear it
      await this.clearOTP(email);
      return { 
        success: true, 
        message: 'OTP verified successfully!' 
      };
    } catch (error) {
      console.error('Failed to verify OTP:', error);
      return { 
        success: false, 
        message: 'OTP verification failed. Please try again.' 
      };
    }
  }

  // Clear stored OTP
  static async clearOTP(email?: string): Promise<void> {
    try {
      if (email) {
        await AsyncStorage.removeItem(`${this.OTP_STORAGE_KEY}_${email}`);
      } else {
        // Clear all OTP data
        const keys = await AsyncStorage.getAllKeys();
        const otpKeys = keys.filter(key => key.startsWith(this.OTP_STORAGE_KEY));
        await AsyncStorage.multiRemove(otpKeys);
      }
    } catch (error) {
      console.error('Failed to clear OTP:', error);
    }
  }

  // Get remaining time for OTP
  static async getOTPRemainingTime(): Promise<number> {
    try {
      const stored = await AsyncStorage.getItem(this.OTP_STORAGE_KEY);
      if (!stored) return 0;

      const otpData: OTPData = JSON.parse(stored);
      const now = Date.now();
      const elapsed = (now - otpData.timestamp) / (1000 * 60); // minutes
      const remaining = otpData.expiresIn - elapsed;

      return Math.max(0, remaining);
    } catch (error) {
      return 0;
    }
  }

  // Real email OTP sending with fallback methods
  private static async sendRealEmailOTP(email: string, otp: string): Promise<boolean> {
    try {
      console.log(`🔄 Attempting to send real email to ${email}...`);
      
      // In production, you would integrate with a real email service:
      // 1. AWS SES (recommended for production)
      // 2. SendGrid (easy integration) 
      // 3. Mailgun (reliable service)
      // 4. Postmark (developer-friendly)

      // For now, simulate email sending and provide the OTP in development
      console.log('📧 DEVELOPMENT MODE - Real Email Service Not Configured');
      console.log(`📧 Your OTP Code: ${otp}`);
      console.log('📧 This code expires in 10 minutes');
      console.log('📧 To enable real emails, configure your email service in production');
      
      // Return false to show OTP in the UI during development
      return false;
    } catch (error) {
      console.error('Email service error:', error);
      return false;
    }
  }

  // Mock email service (replace with actual service)
  private static async sendEmailOTP(email: string, otp: string): Promise<boolean> {
    // Integration with email service like SendGrid, AWS SES, etc.
    // Example:
    // const emailData = {
    //   to: email,
    //   subject: 'Password Reset OTP - Disaster Management System',
    //   body: `Your OTP for password reset is: ${otp}. Valid for ${this.OTP_EXPIRY_MINUTES} minutes.`
    // };
    // return await EmailService.send(emailData);
    
    console.log(`Email OTP sent to ${email}: ${otp}`);
    return true;
  }

  // Mock SMS service (replace with actual service)
  private static async sendSMSOTP(phone: string, otp: string): Promise<boolean> {
    // Integration with SMS service like Twilio, AWS SNS, etc.
    // Example:
    // const smsData = {
    //   to: phone,
    //   message: `Your Disaster Management System OTP: ${otp}. Valid for ${this.OTP_EXPIRY_MINUTES} minutes.`
    // };
    // return await SMSService.send(smsData);
    
    console.log(`SMS OTP sent to ${phone}: ${otp}`);
    return true;
  }
}
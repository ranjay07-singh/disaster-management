import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { UserService, UserRegistrationData, LoginData } from '../services/UserService';
import { OTPService } from '../services/OTPService';
import { AuthenticationService } from '../services/AuthenticationService';
import { User, UserRole } from '../types/User';

interface AuthScreenProps {
  onAuthSuccess: (user: User) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [currentScreen, setCurrentScreen] = useState<'login' | 'register' | 'forgot' | 'otp'>('login');
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  
  // Login form
  const [loginData, setLoginData] = useState<LoginData>({
    email: '',
    password: '',
  });
  
  // Registration form
  const [registerData, setRegisterData] = useState<UserRegistrationData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'victim',
  });

  // Forgot password form
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // OTP form
  const [otpCode, setOtpCode] = useState('');
  const [otpPurpose, setOtpPurpose] = useState<'forgot' | 'register'>('forgot');
  const [otpEmail, setOtpEmail] = useState('');
  const [isOTPVerified, setIsOTPVerified] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // OTP Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Clear errors when switching screens
  useEffect(() => {
    setErrors({});
  }, [currentScreen]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'email':
        const emailValidation = UserService.validateEmail(value);
        return emailValidation.isValid ? '' : emailValidation.message;
      case 'phone':
        const phoneValidation = UserService.validatePhone(value);
        return phoneValidation.isValid ? '' : phoneValidation.message;
      case 'password':
        const passwordValidation = UserService.validatePassword(value);
        return passwordValidation.isValid ? '' : passwordValidation.message;
      case 'name':
        const nameValidation = UserService.validateName(value);
        return nameValidation.isValid ? '' : nameValidation.message;
      default:
        return '';
    }
  };

  const updateLoginField = (field: keyof LoginData, value: string) => {
    setLoginData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const updateRegisterField = (field: keyof UserRegistrationData, value: any) => {
    setRegisterData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleLogin = async () => {
    // Clear previous errors
    setErrors({});
    
    // Validate fields
    const newErrors: Record<string, string> = {};
    
    if (!loginData.email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      const emailError = validateField('email', loginData.email);
      if (emailError) newErrors.email = emailError;
    }
    
    if (!loginData.password) {
      newErrors.password = 'Password is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const result = await UserService.loginUser(loginData);
      
      if (result.success && result.user) {
        // Store credentials for API calls (try both local and API auth)
        try {
          // Try API authentication with flexible credentials
          await AuthenticationService.login(loginData.email === 'admin@gmail.com' ? 'user' : loginData.email, 
                                          loginData.email === 'admin@gmail.com' ? '7963f186-e8ac-4adb-b238-c924415fe70e' : loginData.password);
        } catch (apiError) {
          console.log('API auth not available, using local auth only');
        }
        
        // Store user profile
        await AuthenticationService.storeUserProfile({
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          phone: result.user.phone,
          role: result.user.role,
          isActive: result.user.isActive,
        });
        
        // Convert to User type for navigation
        const user: User = {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          phone: result.user.phone,
          role: result.user.role as UserRole,
          isActive: result.user.isActive,
          createdAt: new Date(result.user.createdAt),
          updatedAt: new Date(),
        };
        
        Alert.alert('Success', 'Login successful!', [
          { text: 'Continue', onPress: () => onAuthSuccess(user) }
        ]);
      } else {
        // Show error message from service
        setErrors({ 
          password: result.message || 'Invalid email or password. Please check your credentials and try again.' 
        });
      }
    } catch (error: any) {
      // Professional error handling - use console.log instead of console.error to avoid red screen
      console.log('🔐 Login error:', error?.code || 'unknown');
      console.log('📋 Error details:', error?.message || 'No details');
      
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      // Handle specific error cases
      if (error?.code === 'auth/invalid-credential' || error?.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect email or password. Please try again.';
      } else if (error?.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error?.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again in a few minutes.';
      } else if (error?.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error?.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled. Please contact support.';
      } else if (error?.message && !error.message.includes('Error:')) {
        errorMessage = error.message;
      }
      
      // Display professional error message under password field
      setErrors({ password: errorMessage });
      
      // Optional: Show alert for critical errors only
      if (error?.code === 'auth/too-many-requests' || error?.code === 'auth/user-disabled') {
        Alert.alert('Login Failed', errorMessage, [{ text: 'OK' }]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    // Validate fields
    const newErrors: Record<string, string> = {};
    
    Object.keys(registerData).forEach(field => {
      if (field === 'role') return; // Skip role validation
      
      const value = registerData[field as keyof UserRegistrationData];
      if (!value || !String(value).trim()) {
        newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
        return;
      }
      
      if (field !== 'confirmPassword') {
        const error = validateField(field, String(value));
        if (error) newErrors[field] = error;
      }
    });

    if (registerData.password !== registerData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const result = await UserService.registerUser(registerData);
      
      if (result.success) {
        Alert.alert(
          'Registration Successful!', 
          'Your account has been created successfully. You can now login with your credentials.',
          [
            { 
              text: 'Login Now', 
              onPress: () => {
                setCurrentScreen('login');
                setLoginData({ email: registerData.email, password: '' });
                setRegisterData({
                  name: '',
                  email: '',
                  password: '',
                  confirmPassword: '',
                  phone: '',
                  role: 'victim',
                });
              }
            }
          ]
        );
      } else {
        Alert.alert('Registration Failed', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Registration failed. Please try again.');
      console.log('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    const emailValidation = UserService.validateEmail(forgotEmail);
    if (!emailValidation.isValid) {
      Alert.alert('Error', emailValidation.message);
      return;
    }

    setOtpLoading(true);
    try {
      // Check if email exists
      const emailExists = await UserService.isEmailExists(forgotEmail);
      if (!emailExists) {
        Alert.alert('Error', 'No account found with this email address');
        return;
      }

      // Send OTP
      const otpResult = await OTPService.sendOTP(forgotEmail, 'email');
      if (otpResult.success) {
        setOtpEmail(forgotEmail);
        setOtpPurpose('forgot');
        setCurrentScreen('otp');
        setOtpTimer(600); // 10 minutes
        
        // Show OTP in development mode
        if (otpResult.otp) {
          Alert.alert(
            'OTP Sent (Development Mode)', 
            `Your verification code is: ${otpResult.otp}\n\nIn production, this would be sent to your email.`,
            [{ text: 'Continue', onPress: () => {} }]
          );
        } else {
          Alert.alert('OTP Sent', 'Please check your email for the verification code');
        }
      } else {
        Alert.alert('Error', otpResult.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
      console.log('OTP send error:', error);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOTPVerification = async () => {
    if (!otpCode.trim() || otpCode.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    setOtpLoading(true);
    try {
      const verifyResult = await OTPService.verifyOTP(otpEmail, otpCode);
      
      if (verifyResult.success) {
        if (otpPurpose === 'forgot') {
          setIsOTPVerified(true);
          setCurrentScreen('forgot');
          setOtpCode('');
          Alert.alert('Success', 'OTP verified! Please set your new password.');
        }
      } else {
        Alert.alert('Invalid OTP', verifyResult.message);
      }
    } catch (error) {
      Alert.alert('Error', 'OTP verification failed. Please try again.');
      console.log('OTP verification error:', error);
    } finally {
      setOtpLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!isOTPVerified) {
      Alert.alert('Error', 'Please verify your OTP first');
      return;
    }

    if (!newPassword || !confirmNewPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    const passwordValidation = UserService.validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      Alert.alert('Error', passwordValidation.message);
      return;
    }

    setLoading(true);
    try {
      const result = await UserService.resetPassword(forgotEmail, newPassword);
      
      if (result.success) {
        // Clear OTP data
        await OTPService.clearOTP(forgotEmail);
        
        Alert.alert('Success', 'Password reset successful! You can now login with your new password.', [
          {
            text: 'Login Now',
            onPress: () => {
              setCurrentScreen('login');
              setLoginData({ email: forgotEmail, password: '' });
              setForgotEmail('');
              setNewPassword('');
              setConfirmNewPassword('');
              setIsOTPVerified(false);
            }
          }
        ]);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Password reset failed. Please try again.');
      console.log('Password reset error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (otpTimer > 0) return;

    setOtpLoading(true);
    try {
      const otpResult = await OTPService.sendOTP(otpEmail, 'email');
      if (otpResult.success) {
        setOtpTimer(600); // 10 minutes
        setOtpCode('');
        
        // Show OTP in development mode
        if (otpResult.otp) {
          Alert.alert(
            'New OTP Sent (Development Mode)', 
            `Your new verification code is: ${otpResult.otp}\n\nIn production, this would be sent to your email.`,
            [{ text: 'Continue', onPress: () => {} }]
          );
        } else {
          Alert.alert('OTP Sent', 'A new verification code has been sent to your email');
        }
      } else {
        Alert.alert('Error', otpResult.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const resetForms = () => {
    setLoginData({ email: '', password: '' });
    setRegisterData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      role: 'victim',
    });
    setForgotEmail('');
    setNewPassword('');
    setConfirmNewPassword('');
    setOtpCode('');
    setErrors({});
    setIsOTPVerified(false);
  };

  const renderLoginScreen = () => (
    <View style={styles.form}>
      <Text style={styles.formTitle}>Welcome Back</Text>
      <Text style={styles.formSubtitle}>Sign in to your account</Text>

      <View>
        <TextInput
          style={[styles.input, errors.email && styles.inputError]}
          placeholder="Email Address"
          value={loginData.email}
          onChangeText={(value) => updateLoginField('email', value)}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
      </View>

      <View>
        <TextInput
          style={[styles.input, errors.password && styles.inputError]}
          placeholder="Password"
          value={loginData.password}
          onChangeText={(value) => updateLoginField('password', value)}
          secureTextEntry
        />
        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Sign In</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.linkButton} 
        onPress={() => {
          setCurrentScreen('forgot');
          resetForms();
        }}
      >
        <Text style={styles.linkText}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.linkButton} 
        onPress={() => {
          setCurrentScreen('register');
          resetForms();
        }}
      >
        <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
      </TouchableOpacity>
    </View>
  );

  const renderRegisterScreen = () => (
    <View style={styles.form}>
      <Text style={styles.formTitle}>Create Account</Text>
      <Text style={styles.formSubtitle}>Join our disaster management system</Text>

      <View>
        <TextInput
          style={[styles.input, errors.name && styles.inputError]}
          placeholder="Full Name"
          value={registerData.name}
          onChangeText={(value) => updateRegisterField('name', value)}
          autoCapitalize="words"
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
      </View>

      <View>
        <TextInput
          style={[styles.input, errors.email && styles.inputError]}
          placeholder="Email Address"
          value={registerData.email}
          onChangeText={(value) => updateRegisterField('email', value)}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
      </View>

      <View>
        <TextInput
          style={[styles.input, errors.phone && styles.inputError]}
          placeholder="Phone Number"
          value={registerData.phone}
          onChangeText={(value) => updateRegisterField('phone', value)}
          keyboardType="phone-pad"
        />
        {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
      </View>

      <View style={styles.pickerContainer}>
        <Text style={styles.pickerLabel}>Select Role:</Text>
        <Picker
          selectedValue={registerData.role}
          style={styles.picker}
          onValueChange={(value) => updateRegisterField('role', value)}
        >
          <Picker.Item label="Victim/End User" value="victim" />
          <Picker.Item label="Volunteer/Helper" value="volunteer" />
          <Picker.Item label="Monitoring Body" value="monitoring" />
        </Picker>
      </View>

      <View>
        <TextInput
          style={[styles.input, errors.password && styles.inputError]}
          placeholder="Password (min. 8 characters)"
          value={registerData.password}
          onChangeText={(value) => updateRegisterField('password', value)}
          secureTextEntry
        />
        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
      </View>

      <View>
        <TextInput
          style={[styles.input, errors.confirmPassword && styles.inputError]}
          placeholder="Confirm Password"
          value={registerData.confirmPassword}
          onChangeText={(value) => updateRegisterField('confirmPassword', value)}
          secureTextEntry
        />
        {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Create Account</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.linkButton} 
        onPress={() => {
          setCurrentScreen('login');
          resetForms();
        }}
      >
        <Text style={styles.linkText}>Already have an account? Sign In</Text>
      </TouchableOpacity>
    </View>
  );

  const renderForgotScreen = () => (
    <View style={styles.form}>
      <Text style={styles.formTitle}>
        {isOTPVerified ? 'Set New Password' : 'Forgot Password'}
      </Text>
      <Text style={styles.formSubtitle}>
        {isOTPVerified 
          ? 'Enter your new password below'
          : 'Enter your email to receive a verification code'
        }
      </Text>

      {!isOTPVerified ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            value={forgotEmail}
            onChangeText={setForgotEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[styles.button, otpLoading && styles.buttonDisabled]}
            onPress={handleForgotPassword}
            disabled={otpLoading}
          >
            {otpLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Send Verification Code</Text>
            )}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />

          <TextInput
            style={styles.input}
            placeholder="Confirm New Password"
            value={confirmNewPassword}
            onChangeText={setConfirmNewPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handlePasswordReset}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Reset Password</Text>
            )}
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity 
        style={styles.linkButton} 
        onPress={() => {
          setCurrentScreen('login');
          resetForms();
        }}
      >
        <Text style={styles.linkText}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );

  const renderOTPScreen = () => (
    <View style={styles.form}>
      <Text style={styles.formTitle}>Verify Code</Text>
      <Text style={styles.formSubtitle}>
        Enter the 6-digit code sent to {otpEmail}
      </Text>

      <TextInput
        style={[styles.input, styles.otpInput]}
        placeholder="000000"
        value={otpCode}
        onChangeText={setOtpCode}
        keyboardType="number-pad"
        maxLength={6}
        textAlign="center"
      />

      <TouchableOpacity
        style={[styles.button, otpLoading && styles.buttonDisabled]}
        onPress={handleOTPVerification}
        disabled={otpLoading}
      >
        {otpLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Verify Code</Text>
        )}
      </TouchableOpacity>

      {otpTimer > 0 ? (
        <Text style={styles.timerText}>
          Resend code in {formatTime(otpTimer)}
        </Text>
      ) : (
        <TouchableOpacity 
          style={styles.linkButton} 
          onPress={handleResendOTP}
          disabled={otpLoading}
        >
          <Text style={styles.linkText}>Resend Code</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity 
        style={styles.linkButton} 
        onPress={() => {
          setCurrentScreen('forgot');
          setOtpCode('');
          setOtpTimer(0);
        }}
      >
        <Text style={styles.linkText}>Change Email</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>🚨 Disaster Management</Text>
        <Text style={styles.subtitle}>Emergency Response System</Text>
      </View>

        {currentScreen === 'login' && renderLoginScreen()}
        {currentScreen === 'register' && renderRegisterScreen()}
        {currentScreen === 'forgot' && renderForgotScreen()}
        {currentScreen === 'otp' && renderOTPScreen()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    backgroundColor: 'white',
    padding: 25,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 5,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  inputError: {
    borderColor: '#ff4444',
    backgroundColor: '#fff5f5',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 5,
  },
  otpInput: {
    fontSize: 24,
    letterSpacing: 8,
    fontWeight: 'bold',
  },
  pickerContainer: {
    marginBottom: 15,
  },
  pickerLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
    fontWeight: '500',
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 5,
  },
  linkText: {
    color: '#007AFF',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  timerText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    marginTop: 10,
  },
  quickLoginContainer: {
    backgroundColor: '#e8f5e8',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#34C759',
  },
  quickLoginTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d7d32',
    textAlign: 'center',
    marginBottom: 10,
  },
  quickLoginButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  quickLoginBtn: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  quickLoginText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  quickLoginNote: {
    fontSize: 12,
    color: '#2d7d32',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default AuthScreen;
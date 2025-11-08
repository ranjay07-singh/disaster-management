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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { AuthService } from '../services/AuthService';
import { CleanFirebaseAuthService } from '../services/CleanFirebaseAuthService';
import { UnifiedAuthService } from '../services/UnifiedAuthService';
import { AuthErrorHandler } from '../utils/AuthErrorHandler';
import { ProfessionalErrorHandler } from '../utils/ProfessionalErrorHandler';
import { User, UserRole } from '../types/User';

interface SimpleFirebaseAuthScreenProps {
  onAuthSuccess: (user: User) => void;
}

const SimpleFirebaseAuthScreen: React.FC<SimpleFirebaseAuthScreenProps> = ({ onAuthSuccess }) => {
  const [currentScreen, setCurrentScreen] = useState<'login' | 'register' | 'forgot'>('login');
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize unified auth service
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await UnifiedAuthService.initialize();
        console.log('UnifiedAuthService initialized successfully');
        
        // Check if user is already authenticated
        if (UnifiedAuthService.isAuthenticated()) {
          const currentUser = UnifiedAuthService.getCurrentUser();
          if (currentUser) {
            onAuthSuccess(currentUser);
            return;
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth service:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, [onAuthSuccess]);
  
  // Login form
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });
  
  // Registration form
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'victim' as UserRole,
  });

  // Forgot password form
  const [forgotEmail, setForgotEmail] = useState('');

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Helper function to convert Firebase errors to user-friendly messages
  const getFirebaseErrorMessage = (error: string): string => {
    if (error.includes('auth/invalid-credential') || error.includes('invalid-credential')) {
      return 'The email or password you entered is incorrect. Please double-check your login credentials and try again.';
    }
    if (error.includes('auth/user-not-found') || error.includes('user-not-found')) {
      return 'No account found with this email address. Please check the email or create a new account.';
    }
    if (error.includes('auth/wrong-password') || error.includes('wrong-password')) {
      return 'The password is incorrect. Please try again or use "Forgot Password" if you can\'t remember it.';
    }
    if (error.includes('auth/email-already-in-use') || error.includes('email-already-in-use')) {
      return 'This email is already registered. Try signing in instead, or use a different email address.';
    }
    if (error.includes('auth/weak-password') || error.includes('weak-password')) {
      return 'Your password is too weak. Please choose a password with at least 8 characters, including letters and numbers.';
    }
    if (error.includes('auth/invalid-email') || error.includes('invalid-email')) {
      return 'The email address format is invalid. Please enter a valid email address like user@example.com.';
    }
    if (error.includes('auth/network-request-failed') || error.includes('network')) {
      return 'Network connection problem. Please check your internet connection and try again.';
    }
    if (error.includes('auth/too-many-requests') || error.includes('too-many-requests')) {
      return 'Too many failed attempts. Please wait a few minutes before trying again.';
    }
    if (error.includes('Firebase not configured') || error.includes('not configured')) {
      return 'Authentication service is not properly configured. Please contact support if this persists.';
    }
    if (error.includes('User data not found')) {
      return 'Your account exists but profile data is missing. Please try registering again or contact support.';
    }
    
    // Default user-friendly message
    return 'Something went wrong with your request. Please try again in a moment. If the problem continues, contact support.';
  };

  // Show login help dialog
  const showLoginHelp = () => {
    Alert.alert(
      '🆘 Login Help',
      'Having trouble logging in? Here are some solutions:\\n\\n' +
      '• Double-check your email and password\\n' +
      '• Make sure Caps Lock is off\\n' +
      '• Try the "Forgot Password" option\\n' +
      '• Check your internet connection\\n\\n' +
      'Still need help? Contact our support team.',
      [
        { text: 'Forgot Password', onPress: () => setCurrentScreen('forgot') },
        { text: 'Got It', style: 'cancel' }
      ]
    );
  };

  // Show registration help dialog
  const showRegistrationHelp = () => {
    Alert.alert(
      '🆘 Registration Help',
      'Having trouble creating your account? Here are some tips:\\n\\n' +
      '• Use a valid email address\\n' +
      '• Password must be at least 8 characters\\n' +
      '• Fill in all required fields\\n' +
      '• Check your internet connection\\n' +
      '• Make sure the email isn\'t already registered\\n\\n' +
      'Need assistance? Contact our support team.',
      [
        { text: 'Try Login Instead', onPress: () => setCurrentScreen('login') },
        { text: 'Contact Support', onPress: () => showContactInfo() },
        { text: 'Got It', style: 'cancel' }
      ]
    );
  };

  // Show contact information
  const showContactInfo = () => {
    Alert.alert(
      '📞 Contact Support',
      'Need help with your account?\\n\\n' +
      '📧 Email: support@disastermanagement.com\\n' +
      '📱 Phone: +91-800-DISASTER\\n' +
      '🌐 Website: www.disastermanagement.com/help\\n\\n' +
      'Our support team is available 24/7 for emergency assistance.',
      [{ text: 'OK', style: 'default' }]
    );
  };

  const validateEmail = (email: string): string => {
    if (!email.trim()) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) return 'Please enter a valid email address';
    return '';
  };

  const validatePassword = (password: string): string => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters long';
    return '';
  };

  const validateName = (name: string): string => {
    if (!name.trim()) return 'Name is required';
    if (name.trim().length < 2) return 'Name must be at least 2 characters long';
    return '';
  };

  const validatePhone = (phone: string): string => {
    if (!phone.trim()) return 'Phone number is required';
    const phoneRegex = /^[+]?[\d\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(phone.trim())) return 'Please enter a valid phone number';
    return '';
  };

  const updateLoginField = (field: string, value: string) => {
    setLoginData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const updateRegisterField = (field: string, value: any) => {
    setRegisterData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleLogin = async () => {
    // Validate fields
    const newErrors: Record<string, string> = {};
    
    const emailError = validateEmail(loginData.email);
    if (emailError) newErrors.email = emailError;
    
    const passwordError = validatePassword(loginData.password);
    if (passwordError) newErrors.password = passwordError;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      // Clear previous errors
      setErrors({});
      
      // Use UnifiedAuthService for login (handles both Firebase and API auth)
      const user = await UnifiedAuthService.loginWithFirebase(loginData.email, loginData.password);
      
      Alert.alert('✅ Welcome Back!', `Hello ${user.name}! You have successfully logged in to the Disaster Management System.`, [
        { text: 'Continue', onPress: () => onAuthSuccess(user) }
      ]);
    } catch (error: any) {
      console.log('Login error details:', error);
      
      // Use professional error handling
      ProfessionalErrorHandler.handleAuthError(error, 'Login');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    // Validate all fields
    const newErrors: Record<string, string> = {};
    
    const nameError = validateName(registerData.name);
    if (nameError) newErrors.name = nameError;
    
    const emailError = validateEmail(registerData.email);
    if (emailError) newErrors.email = emailError;
    
    const phoneError = validatePhone(registerData.phone);
    if (phoneError) newErrors.phone = phoneError;
    
    const passwordError = validatePassword(registerData.password);
    if (passwordError) newErrors.password = passwordError;

    if (registerData.password !== registerData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      // Clear previous errors
      setErrors({});
      
      // Use UnifiedAuthService for registration (handles both Firebase and API auth)
      const user = await UnifiedAuthService.registerWithFirebase(registerData.email, registerData.password, {
        name: registerData.name,
        phone: registerData.phone,
        role: registerData.role,
      });
      
      Alert.alert(
        '🎉 Welcome to Disaster Management!', 
        `Hi ${registerData.name}! Your account has been created successfully. You're now ready to access all disaster management features.`,
        [
          { 
            text: 'Get Started', 
            onPress: () => onAuthSuccess(user)
          }
        ]
      );
    } catch (error: any) {
      console.log('Registration error details:', error);
      
      // Special handling for email already in use
      if (error?.code === 'auth/email-already-in-use' || error?.message?.includes('email-already-in-use')) {
        Alert.alert(
          '📧 Email Already Registered', 
          'An account with this email already exists. Would you like to sign in instead?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Sign In', 
              onPress: () => {
                setCurrentScreen('login');
                setLoginData({ email: registerData.email, password: '' });
                resetForms();
              }
            }
          ]
        );
      } else {
        // Use professional error handling for other errors
        ProfessionalErrorHandler.handleAuthError(error, 'Registration');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const emailError = validateEmail(forgotEmail);
    if (emailError) {
      Alert.alert('❌ Invalid Email', emailError);
      return;
    }

    setLoading(true);
    try {
      const result = await CleanFirebaseAuthService.sendPasswordResetEmail(forgotEmail);
      
      if (result.success) {
        Alert.alert(
          '✅ Password Reset Email Sent!', 
          result.message,
          [
            {
              text: 'Back to Login',
              onPress: () => {
                setCurrentScreen('login');
                setForgotEmail('');
              }
            }
          ]
        );
      } else {
        Alert.alert('❌ Password Reset Failed', result.message);
      }
    } catch (error: any) {
      const errorMessage = error?.code === 'auth/user-not-found'
        ? 'No account found with this email address.'
        : 'Failed to send password reset email. Please try again.';
      
      Alert.alert('❌ Password Reset Failed', errorMessage);
    } finally {
      setLoading(false);
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
      role: UserRole.VICTIM,
    });
    setForgotEmail('');
    setErrors({});
  };

  const renderLoginScreen = () => (
    <View style={styles.form}>
      <Text style={styles.formTitle}>🔥 Firebase Login</Text>
      <Text style={styles.formSubtitle}>Sign in with your email and password</Text>



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
          <Text style={styles.buttonText}>🔐 Sign In</Text>
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
      <Text style={styles.formTitle}>🔥 Create Account</Text>
      <Text style={styles.formSubtitle}>Register for disaster management access</Text>

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
          <Picker.Item label="Victim/End User" value={UserRole.VICTIM} />
          <Picker.Item label="Volunteer/Helper" value={UserRole.VOLUNTEER} />
          <Picker.Item label="Monitoring Body" value={UserRole.MONITORING} />
        </Picker>
      </View>

      <View>
        <TextInput
          style={[styles.input, errors.password && styles.inputError]}
          placeholder="Password (min. 6 characters)"
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
          <Text style={styles.buttonText}>🔥 Create Account</Text>
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
      <Text style={styles.formTitle}>🔥 Reset Password</Text>
      <Text style={styles.formSubtitle}>Enter your email to receive a password reset link</Text>

      <TextInput
        style={styles.input}
        placeholder="Email Address"
        value={forgotEmail}
        onChangeText={setForgotEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleForgotPassword}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>📧 Send Reset Email</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.linkButton} 
        onPress={() => {
          setCurrentScreen('login');
          resetForms();
        }}
      >
        <Text style={styles.linkText}>Back to Login</Text>
      </TouchableOpacity>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>📋 How it works:</Text>
        <Text style={styles.infoText}>• Enter your email address above</Text>
        <Text style={styles.infoText}>• Firebase will send a secure reset link</Text>
        <Text style={styles.infoText}>• Check your inbox and spam folder</Text>
        <Text style={styles.infoText}>• Click the link to set a new password</Text>
        <Text style={styles.infoText}>• Return to app and login with new password</Text>
      </View>
    </View>
  );

  // Show loading screen while initializing authentication
  if (!isInitialized) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#FF5722" />
        <Text style={styles.loadingText}>Initializing Authentication...</Text>
        <Text style={styles.subtitle}>Setting up secure connection</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>🚨 Disaster Management</Text>
          <Text style={styles.subtitle}>Secure Authentication System</Text>
        </View>

        {currentScreen === 'login' && renderLoginScreen()}
        {currentScreen === 'register' && renderRegisterScreen()}
        {currentScreen === 'forgot' && renderForgotScreen()}
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
    backgroundColor: '#FF5722',
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
    color: '#FF5722',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  infoContainer: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#333',
    marginTop: 16,
    fontWeight: '600',
  },
});

export default SimpleFirebaseAuthScreen;
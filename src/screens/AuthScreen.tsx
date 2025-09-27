import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { AuthService } from '../services/AuthService';
import { User, UserRole } from '../types/User';

interface AuthScreenProps {
  onAuthSuccess: (user: User) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.VICTIM);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[+]?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const handleForgotPassword = async () => {
    if (!resetEmail.trim()) {
      Alert.alert('Missing Email', 'Please enter your email address to reset password');
      return;
    }

    if (!validateEmail(resetEmail.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      await AuthService.resetPassword(resetEmail.trim());
      
      Alert.alert(
        '✅ Reset Email Sent!',
        'A password reset link has been sent to your email address. Please check your inbox and follow the instructions to reset your password.',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowForgotPassword(false);
              setResetEmail('');
            }
          }
        ]
      );
    } catch (error: any) {
      // Log error only in development mode
      if (__DEV__) {
        console.log('Password reset error:', error?.code || error?.message);
      }
      
      let errorMessage = 'Failed to send reset email. Please try again.';
      
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
            errorMessage = 'No account found with this email address. Please check your email or create a new account.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Invalid email format. Please enter a valid email address.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many reset attempts. Please wait a moment and try again.';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'Network error. Please check your internet connection and try again.';
            break;
          default:
            errorMessage = error.message || 'Failed to send reset email. Please try again.';
        }
      }
      
      Alert.alert('Reset Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async () => {
    // Basic field validation
    if (!email.trim()) {
      Alert.alert('Validation Error', 'Please enter your email address');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Validation Error', 'Please enter your password');
      return;
    }

    // Email format validation
    if (!validateEmail(email.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address (e.g., user@example.com)');
      return;
    }

    // Password strength validation
    if (!validatePassword(password)) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long');
      return;
    }

    // Registration-specific validations
    if (!isLogin) {
      if (!name.trim()) {
        Alert.alert('Missing Information', 'Please enter your full name');
        return;
      }

      if (name.trim().length < 2) {
        Alert.alert('Invalid Name', 'Name must be at least 2 characters long');
        return;
      }

      if (!phone.trim()) {
        Alert.alert('Missing Information', 'Please enter your phone number');
        return;
      }

      if (!validatePhone(phone.trim())) {
        Alert.alert('Invalid Phone', 'Please enter a valid phone number (at least 10 digits)');
        return;
      }

      if (password !== confirmPassword) {
        Alert.alert('Password Mismatch', 'Passwords do not match. Please check and try again.');
        return;
      }
    }

    setLoading(true);

    try {
      let user: User;

      if (isLogin) {
        user = await AuthService.login(email.trim(), password);
      } else {
        user = await AuthService.register(email.trim(), password, {
          name: name.trim(),
          phone: phone.trim(),
          role,
        });
      }

      // Success message
      Alert.alert(
        '✅ Success!', 
        isLogin ? 'Welcome back!' : 'Account created successfully!',
        [{ text: 'Continue', onPress: () => onAuthSuccess(user) }]
      );
    } catch (error: any) {
      // Log error only in development mode without showing red screen
      if (__DEV__) {
        console.log('Authentication error:', error?.code || error?.message);
      }
      
      // More specific error messages
      let errorMessage = 'Authentication failed. Please try again.';
      
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
            Alert.alert(
              'Account Not Found',
              'No account found with this email address.',
              [
                { text: 'Try Again', style: 'cancel' },
                { 
                  text: 'Sign Up', 
                  onPress: () => {
                    setIsLogin(false);
                    resetForm();
                    setEmail(email.trim());
                  }
                },
                { 
                  text: 'Forgot Password?', 
                  onPress: () => {
                    setResetEmail(email.trim());
                    setShowForgotPassword(true);
                  }
                }
              ]
            );
            return;
          case 'auth/wrong-password':
            Alert.alert(
              'Incorrect Password',
              'The password you entered is incorrect.',
              [
                { text: 'Try Again', style: 'cancel' },
                { 
                  text: 'Forgot Password?', 
                  onPress: () => {
                    setResetEmail(email.trim());
                    setShowForgotPassword(true);
                  }
                }
              ]
            );
            return;
          case 'auth/invalid-credential':
            Alert.alert(
              'Invalid Credentials',
              'The email or password you entered is incorrect. Please check your credentials and try again.',
              [
                { text: 'Try Again', style: 'cancel' },
                { 
                  text: 'Forgot Password?', 
                  onPress: () => {
                    setResetEmail(email.trim());
                    setShowForgotPassword(true);
                  }
                },
                { 
                  text: 'Sign Up Instead', 
                  onPress: () => {
                    setIsLogin(false);
                    resetForm();
                    setEmail(email.trim());
                  }
                }
              ]
            );
            return;
          case 'auth/email-already-in-use':
            errorMessage = 'An account with this email already exists. Please try logging in instead.';
            break;
          case 'auth/weak-password':
            errorMessage = 'Password is too weak. Please use at least 6 characters.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Invalid email format. Please enter a valid email address.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many failed attempts. Please wait a moment and try again.';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'Network error. Please check your internet connection and try again.';
            break;
          case 'auth/user-disabled':
            errorMessage = 'Your account has been disabled. Please contact support for assistance.';
            break;
          case 'auth/operation-not-allowed':
            errorMessage = 'This operation is not allowed. Please contact support.';
            break;
          case 'auth/requires-recent-login':
            errorMessage = 'This operation requires recent login. Please log out and log in again.';
            break;
          default:
            errorMessage = error.message || 'Authentication failed. Please try again.';
        }
      }
      
      Alert.alert('Authentication Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setPhone('');
    setRole(UserRole.VICTIM);
    setShowForgotPassword(false);
    setResetEmail('');
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Disaster Management System</Text>
          <Text style={styles.subtitle}>
            {isLogin ? 'Sign in to your account' : 'Create a new account'}
          </Text>
        </View>

        <View style={styles.form}>
          {!isLogin && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
              
              <TextInput
                style={styles.input}
                placeholder="Contact No."
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />

              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}> Select Role:</Text>
                <Picker
                  selectedValue={role}
                  style={styles.picker}
                  onValueChange={(itemValue: UserRole) => setRole(itemValue)}
                >
                  <Picker.Item label="End User" value={UserRole.VICTIM} />
                  <Picker.Item label="Volunteer/Helper" value={UserRole.VOLUNTEER} />
                  <Picker.Item label="Monitoring Body" value={UserRole.MONITORING} />
                </Picker>
              </View>
            </>
          )}

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Password (min. 6 characters)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {!isLogin && (
            <TextInput
              style={styles.input}
              placeholder="Re-enter password to confirm"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          )}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleAuth}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
            </Text>
          </TouchableOpacity>

          {isLogin && (
            <TouchableOpacity 
              style={styles.forgotPasswordButton} 
              onPress={() => setShowForgotPassword(true)}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.switchButton} onPress={toggleMode}>
            <Text style={styles.switchText}>
              {isLogin
                ? "Don't have an account? Sign Up"
                : 'Already have an account? Sign In'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Forgot Password Modal */}
        {showForgotPassword && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Reset Password</Text>
              <Text style={styles.modalSubtitle}>
                Enter your email address and we'll send you a link to reset your password.
              </Text>
              
              <TextInput
                style={styles.input}
                placeholder="Enter your email address"
                value={resetEmail}
                onChangeText={setResetEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]} 
                  onPress={() => {
                    setShowForgotPassword(false);
                    setResetEmail('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, styles.resetButton, loading && styles.buttonDisabled]} 
                  onPress={handleForgotPassword}
                  disabled={loading}
                >
                  <Text style={styles.resetButtonText}>
                    {loading ? 'Sending...' : 'Send Reset Email'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
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
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  pickerContainer: {
    marginBottom: 15,
  },
  pickerLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
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
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchText: {
    color: '#007AFF',
    fontSize: 16,
  },
  forgotPasswordButton: {
    marginTop: 10,
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: '#FF6B6B',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    padding: 25,
    borderRadius: 15,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  resetButton: {
    backgroundColor: '#007AFF',
  },
  resetButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AuthScreen;
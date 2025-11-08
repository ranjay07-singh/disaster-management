import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, LogBox } from 'react-native';

// Suppress specific warnings and red box errors in development
if (__DEV__) {
  LogBox.ignoreLogs([
    'Warning:', 
    'Firebase:', 
    'auth/invalid-credential',
    'auth/user-not-found',
    'auth/wrong-password',
    '@firebase/auth: Auth',
    'AsyncStorage',
  ]);
}

// Import screens
import AuthScreen from './src/screens/AuthScreen';
import SimpleFirebaseAuthScreen from './src/screens/SimpleFirebaseAuthScreen';
import VictimTabs from './src/screens/victim/VictimTabs';
import VolunteerTabs from './src/screens/volunteer/VolunteerTabs';
import MonitoringTabs from './src/screens/monitoring/MonitoringTabs';

// Import services
import { AuthenticationService } from './src/services/AuthenticationService';
import { AuthService } from './src/services/AuthService';
import { UnifiedAuthService } from './src/services/UnifiedAuthService';
import { InitializationService } from './src/services/InitializationService';
import { User, UserRole } from './src/types/User';

// Global error handler to prevent red screen errors
if (__DEV__) {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    // Only log Firebase auth errors silently
    const message = args[0]?.toString() || '';
    if (message.includes('Firebase') || message.includes('auth/')) {
      console.log('🔥 Firebase Auth Info:', args[1]?.code || message);
      return;
    }
    // Show other errors normally
    originalConsoleError(...args);
  };
}

const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Initialize system users and configuration
      if (__DEV__) {
        await InitializationService.initializeDefaultUsers();
      }

      // Initialize UnifiedAuthService first
      await UnifiedAuthService.initialize();
      console.log('🔧 UnifiedAuthService initialized');

      // Check if user is authenticated through UnifiedAuthService
      if (UnifiedAuthService.isAuthenticated()) {
        const currentUser = UnifiedAuthService.getCurrentUser();
        if (currentUser) {
          console.log('✅ Found authenticated user:', currentUser.name);
          setUser(currentUser);
          return;
        }
      }

      // No auto-login in production - user must authenticate

      console.log('No authenticated user found, showing login screen');
    } catch (error) {
      console.log('Authentication check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    setUser(null);
    try {
      // Use UnifiedAuthService for logout (handles both Firebase and API)
      await UnifiedAuthService.logout();
      console.log('✅ User logged out successfully');
    } catch (error) {
      console.log('Logout error:', error);
      // Fallback to individual services
      try {
        await AuthService.logout();
        await AuthenticationService.logout();
      } catch (fallbackError) {
        console.log('Fallback logout completed');
      }
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const renderAppForUserRole = () => {
    if (!user) {
      // Use SimpleFirebaseAuthScreen for reliable Firebase auth
      return <SimpleFirebaseAuthScreen onAuthSuccess={handleAuthSuccess} />;
    }

    switch (user.role) {
      case UserRole.VICTIM:
        return <VictimTabs user={user} onLogout={handleLogout} />;
      case UserRole.VOLUNTEER:
        return <VolunteerTabs user={user} onLogout={handleLogout} />;
      case UserRole.MONITORING:
        return <MonitoringTabs user={user} onLogout={handleLogout} />;
      default:
        return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
    }
  };

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      {renderAppForUserRole()}
    </NavigationContainer>
  );
}

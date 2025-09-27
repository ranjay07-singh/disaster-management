import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';

// Import screens
import AuthScreen from './src/screens/AuthScreen';
import VictimTabs from './src/screens/victim/VictimTabs';
import VolunteerTabs from './src/screens/volunteer/VolunteerTabs';
import MonitoringTabs from './src/screens/monitoring/MonitoringTabs';

// Import services
import { AuthService } from './src/services/AuthService';
import { User, UserRole } from './src/types/User';

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
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.log('No authenticated user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    AuthService.logout();
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
      return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
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

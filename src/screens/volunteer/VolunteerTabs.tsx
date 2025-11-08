import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../../types/User';
import { EmergencyProvider } from '../../contexts/EmergencyContext';
import VolunteerHomeScreen from './VolunteerHomeScreen';
import ProvideHelpScreen from './ProvideHelpScreen';
import SafetyTricksScreen from '../victim/SafetyTricksScreen';
import VolunteerProfileScreen from './VolunteerProfileScreen';

const Tab = createBottomTabNavigator();

interface VolunteerTabsProps {
  user: User;
  onLogout: () => void;
}

const VolunteerTabs: React.FC<VolunteerTabsProps> = ({ user, onLogout }) => {
  return (
    <EmergencyProvider>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Provide Help') {
              iconName = focused ? 'medical' : 'medical-outline';
            } else if (route.name === 'Safety Tips') {
              iconName = focused ? 'shield' : 'shield-outline';
            } else if (route.name === 'Profile') {
              iconName = focused ? 'person' : 'person-outline';
            } else {
              iconName = 'help-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#34C759',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: {
            paddingBottom: 5,
            paddingTop: 5,
            height: 60,
          },
          headerStyle: {
            backgroundColor: '#34C759',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        })}
      >
        <Tab.Screen 
          name="Home" 
          children={() => <VolunteerHomeScreen user={user} />}
          options={{ title: 'Home' }}
        />
        <Tab.Screen 
          name="Provide Help" 
          children={() => <ProvideHelpScreen user={user} />}
          options={{ title: 'Provide Help' }}
        />
        <Tab.Screen 
          name="Safety Tips" 
          children={() => <SafetyTricksScreen user={user} />}
          options={{ title: 'Safety Tips' }}
        />
        <Tab.Screen 
          name="Profile" 
          children={() => <VolunteerProfileScreen user={user} onLogout={onLogout} />}
          options={{ title: 'Profile' }}
        />
      </Tab.Navigator>
    </EmergencyProvider>
  );
};

export default VolunteerTabs;
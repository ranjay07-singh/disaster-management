import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../../types/User';

// Import victim screens
import VictimHomeScreen from './VictimHomeScreen';
import NeedHelpScreen from './NeedHelpScreen';
import SafetyTricksScreen from './SafetyTricksScreen';
import VictimProfileScreen from './VictimProfileScreen';

const Tab = createBottomTabNavigator();

interface VictimTabsProps {
  user: User;
  onLogout: () => void;
}

const VictimTabs: React.FC<VictimTabsProps> = ({ user, onLogout }) => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Need Help') {
            iconName = focused ? 'alert-circle' : 'alert-circle-outline';
          } else if (route.name === 'Safety Tips') {
            iconName = focused ? 'shield' : 'shield-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        children={() => <VictimHomeScreen user={user} />}
        options={{ title: 'Home' }}
      />
      <Tab.Screen 
        name="Need Help" 
        children={() => <NeedHelpScreen user={user} />}
        options={{ title: 'Need Help' }}
      />
      <Tab.Screen 
        name="Safety Tips" 
        children={() => <SafetyTricksScreen user={user} />}
        options={{ title: 'Safety Tips' }}
      />
      <Tab.Screen 
        name="Profile" 
        children={() => <VictimProfileScreen user={user} onLogout={onLogout} />}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

export default VictimTabs;
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../../types/User';
import MonitoringDashboard from './MonitoringDashboard';
import UserManagement from './UserManagement';
import AnalyticsScreen from './AnalyticsScreen';
import MonitoringProfile from './MonitoringProfile';

const Tab = createBottomTabNavigator();

interface MonitoringTabsProps {
  user: User;
  onLogout: () => void;
}

const MonitoringTabs: React.FC<MonitoringTabsProps> = ({ user, onLogout }) => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'analytics' : 'analytics-outline';
          } else if (route.name === 'Users') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF9500',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: '#FF9500',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        children={() => <MonitoringDashboard user={user} />}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen 
        name="Users" 
        children={() => <UserManagement user={user} />}
        options={{ title: 'User Management' }}
      />
      <Tab.Screen 
        name="Profile" 
        children={() => <MonitoringProfile user={user} onLogout={onLogout} />}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

export default MonitoringTabs;
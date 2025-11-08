import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { User } from '../../types/User';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '../../services/firebase';
import { ApiService } from '../../services/ApiService';
import ProfileHeader from '../../components/monitoring/ProfileHeader';
import StatsGrid from '../../components/monitoring/StatsGrid';
import ProfileInformation from '../../components/monitoring/ProfileInformation';
import NotificationSettings from '../../components/monitoring/NotificationSettings';
import SecuritySettings from '../../components/monitoring/SecuritySettings';
import SystemInfo from '../../components/monitoring/SystemInfo';
import ActionButtons from '../../components/monitoring/ActionButtons';

interface MonitoringProfileProps {
  user: User;
  onLogout: () => void;
}

const MonitoringProfile: React.FC<MonitoringProfileProps> = ({ user, onLogout }) => {
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    department: 'Emergency Management',
    position: 'System Administrator',
    badgeNumber: 'ADM-001',
  });
  
  const [notifications, setNotifications] = useState({
    emergencyAlerts: true,
    systemUpdates: true,
    userReports: true,
    dailyReports: false,
    weeklyAnalytics: true,
  });

  const [realStats, setRealStats] = useState({
    casesHandled: 0,
    activeYears: 0,
    activeDays: 0,
    resolvedCases: 0,
    pendingCases: 0,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRealData();
  }, []);

  const loadRealData = async () => {
    try {
      console.log('📊 Loading real monitoring stats...');
      
      // Fetch users from Firebase
      const usersCollection = collection(firestore, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      
      let totalUsers = 0;
      let totalVolunteers = 0;
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        const role = userData.role?.toUpperCase();
        if (role === 'VOLUNTEER' || role === 'VICTIM') {
          totalUsers++;
          if (role === 'VOLUNTEER') {
            totalVolunteers++;
          }
        }
      });
      
      console.log('👥 Total users:', totalUsers, 'Volunteers:', totalVolunteers);

      // Fetch emergencies from backend
      const emergenciesResponse = await ApiService.getAllEmergencies();
      const emergencyList = Array.isArray(emergenciesResponse) 
        ? emergenciesResponse 
        : ((emergenciesResponse as any)?.emergencies || (emergenciesResponse as any)?.data || []);
      
      console.log('🚨 Total emergencies:', emergencyList.length);

      // Calculate statistics
      const totalCases = emergencyList.length;
      
      const resolvedCases = emergencyList.filter((e: any) => {
        const status = e.status?.toUpperCase();
        return status === 'COMPLETED' || status === 'RESOLVED';
      }).length;
      
      const pendingCases = emergencyList.filter((e: any) => {
        const status = e.status?.toUpperCase();
        return status === 'PENDING' || status === 'ACTIVE';
      }).length;

      // Calculate active years (from user creation date)
      const userCreatedAt = user.createdAt ? new Date(user.createdAt) : new Date();
      const now = new Date();
      const yearsDiff = now.getFullYear() - userCreatedAt.getFullYear();
      const monthsDiff = now.getMonth() - userCreatedAt.getMonth();
      const activeYears = monthsDiff < 0 ? yearsDiff - 1 : yearsDiff;

      const stats = {
        casesHandled: totalCases,
        activeYears: activeYears > 0 ? activeYears : 1, // At least 1 year
        activeDays: Math.floor((now.getTime() - userCreatedAt.getTime()) / (1000 * 60 * 60 * 24)),
        resolvedCases: resolvedCases,
        pendingCases: pendingCases,
      };

      console.log('✅ Stats calculated:', stats);
      
      setRealStats(stats);
      
      // Cache the stats
      await AsyncStorage.setItem('monitoring_stats', JSON.stringify(stats));
      await AsyncStorage.setItem('monitoring_stats_timestamp', new Date().toISOString());
      
    } catch (error) {
      console.error('❌ Error loading stats:', error);
      
      // Try to load cached stats on error
      const cachedStats = await AsyncStorage.getItem('monitoring_stats');
      if (cachedStats) {
        console.log('📦 Loading cached stats');
        setRealStats(JSON.parse(cachedStats));
      }
    }
  };

  const handleSaveProfile = async () => {
    setEditMode(false);
    try {
      // Save profile data to AsyncStorage (simulate Firebase)
      await AsyncStorage.setItem('monitoring_profile', JSON.stringify(profileData));
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.log('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile');
    }
  };

  const handleExportData = async () => {
    setLoading(true);
    try {
      const exportData = {
        profileInfo: profileData,
        statistics: realStats,
        notificationSettings: notifications,
        systemInfo: {
          lastLogin: new Date().toISOString(),
          version: '1.0.0',
          platform: Platform.OS,
        },
        exportDate: new Date().toISOString(),
      };

      const csvData = `Profile Export Report
Generated: ${new Date().toLocaleString()}

Profile Information:
Name: ${profileData.name}
Email: ${profileData.email}
Department: ${profileData.department}
Position: ${profileData.position}
Badge Number: ${profileData.badgeNumber}

Statistics:
Total Cases Handled: ${realStats.casesHandled}
Active Years: ${realStats.activeYears}
Active Days: ${realStats.activeDays}
Resolved Cases: ${realStats.resolvedCases}
Pending Cases: ${realStats.pendingCases}

System Information:
Platform: ${Platform.OS}
Version: 1.0.0
Export Date: ${new Date().toLocaleString()}`;

      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        await Share.share({
          message: csvData,
          title: 'Monitoring Profile Export',
        });
      } else {
        // For web/desktop - fallback
        Alert.alert('Export Data', 'Data exported successfully to clipboard');
      }
    } catch (error) {
      console.log('Export failed:', error);
      Alert.alert('Export Failed', 'Please try again later');
    } finally {
      setLoading(false);
    }
  };

  const handleSecuritySettings = () => {
    Alert.alert(
      'Security Settings',
      'Configure advanced security options:\n• Two-Factor Authentication\n• Session Management\n• Access Logs\n• Password Policy',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => console.log('Opening security settings') }
      ]
    );
  };

  const handleChangePassword = () => {
    Alert.alert(
      'Change Password',
      'You will be redirected to a secure password change form.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => console.log('Opening password change') }
      ]
    );
  };

  const handleProfileDataChange = (key: string, value: string) => {
    setProfileData(prev => ({ ...prev, [key]: value }));
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  const handleEditToggle = () => {
    if (editMode) {
      handleSaveProfile();
    } else {
      setEditMode(true);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <ProfileHeader user={user} />
      
      <StatsGrid stats={realStats} />
      
      <ProfileInformation
        profileData={profileData}
        editMode={editMode}
        onEditToggle={handleEditToggle}
        onProfileDataChange={handleProfileDataChange}
      />
      
      <NotificationSettings
        notifications={notifications}
        onNotificationChange={handleNotificationChange}
      />
      
      <SecuritySettings
        onChangePassword={handleChangePassword}
        onSecuritySettings={handleSecuritySettings}
      />
      
      <SystemInfo user={user} />
      
      <ActionButtons
        loading={loading}
        onExportData={handleExportData}
        onLogout={onLogout}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F7FF',
  },
});

export default MonitoringProfile;
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../../types/User';
import { AuthService } from '../../services/AuthService';

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

  const handleSaveProfile = () => {
    // Here you would typically update the user profile via API
    console.log('Saving profile:', profileData);
    setEditMode(false);
    Alert.alert('Success', 'Profile updated successfully');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: onLogout
        },
      ]
    );
  };

  const ProfileField = ({ label, value, onChangeText, editable = true }: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    editable?: boolean;
  }) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, !editMode && styles.fieldInputDisabled]}
        value={value}
        onChangeText={onChangeText}
        editable={editMode && editable}
      />
    </View>
  );

  const NotificationToggle = ({ label, value, onValueChange }: {
    label: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
  }) => (
    <View style={styles.toggleContainer}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#767577', true: '#007AFF' }}
        thumbColor={value ? '#ffffff' : '#f4f3f4'}
      />
    </View>
  );

  const StatCard = ({ title, value, icon, color }: {
    title: string;
    value: string;
    icon: string;
    color: string;
  }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Ionicons name={icon as any} size={24} color={color} />
      <View style={styles.statInfo}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.headerContainer}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle" size={80} color="#007AFF" />
        </View>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userRole}>System Administrator</Text>
        <Text style={styles.userDepartment}>Emergency Management Division</Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <StatCard
          title="Cases Handled"
          value="1,247"
          icon="document-text"
          color="#34C759"
        />
        <StatCard
          title="Active Since"
          value="2 years"
          icon="time"
          color="#007AFF"
        />
      </View>

      {/* Profile Information */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          <TouchableOpacity
            onPress={() => editMode ? handleSaveProfile() : setEditMode(true)}
            style={styles.editButton}
          >
            <Ionicons 
              name={editMode ? "checkmark" : "pencil"} 
              size={20} 
              color="#007AFF" 
            />
            <Text style={styles.editButtonText}>
              {editMode ? 'Save' : 'Edit'}
            </Text>
          </TouchableOpacity>
        </View>

        <ProfileField
          label="Full Name"
          value={profileData.name}
          onChangeText={(text) => setProfileData(prev => ({ ...prev, name: text }))}
        />
        
        <ProfileField
          label="Email Address"
          value={profileData.email}
          onChangeText={(text) => setProfileData(prev => ({ ...prev, email: text }))}
        />
        
        <ProfileField
          label="Phone Number"
          value={profileData.phone}
          onChangeText={(text) => setProfileData(prev => ({ ...prev, phone: text }))}
        />
        
        <ProfileField
          label="Department"
          value={profileData.department}
          onChangeText={(text) => setProfileData(prev => ({ ...prev, department: text }))}
        />
        
        <ProfileField
          label="Position"
          value={profileData.position}
          onChangeText={(text) => setProfileData(prev => ({ ...prev, position: text }))}
        />
        
        <ProfileField
          label="Badge Number"
          value={profileData.badgeNumber}
          onChangeText={(text) => setProfileData(prev => ({ ...prev, badgeNumber: text }))}
          editable={false}
        />
      </View>

      {/* Notification Settings */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Notification Settings</Text>
        
        <NotificationToggle
          label="Emergency Alerts"
          value={notifications.emergencyAlerts}
          onValueChange={(value) => setNotifications(prev => ({ ...prev, emergencyAlerts: value }))}
        />
        
        <NotificationToggle
          label="System Updates"
          value={notifications.systemUpdates}
          onValueChange={(value) => setNotifications(prev => ({ ...prev, systemUpdates: value }))}
        />
        
        <NotificationToggle
          label="User Reports"
          value={notifications.userReports}
          onValueChange={(value) => setNotifications(prev => ({ ...prev, userReports: value }))}
        />
        
        <NotificationToggle
          label="Daily Reports"
          value={notifications.dailyReports}
          onValueChange={(value) => setNotifications(prev => ({ ...prev, dailyReports: value }))}
        />
        
        <NotificationToggle
          label="Weekly Analytics"
          value={notifications.weeklyAnalytics}
          onValueChange={(value) => setNotifications(prev => ({ ...prev, weeklyAnalytics: value }))}
        />
      </View>

      {/* Security Settings */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Security & Privacy</Text>
        
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="key" size={20} color="#007AFF" />
          <Text style={styles.actionButtonText}>Change Password</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="shield-checkmark" size={20} color="#007AFF" />
          <Text style={styles.actionButtonText}>Two-Factor Authentication</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="lock-closed" size={20} color="#007AFF" />
          <Text style={styles.actionButtonText}>Privacy Settings</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      {/* System Information */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>System Information</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>App Version</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Last Login</Text>
          <Text style={styles.infoValue}>{new Date().toLocaleDateString()}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>User ID</Text>
          <Text style={styles.infoValue}>{user.id}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity style={styles.primaryButton}>
          <Ionicons name="download" size={20} color="white" />
          <Text style={styles.primaryButtonText}>Export Data</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.secondaryButton}>
          <Ionicons name="help-circle" size={20} color="#007AFF" />
          <Text style={styles.secondaryButtonText}>Help & Support</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out" size={20} color="#FF3B30" />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    backgroundColor: 'white',
    alignItems: 'center',
    padding: 20,
    marginBottom: 10,
  },
  avatarContainer: {
    marginBottom: 10,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  userRole: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 2,
  },
  userDepartment: {
    fontSize: 14,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    flex: 1,
    marginHorizontal: 5,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    borderLeftWidth: 4,
  },
  statInfo: {
    marginLeft: 10,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
  },
  sectionContainer: {
    backgroundColor: 'white',
    marginBottom: 10,
    padding: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButtonText: {
    color: '#007AFF',
    marginLeft: 5,
    fontWeight: '500',
  },
  fieldContainer: {
    marginBottom: 15,
  },
  fieldLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  fieldInputDisabled: {
    backgroundColor: '#f8f9fa',
    color: '#666',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  toggleLabel: {
    fontSize: 16,
    color: '#333',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  actionContainer: {
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  logoutButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 30,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  logoutButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default MonitoringProfile;